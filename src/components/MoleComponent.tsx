import React from 'react';
import { MoleHole } from '../types';

interface MoleComponentProps {
  hole: MoleHole;
  isFever: boolean;
  showRomaji: boolean;
  disabled: boolean;
  onHit: (hole: MoleHole, e: React.MouseEvent) => void;
}

export const MoleComponent: React.FC<MoleComponentProps> = ({
  hole,
  isFever,
  showRomaji,
  disabled,
  onHit
}) => {
  return (
    <div className="relative w-full aspect-[4/3.9] max-w-[240px] sm:max-w-[260px] mx-auto flex flex-col justify-end items-center select-none overflow-visible">
      {/* Background Soil Mound Behind Hole */}
      <div className="absolute bottom-1 w-[90%] h-[42%] rounded-[50%] bg-amber-900 border-4 border-amber-950 shadow-inner z-0" />

      {/* Hole Depth Opening (Dark cavity) */}
      <div className="absolute bottom-2.5 w-[76%] h-[28%] rounded-[50%] bg-stone-950 border-2 border-stone-900 shadow-[inset_0_10px_16px_rgba(0,0,0,0.95)] z-10" />

      {/* The Animated Mole (Pops up high and holds the signboard proudly) */}
      <div
        onClick={(e) => {
          if (!disabled && hole.isActive && !hole.isHit) {
            onHit(hole, e);
          }
        }}
        className={`relative z-30 w-full flex flex-col items-center cursor-pointer transition-all duration-300 ease-out ${
          hole.isActive
            ? hole.isHit
              ? 'translate-y-1 scale-95 opacity-90'
              : '-translate-y-6 sm:-translate-y-8 hover:scale-105 active:scale-95 opacity-100'
            : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        {/* Mole Character Illustration */}
        <div className="relative w-28 sm:w-32 flex flex-col items-center">
          {/* Fever Golden Helmet or Flower */}
          {isFever && !hole.isHit && (
            <div className="absolute -top-4 z-40 animate-bounce">
              <span className="text-2xl drop-shadow-md">👑</span>
            </div>
          )}

          {/* Mole Head */}
          <div className="relative w-24 sm:w-28 h-18 sm:h-20 bg-amber-700 rounded-t-full border-3 border-amber-950 shadow-md flex flex-col items-center justify-start pt-2">
            {/* Ears */}
            <div className="absolute -left-2 top-1.5 w-5 h-5 bg-amber-800 rounded-full border-2 border-amber-950 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-rose-400 rounded-full" />
            </div>
            <div className="absolute -right-2 top-1.5 w-5 h-5 bg-amber-800 rounded-full border-2 border-amber-950 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-rose-400 rounded-full" />
            </div>

            {/* Eyes */}
            {hole.isHit ? (
              // Dizzy swirl / X eyes when hit
              <div className="flex gap-4 mt-0.5">
                <span className="text-base font-black text-amber-950 animate-spin">💫</span>
                <span className="text-base font-black text-amber-950 animate-spin">💫</span>
              </div>
            ) : (
              // Cute blinking eyes
              <div className="flex gap-4 mt-0.5 items-center">
                <div className="w-3 h-3.5 bg-stone-900 rounded-full relative">
                  <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 right-0.5" />
                </div>
                <div className="w-3 h-3.5 bg-stone-900 rounded-full relative">
                  <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 right-0.5" />
                </div>
              </div>
            )}

            {/* Snout & Pink Nose */}
            <div className="mt-0.5 w-11 h-7 bg-amber-200 rounded-full border-2 border-amber-900 flex flex-col items-center justify-center shadow-inner relative">
              <div className="w-3.5 h-2 bg-rose-500 rounded-full shadow-sm" />
              {/* Whiskers */}
              <div className="absolute -left-2 top-1.5 w-3 h-0.5 bg-amber-950 -rotate-12" />
              <div className="absolute -left-2 top-3.5 w-3 h-0.5 bg-amber-950 rotate-12" />
              <div className="absolute -right-2 top-1.5 w-3 h-0.5 bg-amber-950 rotate-12" />
              <div className="absolute -right-2 top-3.5 w-3 h-0.5 bg-amber-950 -rotate-12" />
            </div>
          </div>

          {/* Wooden Signboard with Taiwanese Hanzi Text - Positioned prominently */}
          <div className="relative -mt-2 z-40 w-full flex flex-col items-center">
            {/* Mole Paws gripping the top of the signboard */}
            <div className="absolute -top-2 left-4 w-4 h-4 bg-amber-600 rounded-full border-2 border-amber-950 shadow-sm z-50" />
            <div className="absolute -top-2 right-4 w-4 h-4 bg-amber-600 rounded-full border-2 border-amber-950 shadow-sm z-50" />

            <div
              className={`w-full min-w-[130px] sm:min-w-[160px] px-2.5 py-2 rounded-2xl border-3 shadow-xl flex flex-col items-center justify-center transition-all ${
                hole.isHit
                  ? hole.hitType === 'correct'
                    ? 'bg-emerald-100 border-emerald-600 text-emerald-950 ring-4 ring-emerald-400'
                    : 'bg-rose-100 border-rose-600 text-rose-950 ring-4 ring-rose-400'
                  : isFever
                  ? 'bg-gradient-to-b from-amber-100 to-amber-200 border-amber-600 text-amber-950 ring-2 ring-amber-400 shadow-amber-300'
                  : 'bg-white border-amber-800 text-stone-900 hover:border-amber-600 hover:shadow-2xl'
              }`}
            >
              {/* Taiwanese Hanzi (Bold, clear, high-contrast) */}
              <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-wide leading-tight text-center text-stone-900 drop-shadow-sm">
                {hole.word}
              </span>

              {/* Optional Romaji pronunciation helper */}
              {showRomaji && hole.prompt && (
                <span className="text-[11px] sm:text-xs font-bold text-amber-800/90 tracking-tight mt-0.5 text-center">
                  {hole.prompt}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hit Feedback Badge (⭕ Correct / ❌ Wrong) */}
        {hole.isHit && (
          <div className="absolute -top-8 z-50 animate-bounce">
            {hole.hitType === 'correct' ? (
              <div className="bg-emerald-500 text-white px-3 py-1 rounded-full font-black text-sm sm:text-base border-2 border-white shadow-lg flex items-center gap-1">
                <span>⭕ 答對了！</span>
              </div>
            ) : (
              <div className="bg-rose-500 text-white px-3 py-1 rounded-full font-black text-sm sm:text-base border-2 border-white shadow-lg flex items-center gap-1">
                <span>❌ 答錯囉</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Front Soil Grass Border Rim (Subtle low rim that sits neatly at bottom z-20) */}
      <div className="absolute bottom-0 w-[88%] h-[16%] rounded-[50%] bg-emerald-800 border-b-3 border-amber-950 shadow-md z-20 pointer-events-none flex items-center justify-center">
        <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-emerald-600 to-emerald-800 opacity-95" />
      </div>
    </div>
  );
};
