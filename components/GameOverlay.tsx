import React, { useEffect, useState } from 'react';
import { GameState, MissionDebrief } from '../types';
import { Button } from './Button';
import { Trophy, Play, RotateCcw, Heart } from 'lucide-react';
import { generateMissionDebrief } from '../services/gemini';

interface GameOverlayProps {
  gameState: GameState;
  onStart: () => void;
  onRestart: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({ gameState, onStart, onRestart }) => {
  const [debrief, setDebrief] = useState<MissionDebrief | null>(null);
  const [isLoadingDebrief, setIsLoadingDebrief] = useState(false);

  useEffect(() => {
    if (gameState.isGameOver) {
      setIsLoadingDebrief(true);
      generateMissionDebrief(gameState.score).then(data => {
        setDebrief(data);
        setIsLoadingDebrief(false);
      });
    } else {
      setDebrief(null);
    }
  }, [gameState.isGameOver, gameState.score]);

  // HUD (Score + Lives)
  if (gameState.isPlaying && !gameState.isGameOver) {
    return (
      <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-20 flex justify-between items-start mt-16">
        {/* Score */}
        <div className="bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white font-bold text-xl flex items-center gap-2 shadow-lg">
          <Trophy className="text-yellow-400 w-5 h-5" />
          {gameState.score}
        </div>

        {/* Lives */}
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
             <div key={i} className={`transition-all duration-500 ${i <= gameState.lives ? 'scale-100 opacity-100' : 'scale-50 opacity-20'}`}>
                <Heart 
                  className={`w-8 h-8 ${i <= gameState.lives ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} 
                  strokeWidth={2}
                />
             </div>
          ))}
        </div>
      </div>
    );
  }

  // Start Screen
  if (!gameState.isPlaying && !gameState.isGameOver) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in-up border-4 border-indigo-100">
          <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto mb-6 flex items-center justify-center relative">
             <div className="text-6xl z-10">🧑‍🚀</div>
             <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">3 Lives!</div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Ready, Cadet?</h2>
          <p className="text-slate-500 mb-8 text-lg">
            Tap <span className="font-bold text-indigo-600">Left</span> or <span className="font-bold text-indigo-600">Right</span> to switch lanes and dodge rocks!
          </p>
          <Button onClick={onStart} className="w-full text-xl py-4" variant="primary">
            <Play className="w-6 h-6" fill="currentColor" /> Start Mission
          </Button>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (gameState.isGameOver) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-bounce-in border-4 border-red-100">
          <div className="w-20 h-20 bg-red-50 rounded-full mx-auto mb-4 flex items-center justify-center text-red-400">
             <RotateCcw size={40} />
          </div>
          
          <h2 className="text-4xl font-black text-slate-800 mb-2">Mission Over!</h2>
          <div className="text-5xl font-black text-indigo-600 mb-6 drop-shadow-sm">{gameState.score} <span className="text-base text-slate-400 font-bold uppercase tracking-widest">Points</span></div>

          {isLoadingDebrief ? (
             <div className="bg-slate-50 p-4 rounded-xl mb-6 animate-pulse">
               <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-2"></div>
               <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
             </div>
          ) : debrief ? (
            <div className="bg-indigo-50 p-5 rounded-2xl mb-8 border border-indigo-100 text-left relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-pink-400"></div>
               <p className="font-bold text-indigo-900 text-lg mb-2">"{debrief.message}"</p>
               <div className="flex gap-2 items-start">
                  <span className="text-xl">💡</span>
                  <p className="text-sm text-indigo-800 leading-snug italic">{debrief.fact}</p>
               </div>
            </div>
          ) : null}

          <Button onClick={onRestart} className="w-full text-lg shadow-xl shadow-indigo-200" variant="accent">
            Try Again (3 Lives)
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
