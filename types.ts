export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'classic' | 'choice' | 'comparison' | 'sequence' | 'missing_op' | 'true_false' | 'monster_munch';
export type Operator = '+' | '-' | '*' | '/' | '>';

export interface MathProblem {
  id: string;
  question: string;
  answer: number | string;
  options?: (number | string)[];
  operator: Operator | string;
  difficulty: Difficulty;
  mode: GameMode;
  explanation?: string;
  funnyObject?: string; // e.g., "🍕", "💩", "🍌"
}

export interface GameState {
  score: number;
  streak: number;
  level: number;
  highScore: number;
  timeLeft: number;
  status: 'idle' | 'playing' | 'gameover';
  totalAnswered: number;
  correctAnswered: number;
}