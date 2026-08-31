import React, { useState } from 'react';
import { X, Volume2, Search, BookOpen, Layers } from 'lucide-react';
import { VocabItem } from '../types';
import { voicePlayer } from '../utils/audioPlayer';
import { sfx } from '../utils/audioSynthesizer';

interface WordListPreviewModalProps {
  items: VocabItem[];
  onClose: () => void;
}

export const WordListPreviewModal: React.FC<WordListPreviewModalProps> = ({ items, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const allGrades = Array.from(new Set(items.map((i) => i.gradeName || `${i.grade}年級`)));

  const filteredItems = items.filter((item) => {
    const gradeMatch =
      selectedGradeFilter === 'all' ||
      (item.gradeName || `${item.grade}年級`) === selectedGradeFilter;

    const term = searchTerm.trim().toLowerCase();
    const searchMatch =
      !term ||
      item.taiwanese.toLowerCase().includes(term) ||
      item.chinese.toLowerCase().includes(term) ||
      item.prompt.toLowerCase().includes(term) ||
      item.lessonName.toLowerCase().includes(term);

    return gradeMatch && searchMatch;
  });

  const handlePlayAudio = (item: VocabItem) => {
    sfx.playHit(0.2);
    setPlayingId(item.id);
    voicePlayer.playVoice(
      item.audioUrl,
      { taiwanese: item.taiwanese, prompt: item.prompt },
      () => setPlayingId(item.id),
      () => setPlayingId(null)
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-amber-50 rounded-3xl border-4 border-amber-500 shadow-2xl p-6 my-8 text-stone-900 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b-2 border-amber-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-950">
                教材詞彙清單與發音試聽
              </h2>
              <p className="text-xs text-stone-600 font-bold">
                共 {items.length} 個語詞 ‧ 點擊 🔊 即可播放閩南語音檔
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-amber-200/80 hover:bg-amber-300 rounded-xl text-amber-950 font-bold transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋台語漢字、華語、拼音或課名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border-2 border-amber-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Grade Filter */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-800" />
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="bg-white border-2 border-amber-200 text-xs sm:text-sm rounded-xl px-3 py-2 font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">所有年級</option>
              {allGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vocab Cards Grid */}
        <div className="max-h-96 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white/90 p-3 rounded-2xl border-2 border-amber-200 shadow-sm flex items-center justify-between hover:border-amber-400 transition-all"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-amber-950">
                    {item.taiwanese}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full">
                    {item.chinese}
                  </span>
                </div>
                {item.prompt && (
                  <div className="text-xs font-mono font-bold text-amber-700">
                    {item.prompt}
                  </div>
                )}
                <div className="text-[11px] text-stone-500 font-medium">
                  {item.gradeName} ‧ {item.lessonName}
                </div>
              </div>

              {/* Audio Playback Button */}
              <button
                onClick={() => handlePlayAudio(item)}
                className={`p-2.5 rounded-xl border-2 transition-all active:scale-95 flex items-center gap-1 shrink-0 ${
                  playingId === item.id
                    ? 'bg-amber-400 border-amber-500 text-amber-950 animate-pulse'
                    : 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
                }`}
                title="播放語音"
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-xs font-bold hidden sm:inline">試聽</span>
              </button>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-12 text-center text-stone-500 font-bold">
              沒有找到符合的詞彙
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t-2 border-amber-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs sm:text-sm border-2 border-amber-700 shadow-sm transition-all active:scale-95"
          >
            返回遊戲
          </button>
        </div>
      </div>
    </div>
  );
};
