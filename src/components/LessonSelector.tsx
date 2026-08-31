import React from 'react';
import { Play, Sparkles, Volume2, Clock, Grid, Eye, CheckCircle2 } from 'lucide-react';
import { LessonGroup, GameSettings } from '../types';
import { sfx } from '../utils/audioSynthesizer';

interface LessonSelectorProps {
  lessonGroups: LessonGroup[];
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onStartGame: () => void;
}

export const LessonSelector: React.FC<LessonSelectorProps> = ({
  lessonGroups,
  settings,
  onUpdateSettings,
  onStartGame
}) => {
  const currentGradeGroup =
    lessonGroups.find((g) => g.grade === settings.selectedGrade) || lessonGroups[0];

  const availableLessons = currentGradeGroup?.lessons || [];

  const currentLessonData = availableLessons.find((l) => l.lesson === settings.selectedLesson);
  const currentItemCount = currentLessonData?.items.length || 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-amber-50/90 rounded-3xl border-4 border-amber-500 shadow-xl">
      {/* Top Banner / Welcoming header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-200/80 rounded-full border-2 border-amber-400 text-amber-900 font-bold text-sm mb-3">
          <span>🎧 聽音辨字 ‧ 打擊答題</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-amber-950 font-['Fredoka',sans-serif]">
          閩南語語詞聽力大挑戰
        </h2>
        <p className="text-sm sm:text-base text-amber-800/80 mt-1 max-w-md mx-auto">
          聽辨題目播出的閩南語語音，迅速點擊正確漢字的地鼠！
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Side: Lesson & Grade Selection (7 cols) */}
        <div className="md:col-span-7 space-y-5 bg-white/80 p-5 sm:p-6 rounded-2xl border-2 border-amber-200 shadow-sm">
          {/* 1. Grade Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-amber-800 mb-2">
              1. 選擇年級 / 教材版本
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {lessonGroups.map((g) => {
                const isSelected = g.grade === settings.selectedGrade;
                return (
                  <button
                    key={g.grade}
                    onClick={() => {
                      sfx.playHit(0.2);
                      const defaultLesson = g.lessons[0]?.lesson || '1';
                      onUpdateSettings({
                        selectedGrade: g.grade,
                        selectedLesson: defaultLesson
                      });
                    }}
                    className={`px-3 py-2.5 rounded-xl font-black text-sm border-2 transition-all text-center ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-700 shadow-md scale-[1.02]'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {g.gradeName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Lesson Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-amber-800 mb-2">
              2. 選擇單元課別 ({availableLessons.length} 課可選)
            </label>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {availableLessons.map((l) => {
                const isSelected = l.lesson === settings.selectedLesson;
                return (
                  <button
                    key={l.lesson}
                    onClick={() => {
                      sfx.playHit(0.2);
                      onUpdateSettings({ selectedLesson: l.lesson });
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-700 shadow-md ring-2 ring-amber-300'
                        : 'bg-amber-50 hover:bg-amber-100/80 text-amber-950 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          isSelected ? 'bg-white text-amber-700' : 'bg-amber-200 text-amber-800'
                        }`}
                      >
                        {l.lesson}
                      </span>
                      <span>{l.lessonName}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-amber-700/50 text-white' : 'bg-amber-200/60 text-amber-800'
                      }`}
                    >
                      {l.items.length} 詞彙
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Game Mode & Rules (5 cols) */}
        <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="bg-white/80 p-5 rounded-2xl border-2 border-amber-200 shadow-sm space-y-4">
            <h3 className="font-black text-amber-950 text-base border-b border-amber-100 pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>遊戲難度與設定</span>
            </h3>

            {/* Holes Count: 4 or 6 */}
            <div>
              <label className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1.5">
                <Grid className="w-4 h-4 text-amber-600" />
                <span>地洞數量 (難度)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    sfx.playHit(0.2);
                    onUpdateSettings({ holesCount: 4 });
                  }}
                  className={`py-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${
                    settings.holesCount === 4
                      ? 'bg-amber-500 text-white border-amber-700 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  🌱 初階 4 個地洞
                </button>
                <button
                  onClick={() => {
                    sfx.playHit(0.2);
                    onUpdateSettings({ holesCount: 6 });
                  }}
                  className={`py-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${
                    settings.holesCount === 6
                      ? 'bg-amber-500 text-white border-amber-700 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  ⚡ 進階 6 個地洞
                </button>
              </div>
            </div>

            {/* Question Time Limit */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-amber-800 mb-1.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>每題作答時間</span>
                </span>
                <span className="text-amber-600 font-black text-sm">{settings.questionTimeSec} 秒</span>
              </div>
              <input
                type="range"
                min="4"
                max="12"
                step="1"
                value={settings.questionTimeSec}
                onChange={(e) => onUpdateSettings({ questionTimeSec: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-amber-100 rounded-lg"
              />
            </div>

            {/* Romaji Hint Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5 cursor-pointer">
                <Eye className="w-4 h-4 text-amber-600" />
                <span>顯示台羅拼音輔助</span>
              </label>
              <input
                type="checkbox"
                checked={settings.showRomajiHint}
                onChange={(e) => onUpdateSettings({ showRomajiHint: e.target.checked })}
                className="w-5 h-5 accent-amber-600 cursor-pointer rounded"
              />
            </div>
          </div>

          {/* Start Game Big CTA Button */}
          <button
            id="start-game-cta-btn"
            disabled={currentItemCount === 0}
            onClick={() => {
              sfx.playHit(0.4);
              onStartGame();
            }}
            className={`w-full py-4 px-6 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 border-4 shadow-lg transition-all active:scale-95 ${
              currentItemCount > 0
                ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-amber-950 border-amber-700 shadow-amber-600/40 cursor-pointer hover:shadow-xl hover:-translate-y-0.5'
                : 'bg-stone-300 text-stone-500 border-stone-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-6 h-6 fill-current" />
            <span>開始聽力挑戰！ (共 {currentItemCount} 題)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
