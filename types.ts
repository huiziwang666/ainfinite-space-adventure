export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  highScore: number;
  lives: number;
}

export interface Player {
  lane: number; // 0 to 3
  x: number; // Visual X position for smooth animation
  y: number;
  isHit: boolean;
  hitTimer: number; // For flashing effect
}

export interface Rock {
  id: number;
  lane: number; // 0 to 3
  y: number;
  speed: number;
  rotation: number;
  type: 'jagged' | 'round' | 'crystal';
}

export interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export interface MissionDebrief {
  message: string;
  fact: string;
}
