import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MathProblem, GameState, Difficulty, GameMode } from './types';
import { generateProblem } from './engine/mathEngine';
import { getMathTip } from './services/geminiService';
import Button from './components/Button';
import GameCard from './components/GameCard';

const INITIAL_TIME = 45;
const SCORE_PER_LEVEL = 150;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    streak: 0,
    level: 1,
    highScore: parseInt(localStorage.getItem('math_pulse_highscore') || '0'),
    timeLeft: INITIAL_TIME,
    status: 'idle',
    totalAnswered: 0,
    correctAnswered: 0
  });

  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mode, setMode] = useState<GameMode>('choice');
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mascotText, setMascotText] = useState("Let's play!");
  const [showMascotBubble, setShowMascotBubble] = useState(true);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playSound = (type: 'correct' | 'wrong' | 'start' | 'reward' | 'level' | 'burp') => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'burp') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'level') {
      osc.type = 'triangle';
      [440, 554, 659, 880, 1108].forEach((f, i) => {
        osc.frequency.setValueAtTime(f, now + i * 0.1);
      });
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'wrong') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'start') {
      osc.type = 'square';
      [440, 554, 659, 880].forEach((f, i) => osc.frequency.setValueAtTime(f, now + i * 0.08));
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  };

  const speak = (text: string) => {
    setMascotText(text);
    setShowMascotBubble(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.8; 
      utterance.rate = 1.1;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Kid') || v.name.includes('Samantha') || v.name.includes('Google'));
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    }
    setTimeout(() => setShowMascotBubble(false), 3000);
  };

  const startNewGame = () => {
    initAudio();
    setGameState({
      score: 0,
      streak: 0,
      level: 1,
      highScore: parseInt(localStorage.getItem('math_pulse_highscore') || '0'),
      timeLeft: INITIAL_TIME,
      status: 'playing',
      totalAnswered: 0,
      correctAnswered: 0
    });
    setAiTip(null);
    playSound('start');
    speak("Go Hero! Let's get silly!");
    nextQuestion(1);
  };

  const nextQuestion = (level: number) => {
    const problem = generateProblem(difficulty, mode, level);
    setCurrentProblem(problem);
    setFeedback(null);
    setIsProcessing(false);
  };

  const handleAnswer = async (userAnswer: string | number) => {
    if (isProcessing || !currentProblem) return;
    setIsProcessing(true);

    const isCorrect = userAnswer.toString().toUpperCase() === currentProblem.answer.toString().toUpperCase();

    setGameState(prev => ({
      ...prev,
      totalAnswered: prev.totalAnswered + 1,
      correctAnswered: isCorrect ? prev.correctAnswered + 1 : prev.correctAnswered
    }));

    if (isCorrect) {
      setFeedback('correct');
      playSound('correct');
      if (mode === 'monster_munch') playSound('burp');
      
      const cheers = ["Yippee! 🌈", "Star! ⭐", "Magic! 🪄", "Boom! 💥", "Wow! 🐯", "Silly Goose! 🦆", "Burp! 🫢"];
      speak(cheers[Math.floor(Math.random() * cheers.length)]);

      setGameState(prev => {
        const bonus = Math.floor(prev.streak / 5) * 5;
        const newScore = prev.score + 10 + bonus;
        const newStreak = prev.streak + 1;
        const newLevel = Math.floor(newScore / SCORE_PER_LEVEL) + 1;
        
        if (newLevel > prev.level) {
          playSound('level');
          speak(`Level ${newLevel}! High Five! 🐾`);
        }

        return { ...prev, score: newScore, streak: newStreak, level: newLevel, timeLeft: Math.min(prev.timeLeft + 3, INITIAL_TIME + 20) };
      });
      
      setTimeout(() => nextQuestion(gameState.level), 700);
    } else {
      setFeedback('wrong');
      playSound('wrong');
      const funnyFails = ["Whoopsie! 💩", "Wait, what? 🤡", "Almost had it! 🦖", "Monkey brains! 🐒"];
      speak(funnyFails[Math.floor(Math.random() * funnyFails.length)]);
      
      setGameState(prev => ({ ...prev, streak: 0 }));
      const tip = await getMathTip(currentProblem.question, userAnswer.toString());
      setAiTip(tip);
      setTimeout(() => nextQuestion(gameState.level), 2000);
    }
  };

  useEffect(() => {
    let timer: any;
    if (gameState.status === 'playing' && gameState.timeLeft > 0) {
      timer = setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
            clearInterval(timer);
            speak("Time is up! You're a Math Wizard! 🍭");
            return { ...prev, timeLeft: 0, status: 'gameover' };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState.status]);

  useEffect(() => {
    if (gameState.score > gameState.highScore) {
      setGameState(prev => ({ ...prev, highScore: prev.score }));
      localStorage.setItem('math_pulse_highscore', gameState.score.toString());
    }
  }, [gameState.score]);

  const levelProgress = useMemo(() => (gameState.score % SCORE_PER_LEVEL) / SCORE_PER_LEVEL * 100, [gameState.score]);
  const accuracy = gameState.totalAnswered > 0 ? Math.round((gameState.correctAnswered / gameState.totalAnswered) * 100) : 100;
  
  const reward = useMemo(() => {
    if (accuracy === 100) return { name: "Professional Fart Listener", badge: "💎", bg: "bg-[#B892FF]" };
    if (accuracy >= 85) return { name: "Unicorn Whisperer", badge: "🥇", bg: "bg-[#FFD670]" };
    return { name: "Dancing Banana", badge: "🥉", bg: "bg-[#99FFD3]" };
  }, [accuracy]);

  const modeLabels: Record<GameMode, { label: string, icon: string, color: string }> = {
    monster_munch: { label: 'Monster Munch', icon: '👹', color: 'bg-[#FF85B3]' },
    choice: { label: 'Potions', icon: '🧪', color: 'bg-[#B892FF]' },
    classic: { label: 'Number', icon: '⌨️', color: 'bg-[#70D6FF]' },
    comparison: { label: 'Balance', icon: '⚖️', color: 'bg-[#99FFD3]' },
    sequence: { label: 'Patterns', icon: '🔢', color: 'bg-[#FFD670]' },
    missing_op: { label: 'Hunter', icon: '❓', color: 'bg-[#FF85B3]' },
    true_false: { label: 'Yes/No', icon: '✅', color: 'bg-[#FFD670]' }
  };

  return (
    <div className="flex flex-col min-h-full w-full relative">
      
      {/* HUD */}
      {gameState.status === 'playing' && (
        <div className="fixed top-0 left-0 w-full p-2 md:p-4 grid grid-cols-3 items-center z-50 pointer-events-none gap-2">
          <div className="flex flex-col gap-1 md:gap-2">
            <button onClick={() => setGameState(prev => ({ ...prev, status: 'idle' }))} className="pointer-events-auto bg-white text-[#FF85B3] w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl sticker-effect flex items-center justify-center">
              <i className="fas fa-home text-lg md:text-3xl"></i>
            </button>
            <div className="bg-white rounded-xl md:rounded-3xl p-2 md:p-4 sticker-effect pointer-events-auto flex flex-col min-w-[70px] md:min-w-[120px]">
              <div className="text-[8px] md:text-[10px] font-black uppercase text-slate-400">Score 🍭</div>
              <div className="text-sm md:text-3xl font-black text-[#FFD670] leading-tight">{gameState.score}</div>
              <div className="h-1.5 md:h-3 w-full bg-slate-100 rounded-full mt-1 md:mt-2 overflow-hidden border border-white">
                <div className="h-full bg-[#FFD670]" style={{ width: `${levelProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 md:gap-2">
            <div className="bg-white rounded-2xl md:rounded-[40px] px-3 md:px-8 py-2 md:py-4 flex items-center gap-2 md:gap-6 sticker-effect pointer-events-auto">
              <div className="text-center">
                <div className="text-[8px] md:text-[10px] font-black uppercase text-slate-400">Time ⏰</div>
                <div className={`text-sm md:text-3xl font-black ${gameState.timeLeft < 10 ? 'text-[#FF85B3] animate-pulse' : 'text-[#70D6FF]'}`}>{gameState.timeLeft}s</div>
              </div>
              <div className="w-0.5 md:w-1 h-6 md:h-10 bg-slate-50 rounded-full" />
              <div className="text-center">
                <div className="text-[8px] md:text-[10px] font-black uppercase text-slate-400">🔥</div>
                <div className="text-sm md:text-3xl font-black text-orange-400">{gameState.streak}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="bg-white rounded-xl md:rounded-3xl px-3 md:px-6 py-2 md:py-4 sticker-effect pointer-events-auto text-right">
              <div className="text-[8px] md:text-[10px] font-black uppercase text-slate-400">Lvl 🐾</div>
              <div className="text-sm md:text-3xl font-black text-[#B892FF]">#{gameState.level}</div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Mascot */}
      {(gameState.status === 'playing' || gameState.status === 'idle') && (
        <div className="fixed bottom-4 right-4 md:bottom-12 md:right-12 z-[100] flex flex-col items-end pointer-events-none">
          {showMascotBubble && (
            <div className="speech-bubble mb-2 animate-bounce text-[10px] md:text-lg font-black text-slate-700 max-w-[120px] md:max-w-[200px] text-center">
              {mascotText}
            </div>
          )}
          <div className="w-14 h-14 md:w-32 md:h-32 bg-[#FFD670] rounded-full border-2 md:border-4 border-white shadow-xl flex items-center justify-center text-3xl md:text-7xl animate-float sticker-effect pointer-events-auto">
            <i className="fas fa-otter"></i>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        
        {/* Idle Screen */}
        {gameState.status === 'idle' && (
          <div className="max-w-4xl w-full text-center space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-700 pt-8 md:pt-0">
            <div className="space-y-2 md:space-y-4">
              <div className="inline-block bg-white px-4 md:px-8 py-1.5 md:py-2 rounded-full text-[#70D6FF] font-black text-[10px] md:text-sm sticker-effect animate-jiggle">
                 HI, SILLY GENIUS! 🤡
              </div>
              <h1 className="text-5xl md:text-[120px] font-black text-slate-800 leading-none drop-shadow-[0_6px_0_#FFE5D9] md:drop-shadow-[0_12px_0_#FFE5D9]">
                Math<span className="text-[#70D6FF]">Pulse</span><span className="text-[#FFD670]">!</span>
              </h1>
            </div>

            <div className="bg-white rounded-3xl md:rounded-[50px] p-6 md:p-16 space-y-8 md:space-y-10 sticker-effect border-white shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div className="space-y-2 md:space-y-4 text-left">
                  <label className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest ml-2 md:ml-4">1. Difficulty 🦁</label>
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                      <button key={d} onClick={() => setDifficulty(d)} className={`py-2 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-lg transition-all border-b-4 md:border-b-8 ${difficulty === d ? 'bg-[#70D6FF] text-white border-[#5BB8E0] -translate-y-0.5' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        {d === 'easy' ? '⭐' : d === 'medium' ? '💎' : '👑'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 md:space-y-4 text-left">
                  <label className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest ml-2 md:ml-4">2. Pick Fun! 🧩</label>
                  <div className="grid grid-cols-3 md:grid-cols-2 gap-2 md:gap-3">
                    {(Object.keys(modeLabels) as GameMode[]).map(m => (
                      <button key={m} onClick={() => setMode(m)} className={`p-2 md:p-4 rounded-xl md:rounded-2xl transition-all border-b-4 md:border-b-8 flex flex-col items-center gap-0.5 ${mode === m ? `${modeLabels[m].color} text-white border-black/10 -translate-y-0.5` : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        <span className="text-xl md:text-2xl">{modeLabels[m].icon}</span>
                        <span className="font-black text-[8px] md:text-[10px] uppercase truncate w-full">{modeLabels[m].label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={startNewGame} variant="success" className="w-full py-6 md:py-10 text-2xl md:text-4xl rounded-2xl md:rounded-[40px] border-b-8 md:border-b-[16px]">
                LET'S GO! 🚀
              </Button>
            </div>
          </div>
        )}

        {/* Game Loop Screen */}
        {gameState.status === 'playing' && currentProblem && (
          <div className="w-full max-w-2xl flex flex-col items-center gap-4 md:gap-12 animate-in fade-in slide-in-from-bottom-8 mt-16 md:mt-24">
            <GameCard problem={currentProblem} onAnswer={handleAnswer} feedback={feedback} />
            {aiTip && (
              <div className="w-full bg-white border-4 md:border-8 border-[#FDFFB6] rounded-2xl md:rounded-[40px] p-4 md:p-8 sticker-effect animate-in slide-in-from-bottom-4 shadow-lg">
                <div className="flex items-center gap-3 md:gap-6">
                  <div className="bg-[#FFD670] text-white w-10 h-10 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl md:text-3xl shadow-md shrink-0"><i className="fas fa-lightbulb"></i></div>
                  <p className="text-slate-700 font-bold text-xs md:text-xl italic">"{aiTip}"</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Screen */}
        {gameState.status === 'gameover' && (
          <div className="max-w-xl w-full text-center space-y-6 md:space-y-10 animate-in zoom-in fade-in duration-500 bg-white p-6 md:p-16 rounded-3xl md:rounded-[60px] sticker-effect relative overflow-hidden">
            <div className="rainbow-bg absolute top-0 left-0 w-full h-2 md:h-3"></div>
            <div className={`${reward.bg} border-4 md:border-8 border-white rounded-3xl md:rounded-[50px] w-32 h-32 md:w-40 md:h-40 flex flex-col items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl animate-bounce`}>
              <div className="text-5xl md:text-7xl">{reward.badge}</div>
              <div className="absolute -bottom-2 bg-white px-3 py-0.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-700">{reward.name}</div>
            </div>
            <div className="space-y-1 md:space-y-2">
              <h2 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter">DONE! 🎈</h2>
              <p className="text-sm md:text-lg font-black text-slate-400">YOU ARE THE {reward.name.toUpperCase()}!</p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-6">
              <div className="bg-[#FDFFB6] p-2 md:p-8 rounded-2xl md:rounded-3xl border-b-4 md:border-b-8 border-[#EAD9C8]">
                <div className="text-[8px] md:text-[10px] font-black">Score</div>
                <div className="text-xl md:text-4xl font-black">{gameState.score}</div>
              </div>
              <div className="bg-[#99FFD3] p-2 md:p-8 rounded-2xl md:rounded-3xl border-b-4 md:border-b-8 border-[#B8EAD9]">
                <div className="text-[8px] md:text-[10px] font-black">Acc</div>
                <div className="text-xl md:text-4xl font-black">{accuracy}%</div>
              </div>
              <div className="bg-[#70D6FF] p-2 md:p-8 rounded-2xl md:rounded-3xl border-b-4 md:border-b-8 border-[#5BB8E0]">
                <div className="text-[8px] md:text-[10px] font-black">Lvl</div>
                <div className="text-xl md:text-4xl font-black">{gameState.level}</div>
              </div>
            </div>
            <div className="space-y-3 pt-4 md:pt-6">
              <Button onClick={startNewGame} variant="primary" className="w-full py-5 md:py-8 text-xl md:text-3xl rounded-2xl md:rounded-3xl">MORE SILLY! 🦖</Button>
              <Button variant="ghost" onClick={() => setGameState(prev => ({ ...prev, status: 'idle' }))} className="w-full py-3 text-sm md:text-xl rounded-xl opacity-60">HOME 🏠</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;