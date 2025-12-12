import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 w-full py-4 px-4 flex justify-center items-center z-10 pointer-events-none">
      <div className="bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-full border border-yellow-500/30 flex items-center gap-3 shadow-lg shadow-yellow-900/20">
        <img src="/new-logo.png" alt="Logo" className="w-8 h-8" />
        <h1 className="text-xl font-bold tracking-wider uppercase">
          <span className="text-yellow-400">AInfinite</span> <span className="text-[#1B365D]">Space Adventure</span>
        </h1>
      </div>
    </header>
  );
};