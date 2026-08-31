import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, RotateCcw, Volume2, CheckCircle, XCircle, Award, ArrowRight, Zap, Target } from 'lucide-react';
import { QuestionRecord, VocabItem } from '../types';
import { voicePlayer } from '../utils/audioPlayer';
import { sfx } from '../utils/audioSynthesizer';

interface GameSummaryModalProps {
  records: QuestionRecord[];
  onPlayAgain: () => void;
  onPracticeMistakesOnly: (mistakes: VocabItem[]) => void;
  onBackToMenu: () => void;
}

export const GameSummaryModal: React.FC<GameSummaryModalProps> = ({
  records,
  onPlayAgain,
  onPracticeMistakesOnly,
  onBackToMenu
}) => {
  const totalQuestions = records.length;
  const correctRecords = records.filter((r) => r.isCorrect);
  const wrongRecords = records.filter((r) => !r.isCorrect);
  const correctCount = correctRecords.length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const totalScore = records.reduce((sum, r) => sum + r.earnedScore, 0);
  const maxCombo = records.reduce((max, r) => Math.max(max, r.comboCount), 0);

  // Star Rating Calculation
  const starsCount = accuracy >= 90 ? 3 : accuracy >= 60 ? 2 : 1;

  // Trigger celebration confetti
  useEffect(() => {
    if (starsCount >= 2) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    }
  }, [starsCount]);

  const mistakeVocabs = wrongRecords.map((r) => r.vocab);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-amber-50 rounded-3xl border-4 border-amber-500 shadow-2xl p-6 sm:p-8 my-8 text-stone-900 animate-in fade-in zoom-in duration-300">
        {/* Header with Trophy / Stars */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            {[1, 2, 3].map((starIndex) => (
              <Star
                key={starIndex}
                className={`w-10 sm:w-12 h-10 sm:h-12 transition-all duration-500 ${
                  starIndex <= starsCount
                    ? 'fill-amber-400 text-amber-500 drop-shadow-md scale-110'
                    : 'text-stone-300 fill-stone-200'
                }`}
              />
            ))}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-amber-950 font-['Fredoka',sans-serif]">
            {starsCount === 3
              ? '太棒了！滿分聽力王 🏆'
              : starsCount === 2
              ? '表現優秀！再接再厲 👍'
              : '完成挑戰！多聽幾次會更熟練喔 💪'}
          </h2>
          <p className="text-xs sm:text-sm text-amber-800 font-bold mt-1">
            國小本土語文 ‧ 閩南語聽力成果分析
          </p>
        </div>

        {/* 4-Stat Box Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {/* Total Score */}
          <div className="bg-amber-100/80 p-3 rounded-2xl border-2 border-amber-300 text-center">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-800">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>總得分</span>
            </div>
            <div className="text-2xl font-black text-amber-950 font-['Fredoka',sans-serif] mt-0.5">
              {totalScore}
            </div>
          </div>

          {/* Accuracy Rate */}
          <div className="bg-emerald-100/80 p-3 rounded-2xl border-2 border-emerald-300 text-center">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-800">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              <span>正確率</span>
            </div>
            <div className="text-2xl font-black text-emerald-950 font-['Fredoka',sans-serif] mt-0.5">
              {accuracy}%
            </div>
          </div>

          {/* Correct / Total */}
          <div className="bg-sky-100/80 p-3 rounded-2xl border-2 border-sky-300 text-center">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-sky-800">
              <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>答對題數</span>
            </div>
            <div className="text-2xl font-black text-sky-950 font-['Fredoka',sans-serif] mt-0.5">
              {correctCount} <span className="text-xs font-bold text-sky-700">/ {totalQuestions}</span>
            </div>
          </div>

          {/* Max Combo */}
          <div className="bg-orange-100/80 p-3 rounded-2xl border-2 border-orange-300 text-center">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-orange-800">
              <Zap className="w-3.5 h-3.5 text-orange-600" />
              <span>最高連擊</span>
            </div>
            <div className="text-2xl font-black text-orange-950 font-['Fredoka',sans-serif] mt-0.5">
              {maxCombo} <span className="text-xs font-bold text-orange-700">Combo</span>
            </div>
          </div>
        </div>

        {/* Mistake Review / Vocabulary Checklist */}
        <div className="mb-6 bg-white/90 rounded-2xl border-2 border-amber-200 p-4 shadow-inner">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-amber-100">
            <h3 className="text-sm font-black text-amber-950 flex items-center gap-1.5">
              <span>📝 答題明細與複習清單</span>
              {wrongRecords.length > 0 && (
                <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  錯題 {wrongRecords.length} 題
                </span>
              )}
            </h3>
            <span className="text-xs text-stone-500">點擊 🔊 可重聽發音</span>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {records.map((rec, idx) => (
              <div
                key={rec.id || idx}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
                  rec.isCorrect
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-200 text-rose-950'
                }`}
              >
                {/* Word Info */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {rec.isCorrect ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base">{rec.vocab.taiwanese}</span>
                      <span className="text-xs font-semibold text-stone-600 bg-white/80 px-1.5 py-0.5 rounded border border-stone-200">
                        {rec.vocab.chinese}
                      </span>
                    </div>
                    {rec.vocab.prompt && (
                      <div className="text-[11px] text-amber-800 font-mono">
                        {rec.vocab.prompt}
                      </div>
                    )}
                  </div>
                </div>

                {/* Audio Listen & Response Time */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-500 font-bold">
                    {(rec.timeSpentMs / 1000).toFixed(1)}s
                  </span>
                  <button
                    onClick={() => {
                      voicePlayer.playVoice(rec.vocab.audioUrl, {
                        taiwanese: rec.vocab.taiwanese,
                        prompt: rec.vocab.prompt
                      });
                    }}
                    title="重聽台語發音"
                    className="p-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg border border-amber-400 transition-all active:scale-95"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {wrongRecords.length > 0 && (
            <button
              id="practice-mistakes-btn"
              onClick={() => {
                sfx.playHit(0.3);
                onPracticeMistakesOnly(mistakeVocabs);
              }}
              className="w-full sm:flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-sm border-2 border-rose-700 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🎯 針對錯題加強挑戰 ({wrongRecords.length} 題)</span>
            </button>
          )}

          <button
            id="play-again-btn"
            onClick={() => {
              sfx.playHit(0.3);
              onPlayAgain();
            }}
            className="w-full sm:flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-sm border-2 border-amber-700 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再玩一次</span>
          </button>

          <button
            id="back-menu-btn"
            onClick={() => {
              sfx.playHit(0.3);
              onBackToMenu();
            }}
            className="w-full sm:w-auto py-3 px-5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl font-bold text-sm border-2 border-stone-300 transition-all active:scale-95"
          >
            返回主選單
          </button>
        </div>
      </div>
    </div>
  );
};
