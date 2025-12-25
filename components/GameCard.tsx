import React, { useState, useEffect, useRef } from 'react';
import { MathProblem } from '../types';
import Button from './Button';

interface Sparkle {
  id: number;
  left: number;
  top: number;
  color: string;
  size: number;
  dx: number;
  dy: number;
  dr: number;
  emoji?: string;
}

interface GameCardProps {
  problem: MathProblem;
  onAnswer: (answer: string | number) => void;
  feedback: 'correct' | 'wrong' | null;
}

const MonsterMunch: React.FC<{ feedback: 'correct' | 'wrong' | null }> = ({ feedback }) => {
  return (
    <div className="relative w-24 h-24 md:w-40 md:h-40 mb-4 animate-float">
      {/* Body */}
      <div className={`w-full h-full rounded-full transition-all duration-300 border-4 border-white shadow-lg flex items-center justify-center text-6xl md:text-8xl 
        ${feedback === 'correct' ? 'bg-[#99FFD3] scale-125' : feedback === 'wrong' ? 'bg-[#FF85B3] animate-shake' : 'bg-[#B892FF]'}`}>
        {feedback === 'correct' ? '😋' : feedback === 'wrong' ? '🤮' : '👹'}
      </div>
      {/* Eyes that blink */}
      <div className="absolute top-1/4 left-1/4 flex gap-4 animate-pulse">
        <div className="w-2 h-2 md:w-4 md:h-4 bg-white rounded-full"></div>
        <div className="w-2 h-2 md:w-4 md:h-4 bg-white rounded-full"></div>
      </div>
      {/* Arms */}
      <div className="absolute -left-4 top-1/2 w-4 h-8 bg-inherit rounded-full rotate-45 border-2 border-white"></div>
      <div className="absolute -right-4 top-1/2 w-4 h-8 bg-inherit rounded-full -rotate-45 border-2 border-white"></div>
    </div>
  );
};

const GameCard: React.FC<GameCardProps> = ({ problem, onAnswer, feedback }) => {
  const [inputValue, setInputValue] = useState('');
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [emptyError, setEmptyError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const celebratoryEmojis = [
    '🎉', '✨', '🎈', '⭐', '🎊', '🔥', '🚀', '🌈', '🦄', '🍕', '🍦', 
    '🍩', '🍔', '🍰', '🍭', '🧸', '🦁', '🦉', '🦊', '🐨', '🦖', '⚽',
    '🐱', '🐶', '🐯', '🐼', '🐸', '🐙', '🦖', '🐉', '👾', '🥇', '🎖️', 
    '🪄', '🧚', '🦸‍♂️', '🦸‍♀️', '🛸', '🪐', '🎸'
  ];

  useEffect(() => {
    if (problem.mode === 'classic' && inputRef.current) {
      inputRef.current.focus();
    }
    setInputValue('');
    setEmptyError(false);
  }, [problem]);

  useEffect(() => {
    if (feedback === 'correct') {
      const colors = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c', '#facc15', '#818cf8', '#2dd4bf'];
      const newSparkles = Array.from({ length: window.innerWidth < 640 ? 25 : 50 }).map((_, i) => ({
        id: Math.random() + i,
        left: 50,
        top: 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 25 + 15,
        dx: (Math.random() - 0.5) * (window.innerWidth < 640 ? 400 : 800),
        dy: (Math.random() - 0.5) * (window.innerWidth < 640 ? 400 : 800),
        dr: Math.random() * 720,
        emoji: Math.random() > 0.5 ? celebratoryEmojis[Math.floor(Math.random() * celebratoryEmojis.length)] : undefined
      }));
      setSparkles(newSparkles);
      const timer = setTimeout(() => setSparkles([]), 1200);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (problem.mode === 'classic' && !inputValue) {
      setEmptyError(true);
      setTimeout(() => setEmptyError(false), 500);
      return;
    }
    onAnswer(inputValue);
  };

  const cardClass = `
    relative w-full p-4 md:p-12 rounded-3xl md:rounded-[60px] border-4 md:border-[10px] transition-all duration-300 bg-white shadow-xl flex flex-col items-center
    ${feedback === 'correct' ? 'border-emerald-400 scale-105' : ''}
    ${feedback === 'wrong' ? 'border-rose-400 animate-shake' : 'border-sky-50'}
  `;

  return (
    <div className={cardClass}>
      {sparkles.map((s) => (
        <div
          key={s.id}
          className={s.emoji ? "absolute pointer-events-none z-[100] select-none animate-sparkle-pop" : "sparkle-particle"}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            color: s.color,
            fontSize: s.emoji ? `${s.size}px` : undefined,
            width: !s.emoji ? `${s.size}px` : undefined,
            height: !s.emoji ? `${s.size}px` : undefined,
            '--dx': `${s.dx}px`,
            '--dy': `${s.dy}px`,
            '--dr': `${s.dr}deg`
          } as any}
        >
          {s.emoji}
        </div>
      ))}

      {problem.mode === 'monster_munch' && <MonsterMunch feedback={feedback} />}

      <div className="flex flex-col items-center gap-4 md:gap-8 w-full">
        <div className="bg-sky-50 px-3 md:px-6 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase text-sky-600 tracking-widest border border-sky-100">
          {problem.difficulty} • {problem.mode.replace('_', ' ')}
        </div>

        <div className="text-3xl sm:text-5xl md:text-[60px] font-black text-center text-slate-800 select-none tracking-tight leading-tight py-2">
          {problem.question}
        </div>

        {problem.mode === 'classic' ? (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="?"
              className={`w-full border-4 md:border-8 rounded-2xl md:rounded-[32px] p-4 md:p-8 text-4xl md:text-7xl font-black text-center outline-none transition-colors ${emptyError ? 'border-rose-300 bg-rose-50' : 'border-slate-100 bg-slate-50 focus:border-sky-300 focus:bg-white'}`}
            />
            <Button variant="primary" className="w-full py-4 md:py-8 text-xl md:text-3xl rounded-xl md:rounded-3xl">SOLVE! 🦕</Button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:gap-6 w-full">
            {problem.options?.map((opt, i) => {
              const colors = ['bg-[#FF85B3]', 'bg-[#70D6FF]', 'bg-[#FFD670]', 'bg-[#99FFD3]'];
              const borderColors = ['border-[#D6286B]', 'border-[#0A9396]', 'border-[#D4A100]', 'border-[#00A36C]'];
              
              return (
                <button
                  key={i}
                  onClick={() => onAnswer(opt)}
                  className={`relative ${colors[i % 4]} text-white rounded-2xl md:rounded-[40px] p-4 md:p-8 text-2xl md:text-5xl font-black transition-all transform active:scale-95 border-b-4 md:border-b-8 ${borderColors[i % 4]} overflow-hidden`}
                >
                  <span className="relative z-10">{opt}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {feedback && (
        <div className={`absolute -top-4 -right-4 md:-top-8 md:-right-8 w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[32px] flex items-center justify-center shadow-lg border-2 md:border-4 border-white z-50 ${feedback === 'correct' ? 'bg-amber-400 animate-bounce' : 'bg-rose-400'}`}>
          {feedback === 'correct' ? <i className="fas fa-check text-white text-xl md:text-3xl"></i> : <i className="fas fa-times text-white text-xl md:text-3xl"></i>}
        </div>
      )}
    </div>
  );
};

export default GameCard;