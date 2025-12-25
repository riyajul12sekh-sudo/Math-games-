import { MathProblem, Difficulty, GameMode, Operator } from '../types';

const SETTINGS = {
  easy: { min: 1, max: 12, ops: ['+', '-'] as Operator[] },
  medium: { min: 10, max: 30, ops: ['+', '-', '*'] as Operator[] },
  hard: { min: 20, max: 100, ops: ['+', '-', '*', '/'] as Operator[] }
};

const SILLY_OBJECTS = ['🍕', '💩', '🍌', '🍦', '🍩', '🍔', '🦄', '🦖', '🎈', '🤡', '🦆', '🦷', '👣'];

export const generateProblem = (
  difficulty: Difficulty, 
  mode: GameMode, 
  level: number
): MathProblem => {
  const { min, max, ops } = SETTINGS[difficulty];
  const operator = ops[Math.floor(Math.random() * ops.length)];
  
  const scaledMax = max + Math.floor(level * 1.5);
  let num1 = Math.floor(Math.random() * (scaledMax - min + 1)) + min;
  let num2 = Math.floor(Math.random() * (scaledMax - min + 1)) + min;

  let question = '';
  let answer: number | string = 0;
  let options: (number | string)[] = [];
  const funnyObject = SILLY_OBJECTS[Math.floor(Math.random() * SILLY_OBJECTS.length)];

  switch (mode) {
    case 'sequence': {
      const step = difficulty === 'easy' ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 10) + 2;
      const start = Math.floor(Math.random() * 20);
      const seq = [start, start + step, start + step * 2, start + step * 3];
      answer = start + step * 4;
      question = `${seq.join(', ')}, ?`;
      
      const set = new Set<number>();
      set.add(answer as number);
      while(set.size < 4) {
        set.add((answer as number) + (Math.floor(Math.random() * 21) - 10));
      }
      options = Array.from(set).sort((a, b) => a - b);
      break;
    }

    case 'missing_op': {
      const availableOps = SETTINGS[difficulty].ops;
      const actualOp = availableOps[Math.floor(Math.random() * availableOps.length)];
      let a = num1;
      let b = num2;
      let result = 0;

      if (actualOp === '+') result = a + b;
      else if (actualOp === '-') { if (a < b) [a, b] = [b, a]; result = a - b; }
      else if (actualOp === '*') result = a * b;
      else if (actualOp === '/') { result = a; a = a * b; }

      question = `${a} [ ? ] ${b} = ${result}`;
      answer = actualOp === '*' ? '×' : actualOp === '/' ? '÷' : actualOp;
      options = availableOps.map(o => o === '*' ? '×' : o === '/' ? '÷' : o);
      break;
    }

    case 'true_false': {
      const isCorrect = Math.random() > 0.5;
      let result = 0;
      let n1 = num1;
      let n2 = num2;
      
      if (operator === '+') result = n1 + n2;
      else if (operator === '-') { if (n1 < n2) [n1, n2] = [n2, n1]; result = n1 - n2; }
      else if (operator === '*') result = n1 * n2;
      else if (operator === '/') { result = n1; n1 = n1 * n2; }

      const displayResult = isCorrect ? result : result + (Math.random() > 0.5 ? 1 : -1);
      const opSymbol = operator === '*' ? '×' : operator === '/' ? '÷' : operator;
      question = `${n1} ${opSymbol} ${n2} = ${displayResult}`;
      answer = isCorrect ? 'YES' : 'NO';
      options = ['YES', 'NO'];
      break;
    }

    case 'comparison': {
      const opSym = operator === '*' ? '×' : operator === '/' ? '÷' : operator;
      const val1 = operator === '+' ? num1 + num2 : operator === '-' ? Math.abs(num1 - num2) : num1 * num2;
      const val2 = Math.floor(Math.random() * (scaledMax * 2)) + 1;
      
      question = `${num1} ${opSym} ${num2} [ ? ] ${val2}`;
      answer = val1 > val2 ? '>' : val1 < val2 ? '<' : '=';
      options = ['<', '=', '>'];
      break;
    }

    case 'monster_munch':
    case 'choice':
    case 'classic':
    default: {
      if (operator === '+') { answer = num1 + num2; question = `${num1} + ${num2}`; }
      else if (operator === '-') { if (num1 < num2) [num1, num2] = [num2, num1]; answer = num1 - num2; question = `${num1} - ${num2}`; }
      else if (operator === '*') { answer = num1 * num2; question = `${num1} × ${num2}`; }
      else if (operator === '/') { answer = num1; num1 = num1 * num2; question = `${num1} ÷ ${num2}`; }

      // Inject silly object for visual humor
      if (Math.random() > 0.5) {
        question = question.replace(/(\d+)/g, `$1 ${funnyObject}`);
      }

      if (mode === 'choice' || mode === 'monster_munch') {
        const correct = answer as number;
        const set = new Set<number>();
        set.add(correct);
        while (set.size < 4) {
          const fake = correct + Math.floor(Math.random() * 21) - 10;
          if (fake >= 0 && fake !== correct) set.add(fake);
        }
        options = Array.from(set).sort((a, b) => a - b);
      }
      break;
    }
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    question,
    answer,
    options: options.length > 0 ? options : undefined,
    operator,
    difficulty,
    mode,
    funnyObject
  };
};