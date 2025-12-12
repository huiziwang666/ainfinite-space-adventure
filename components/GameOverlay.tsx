import React, { useEffect, useState } from 'react';
import { GameState, MissionDebrief, SpeedSetting } from '../types';
import { Button } from './Button';
import { Trophy, Play, RotateCcw, Heart } from 'lucide-react';
import { generateMissionDebrief } from '../services/gemini';

interface GameOverlayProps {
  gameState: GameState;
  onStart: (speed: SpeedSetting) => void;
  onRestart: (speed: SpeedSetting) => void;
  onSpeedChange?: (speed: SpeedSetting) => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({ gameState, onStart, onRestart, onSpeedChange }) => {
  const [debrief, setDebrief] = useState<MissionDebrief | null>(null);
  const [isLoadingDebrief, setIsLoadingDebrief] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState<SpeedSetting>(3);

  const speedLabels = ['🐢', '🐇', '🚀', '🔥', '⚡'];
  const speedNames = ['Very Slow', 'Slow', 'Medium', 'Fast', 'Very Fast'];

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

  // HUD (Score + Lives + Speed Toggle)
  if (gameState.isPlaying && !gameState.isGameOver) {
    return (
      <>
        <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-20 flex justify-between items-start mt-16">
          {/* Score */}
          <div className="bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white font-bold text-xl flex items-center gap-2 shadow-lg">
            <Trophy className="text-yellow-400 w-5 h-5" />
            {gameState.score}
          </div>

          {/* Lives */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className={`transition-all duration-500 ${i <= gameState.lives ? 'scale-100 opacity-100' : 'scale-50 opacity-20'}`}>
                  <Heart
                    className={`w-8 h-8 ${i <= gameState.lives ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
                    strokeWidth={2}
                  />
               </div>
            ))}
          </div>
        </div>

        {/* Speed Slider - Bottom Center */}
        <div className="absolute bottom-44 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm px-3 py-2 rounded-xl">
            <span className="text-lg">{speedLabels[gameState.speed - 1]}</span>
            <input
              type="range"
              min="1"
              max="5"
              value={gameState.speed}
              onChange={(e) => onSpeedChange?.(Number(e.target.value) as SpeedSetting)}
              className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
            <span className="text-white/70 text-xs w-16">{speedNames[gameState.speed - 1]}</span>
          </div>
        </div>
      </>
    );
  }

  // Start Screen
  if (!gameState.isPlaying && !gameState.isGameOver) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1B365D]/80 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in-up border-4 border-yellow-400/30">
          <div className="w-24 h-24 bg-yellow-100 rounded-full mx-auto mb-6 flex items-center justify-center relative">
             <div className="text-6xl z-10">🧑‍🚀</div>
             <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-yellow-500 text-[#1B365D] text-xs font-bold px-2 py-1 rounded-full border-2 border-white">5 Lives!</div>
          </div>
          <h2 className="text-3xl font-black text-[#1B365D] mb-2">Ready, Pilot?</h2>
          <p className="text-slate-500 mb-4 text-lg">
            Tap <span className="font-bold text-yellow-500">Left</span> or <span className="font-bold text-yellow-500">Right</span> to switch lanes and dodge rocks!
          </p>

          {/* Speed Slider */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#1B365D] mb-3">Select Speed</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">{speedLabels[selectedSpeed - 1]}</span>
              <input
                type="range"
                min="1"
                max="5"
                value={selectedSpeed}
                onChange={(e) => setSelectedSpeed(Number(e.target.value) as SpeedSetting)}
                className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <span className="text-[#1B365D] text-sm font-medium w-20">{speedNames[selectedSpeed - 1]}</span>
            </div>
          </div>

          <Button onClick={() => onStart(selectedSpeed)} className="w-full text-xl py-4 !bg-yellow-500 hover:!bg-yellow-600 !text-[#1B365D]" variant="primary">
            <Play className="w-6 h-6" fill="currentColor" /> Start Mission
          </Button>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (gameState.isGameOver) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1B365D]/90 backdrop-blur-md p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-bounce-in border-4 border-yellow-400/30">
          <div className="w-20 h-20 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center text-[#1B365D]">
             <RotateCcw size={40} />
          </div>

          <h2 className="text-4xl font-black text-[#1B365D] mb-2">Mission Over!</h2>
          <div className="text-5xl font-black text-yellow-500 mb-6 drop-shadow-sm">{gameState.score} <span className="text-base text-slate-400 font-bold uppercase tracking-widest">Points</span></div>

          {isLoadingDebrief ? (
             <div className="bg-slate-50 p-4 rounded-xl mb-6 animate-pulse">
               <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-2"></div>
               <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
             </div>
          ) : debrief ? (
            <div className="bg-yellow-50 p-5 rounded-2xl mb-8 border border-yellow-200 text-left relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
               <p className="font-bold text-[#1B365D] text-lg mb-2">"{debrief.message}"</p>
               <div className="flex gap-2 items-start">
                  <span className="text-xl">💡</span>
                  <p className="text-sm text-[#1B365D]/80 leading-snug italic">{debrief.fact}</p>
               </div>
            </div>
          ) : null}

          {/* Speed Slider */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#1B365D] mb-3">Select Speed</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">{speedLabels[selectedSpeed - 1]}</span>
              <input
                type="range"
                min="1"
                max="5"
                value={selectedSpeed}
                onChange={(e) => setSelectedSpeed(Number(e.target.value) as SpeedSetting)}
                className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <span className="text-[#1B365D] text-sm font-medium w-20">{speedNames[selectedSpeed - 1]}</span>
            </div>
          </div>

          <Button onClick={() => onRestart(selectedSpeed)} className="w-full text-lg shadow-xl shadow-yellow-200 !bg-yellow-500 hover:!bg-yellow-600 !text-[#1B365D]" variant="accent">
            Try Again (5 Lives)
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
