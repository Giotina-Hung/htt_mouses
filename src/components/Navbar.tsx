import React from 'react';
import { Volume2, VolumeX, Database, BookOpen, Settings, HelpCircle } from 'lucide-react';
import { sfx } from '../utils/audioSynthesizer';

interface NavbarProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSheetModal: () => void;
  onOpenWordList: () => void;
  onOpenHelp: () => void;
  totalWordsCount: number;
  currentLessonName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  isMuted,
  onToggleMute,
  onOpenSheetModal,
  onOpenWordList,
  onOpenHelp,
  totalWordsCount,
  currentLessonName
}) => {
  return (
    <header className="sticky top-0 z-30 bg-amber-500/95 backdrop-blur-md text-amber-950 border-b-4 border-amber-600 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* App Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl border-2 border-amber-700 flex items-center justify-center shadow-inner text-2xl">
            🦫
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-[0_1.5px_2px_rgba(120,53,15,0.8)] font-['Fredoka',sans-serif]">
              閩南語聽力打地鼠
            </h1>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-100">
              <span className="bg-amber-700/60 px-2 py-0.5 rounded-full border border-amber-400/40">
                {currentLessonName || '國小閩南語教材'}
              </span>
              <span className="hidden sm:inline-block">共 {totalWordsCount} 個語詞</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Word List / Preview Button */}
          <button
            id="nav-wordlist-btn"
            onClick={() => {
              sfx.playHit(0.3);
              onOpenWordList();
            }}
            title="預覽目前題庫單字"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-white text-amber-900 rounded-xl font-bold text-xs sm:text-sm border-2 border-amber-700 shadow-sm transition-all active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span className="hidden md:inline">詞彙清單</span>
          </button>

          {/* Google Sheets Sync Modal */}
          <button
            id="nav-sheet-btn"
            onClick={() => {
              sfx.playHit(0.3);
              onOpenSheetModal();
            }}
            title="連結 Google 試算表"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs sm:text-sm border-2 border-emerald-800 shadow-sm transition-all active:scale-95"
          >
            <Database className="w-4 h-4" />
            <span>連結試算表</span>
          </button>

          {/* Mute / Unmute Sound */}
          <button
            id="nav-mute-btn"
            onClick={() => {
              onToggleMute();
              if (isMuted) sfx.playCorrect(0.4);
            }}
            title={isMuted ? '開啟音效' : '靜音'}
            className={`p-2 rounded-xl border-2 font-bold shadow-sm transition-all active:scale-95 ${
              isMuted
                ? 'bg-rose-100 border-rose-400 text-rose-700'
                : 'bg-amber-100 hover:bg-white border-amber-700 text-amber-900'
            }`}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-amber-800" />}
          </button>

          {/* Teacher Guide & Help */}
          <button
            id="nav-help-btn"
            onClick={() => {
              sfx.playHit(0.3);
              onOpenHelp();
            }}
            title="教學指引與說明"
            className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl border-2 border-amber-800 shadow-sm transition-all active:scale-95"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
