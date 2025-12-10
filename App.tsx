import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { GameCanvas } from './components/GameCanvas';
import { GameOverlay } from './components/GameOverlay';
import { GameState } from './types';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    highScore: 0,
    lives: 5
  });

  // Use a ref queue for input to handle rapid taps correctly in the game loop
  const inputQueue = useRef<string[]>([]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isPlaying || gameState.isGameOver) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        inputQueue.current.push('left');
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        inputQueue.current.push('right');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState.isPlaying, gameState.isGameOver]);

  const handleTouchLeft = () => {
     if (gameState.isPlaying && !gameState.isGameOver) inputQueue.current.push('left');
  };

  const handleTouchRight = () => {
     if (gameState.isPlaying && !gameState.isGameOver) inputQueue.current.push('right');
  };

  const startGame = () => {
    // Reset queue
    inputQueue.current = [];
    setGameState({
      isPlaying: true,
      isGameOver: false,
      score: 0,
      highScore: gameState.highScore,
      lives: 5
    });
  };

  const gameOver = (finalScore: number) => {
    setGameState(prev => ({
      ...prev,
      isGameOver: true,
      highScore: Math.max(prev.highScore, finalScore)
    }));
  };

  const updateScore = (score: number) => {
    setGameState(prev => ({ ...prev, score }));
  };

  const updateLives = (lives: number) => {
    setGameState(prev => ({ ...prev, lives }));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 space-bg select-none">
      <Header />
      
      <GameCanvas 
        gameState={gameState} 
        onGameOver={gameOver} 
        setScore={updateScore}
        updateLives={updateLives}
        inputQueue={inputQueue}
      />
      
      <GameOverlay 
        gameState={gameState} 
        onStart={startGame} 
        onRestart={startGame}
      />

      {/* Mobile Touch Controls - Large Hit Areas */}
      {gameState.isPlaying && !gameState.isGameOver && (
        <div className="absolute bottom-0 left-0 w-full h-40 flex z-20 pb-safe">
          <button 
            className="flex-1 flex items-center justify-center active:bg-white/5 transition-colors touch-none outline-none group"
            onPointerDown={handleTouchLeft}
          >
             <div className="bg-white/10 p-6 rounded-full backdrop-blur-sm border border-white/10 group-active:scale-90 transition-transform">
                <ArrowLeft className="w-10 h-10 text-white/80" />
             </div>
          </button>
          <button 
            className="flex-1 flex items-center justify-center active:bg-white/5 transition-colors touch-none outline-none group"
            onPointerDown={handleTouchRight}
          >
             <div className="bg-white/10 p-6 rounded-full backdrop-blur-sm border border-white/10 group-active:scale-90 transition-transform">
                <ArrowRight className="w-10 h-10 text-white/80" />
             </div>
          </button>
        </div>
      )}
    </div>
  );
}
