import React from 'react';
import { Rocket } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 w-full py-4 px-4 flex justify-center items-center z-10 pointer-events-none">
      <div className="bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-full border border-slate-700 flex items-center gap-3 shadow-lg shadow-cyan-900/20">
        <div className="bg-cyan-500 p-1.5 rounded-full">
            <Rocket className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-wider uppercase">
          AInfinite <span className="text-cyan-400">Space Adventure</span>
        </h1>
      </div>
    </header>
  );
};