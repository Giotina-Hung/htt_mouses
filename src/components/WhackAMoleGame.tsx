import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Zap, Flame, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { VocabItem, MoleHole, QuestionRecord, GameSettings } from '../types';
import { MoleComponent } from './MoleComponent';
import { generateMoleHoles, calculateScore, shuffleArray } from '../utils/gameEngine';
import { voicePlayer } from '../utils/audioPlayer';
import { sfx } from '../utils/audioSynthesizer';

interface WhackAMoleGameProps {
  lessonItems: VocabItem[];
  allPoolItems: VocabItem[];
  settings: GameSettings;
  onGameOver: (records: QuestionRecord[]) => void;
  onExitGame: () => void;
}

interface FloatingEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

export const WhackAMoleGame: React.FC<WhackAMoleGameProps> = ({
  lessonItems,
  allPoolItems,
  settings,
  onGameOver,
  onExitGame
}) => {
  // Question queue & state
  const [questionsQueue, setQuestionsQueue] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentHoles, setCurrentHoles] = useState<MoleHole[]>([]);
  
  // Scoring & Combos
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [isFever, setIsFever] = useState(false);
  const feverTimerRef = useRef<number | null>(null);

  // Time progress bar (in milliseconds)
  const totalQuestionTimeMs = settings.questionTimeSec * 1000;
  const [timeLeftMs, setTimeLeftMs] = useState(totalQuestionTimeMs);
  const [isAnsweringLocked, setIsAnsweringLocked] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioErrorHint, setAudioErrorHint] = useState(false);

  // Floating effects (+120, Combo!)
  const [floatingEffects, setFloatingEffects] = useState<FloatingEffect[]>([]);

  // Records tracking for student review
  const recordsRef = useRef<QuestionRecord[]>([]);
  const questionStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<number | null>(null);

  // Hammer visual strike position
  const [hammerPos, setHammerPos] = useState<{ x: number; y: number; active: boolean } | null>(null);

  // Current Target Item
  const currentTargetItem = questionsQueue[currentIndex] || null;

  // Initialize Game Queue
  useEffect(() => {
    if (lessonItems.length > 0) {
      const shuffled = shuffleArray(lessonItems);
      setQuestionsQueue(shuffled);
      setCurrentIndex(0);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setIsFever(false);
      recordsRef.current = [];
    }
  }, [lessonItems]);

  // Spawn Question
  const setupCurrentQuestion = useCallback(
    (index: number) => {
      const target = questionsQueue[index];
      if (!target) return;

      setIsAnsweringLocked(false);
      setTimeLeftMs(totalQuestionTimeMs);
      questionStartTimeRef.current = Date.now();
      setAudioErrorHint(false);

      // Generate holes for this question
      const holes = generateMoleHoles(target, lessonItems, allPoolItems, settings.holesCount);
      setCurrentHoles(holes);

      // Auto play audio
      setIsPlayingAudio(true);
      voicePlayer.playVoice(
        target.audioUrl,
        { taiwanese: target.taiwanese, prompt: target.prompt },
        () => {
          setIsPlayingAudio(true);
        },
        () => {
          setIsPlayingAudio(false);
        }
      ).then((success) => {
        if (!success) {
          setAudioErrorHint(true);
        }
      });
    },
    [questionsQueue, lessonItems, allPoolItems, settings.holesCount, totalQuestionTimeMs]
  );

  // Trigger setup on index change
  useEffect(() => {
    if (questionsQueue.length > 0 && currentIndex < questionsQueue.length) {
      setupCurrentQuestion(currentIndex);
    }
  }, [currentIndex, questionsQueue.length, setupCurrentQuestion]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      voicePlayer.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (feverTimerRef.current) clearTimeout(feverTimerRef.current);
    };
  }, []);

  // Floating text helper
  const addFloatingEffect = (x: number, y: number, text: string, color: string) => {
    const id = Date.now() + Math.random();
    setFloatingEffects((prev) => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setFloatingEffects((prev) => prev.filter((item) => item.id !== id));
    }, 1000);
  };

  // Move to Next Question or End Game
  const advanceToNextQuestion = useCallback(() => {
    voicePlayer.stop();
    if (currentIndex + 1 < questionsQueue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Game Over!
      sfx.playVictory();
      onGameOver(recordsRef.current);
    }
  }, [currentIndex, questionsQueue.length, onGameOver]);

  // Handle Timeout
  const handleTimeout = useCallback(() => {
    if (isAnsweringLocked || !currentTargetItem) return;
    setIsAnsweringLocked(true);
    sfx.playWrong();

    // Mark holes: show which one was correct
    setCurrentHoles((prev) =>
      prev.map((h) => ({
        ...h,
        isHit: h.isCorrect,
        hitType: h.isCorrect ? 'correct' : undefined
      }))
    );

    // Record timeout
    recordsRef.current.push({
      id: `q-${currentIndex}-${Date.now()}`,
      vocab: currentTargetItem,
      userChoice: '超時未答',
      isCorrect: false,
      timeSpentMs: totalQuestionTimeMs,
      earnedScore: 0,
      comboCount: combo,
      playedAt: Date.now()
    });

    setCombo(0);

    setTimeout(() => {
      advanceToNextQuestion();
    }, 1200);
  }, [isAnsweringLocked, currentTargetItem, currentIndex, totalQuestionTimeMs, combo, advanceToNextQuestion]);

  // Timer Tick
  useEffect(() => {
    if (isAnsweringLocked || !currentTargetItem) return;

    timerIntervalRef.current = window.setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= 100) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleTimeout();
          return 0;
        }
        // Warning sound when time <= 2 seconds
        if (prev <= 2000 && Math.floor(prev / 500) !== Math.floor((prev - 100) / 500)) {
          sfx.playTick();
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isAnsweringLocked, currentTargetItem, handleTimeout]);

  // User Whack / Click Handler
  const handleMoleHit = (hole: MoleHole, e: React.MouseEvent) => {
    if (isAnsweringLocked || !currentTargetItem) return;
    setIsAnsweringLocked(true);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const timeSpent = Date.now() - questionStartTimeRef.current;
    const timeRemainingRatio = Math.max(0, timeLeftMs / totalQuestionTimeMs);

    // Trigger Hammer visual effect
    const rect = e.currentTarget.getBoundingClientRect();
    setHammerPos({ x: rect.left + rect.width / 2, y: rect.top, active: true });
    setTimeout(() => setHammerPos(null), 300);

    // Play hit pop
    sfx.playHit(0.7);

    if (hole.isCorrect) {
      // ✅ Correct Answer!
      sfx.playCorrect();
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((prev) => Math.max(prev, newCombo));

      // Calculate score with bonus
      const earned = calculateScore(timeRemainingRatio, newCombo, isFever);
      setScore((prev) => prev + earned);

      // Trigger Combo & Fever
      if (newCombo >= 5 && !isFever) {
        setIsFever(true);
        sfx.playFever();
        if (feverTimerRef.current) clearTimeout(feverTimerRef.current);
        feverTimerRef.current = window.setTimeout(() => {
          setIsFever(false);
        }, 7000);
      } else if (newCombo >= 2) {
        sfx.playCombo(newCombo);
      }

      // Floating score badge
      addFloatingEffect(e.clientX, e.clientY - 20, `+${earned}`, '#10b981');
      if (newCombo >= 2) {
        addFloatingEffect(e.clientX, e.clientY - 50, `${newCombo} 連擊!`, '#f59e0b');
      }

      // Mark this hole as hit correct
      setCurrentHoles((prev) =>
        prev.map((h) => (h.id === hole.id ? { ...h, isHit: true, hitType: 'correct' } : h))
      );

      // Save Record
      recordsRef.current.push({
        id: `q-${currentIndex}-${Date.now()}`,
        vocab: currentTargetItem,
        userChoice: hole.word,
        isCorrect: true,
        timeSpentMs: timeSpent,
        earnedScore: earned,
        comboCount: newCombo,
        playedAt: Date.now()
      });

      // Next question delay
      setTimeout(() => {
        advanceToNextQuestion();
      }, 750);
    } else {
      // ❌ Wrong Answer
      sfx.playWrong();
      setCombo(0);
      setIsFever(false);

      // Penalty -20
      setScore((prev) => Math.max(0, prev - 20));
      addFloatingEffect(e.clientX, e.clientY - 20, `-20 扣分`, '#ef4444');

      // Highlight clicked wrong hole AND show the correct one
      setCurrentHoles((prev) =>
        prev.map((h) => {
          if (h.id === hole.id) {
            return { ...h, isHit: true, hitType: 'wrong' };
          }
          if (h.isCorrect) {
            return { ...h, isHit: true, hitType: 'correct' };
          }
          return h;
        })
      );

      // Save Record
      recordsRef.current.push({
        id: `q-${currentIndex}-${Date.now()}`,
        vocab: currentTargetItem,
        userChoice: hole.word,
        isCorrect: false,
        timeSpentMs: timeSpent,
        earnedScore: 0,
        comboCount: 0,
        playedAt: Date.now()
      });

      // Next question delay (give student time to see correct answer)
      setTimeout(() => {
        advanceToNextQuestion();
      }, 1200);
    }
  };

  // Replay Audio Button Handler
  const handleReplayAudio = () => {
    if (!currentTargetItem) return;
    sfx.playHit(0.2);
    setIsPlayingAudio(true);
    voicePlayer.playVoice(
      currentTargetItem.audioUrl,
      { taiwanese: currentTargetItem.taiwanese, prompt: currentTargetItem.prompt },
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  // Progress Bar Percentage & Color
  const progressPercent = Math.max(0, Math.min(100, (timeLeftMs / totalQuestionTimeMs) * 100));
  const progressColor =
    progressPercent > 50 ? 'bg-emerald-500' : progressPercent > 25 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div
      className={`relative w-full max-w-5xl mx-auto rounded-3xl border-4 overflow-hidden shadow-2xl transition-colors duration-500 select-none ${
        isFever
          ? 'bg-gradient-to-b from-amber-200 via-amber-100 to-amber-300 border-amber-500 ring-8 ring-amber-400/50'
          : 'bg-gradient-to-b from-emerald-100 via-amber-50 to-emerald-200 border-amber-600'
      }`}
    >
      {/* Top Dashboard: Score, Question Number, Combo & Audio Replay */}
      <div className="bg-amber-800 text-white p-3 sm:p-4 border-b-4 border-amber-950 flex flex-wrap items-center justify-between gap-2 sm:gap-4 shadow-md">
        {/* Left: Question counter & Lesson */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onExitGame}
            title="退出遊戲"
            className="p-1.5 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded-lg border border-amber-500 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">重選</span>
          </button>

          <div className="bg-amber-900/80 px-3 py-1 rounded-xl border border-amber-600/50">
            <span className="text-xs text-amber-300 font-bold block">題目進度</span>
            <span className="text-base sm:text-lg font-black font-['Fredoka',sans-serif]">
              {currentIndex + 1} <span className="text-xs font-normal text-amber-400">/ {questionsQueue.length}</span>
            </span>
          </div>
        </div>

        {/* Center: Audio Replay Primary Button & Pronunciation Hint */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            id="replay-voice-btn"
            onClick={handleReplayAudio}
            disabled={isPlayingAudio}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl font-black text-sm sm:text-base border-3 shadow-lg transition-all active:scale-95 ${
              isPlayingAudio
                ? 'bg-amber-400 text-amber-950 border-amber-300 animate-pulse'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 border-amber-300 hover:shadow-xl'
            }`}
          >
            <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
            <span>
              {isPlayingAudio
                ? '正在播放台語...'
                : currentTargetItem?.audioUrl
                ? '🔊 點擊重聽台語語音'
                : '🔊 聽音辨字 (點擊重播)'}
            </span>
          </button>

          {/* Current Question Tai-lo Hint Badge */}
          {currentTargetItem?.prompt && settings.showRomajiHint && (
            <div className="bg-amber-950/80 px-3 py-1.5 rounded-xl border border-amber-500/60 flex items-center gap-1.5">
              <span className="text-[10px] text-amber-300 font-bold">拼音提示:</span>
              <span className="text-sm font-black text-amber-200 font-mono tracking-wide">
                {currentTargetItem.prompt}
              </span>
            </div>
          )}
        </div>

        {/* Right: Score, Combo & Fever */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Combo Badge */}
          {combo >= 2 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-amber-950 rounded-xl font-black text-xs sm:text-sm border-2 border-amber-300 shadow-md animate-bounce">
              <Flame className="w-4 h-4 fill-amber-300 text-amber-700" />
              <span>{combo} 連擊</span>
            </div>
          )}

          {/* Fever Indicator */}
          {isFever && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-rose-500 text-white rounded-xl font-black text-xs sm:text-sm border-2 border-white shadow-md animate-pulse">
              <Sparkles className="w-4 h-4 fill-current" />
              <span>狂熱 2X!</span>
            </div>
          )}

          {/* Score Counter */}
          <div className="bg-amber-950 px-3 sm:px-4 py-1 rounded-xl border border-amber-600 flex flex-col items-end">
            <span className="text-[10px] text-amber-300 font-bold tracking-wider uppercase">累積分數</span>
            <span className="text-lg sm:text-xl font-black text-amber-300 font-['Fredoka',sans-serif]">
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Time Bonus Progress Bar */}
      <div className="w-full bg-stone-900 h-3 relative">
        <div
          className={`h-full transition-all duration-100 ease-linear ${progressColor}`}
          style={{ width: `${progressPercent}%` }}
        />
        {/* Lightning prompt on fast reaction */}
        <div className="absolute right-2 top-0 bottom-0 flex items-center gap-1 text-[10px] font-bold text-white/90">
          <Zap className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
          <span>時間紅利</span>
        </div>
      </div>

      {/* Audio Error Fallback Notification Banner */}
      {audioErrorHint && (
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-1 text-center text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>已啟用語音輔助播放（請聽語音或參考下方拼音點擊正確漢字）</span>
        </div>
      )}

      {/* Ground Arena Field */}
      <div className="p-4 sm:p-8 min-h-[380px] sm:min-h-[460px] flex flex-col justify-center items-center">
        {/* Dynamic Holes Grid (4 or 6 holes) */}
        <div
          className={`w-full grid gap-4 sm:gap-6 justify-items-center ${
            settings.holesCount === 4
              ? 'grid-cols-2 max-w-2xl'
              : 'grid-cols-2 sm:grid-cols-3 max-w-4xl'
          }`}
        >
          {currentHoles.map((hole) => (
            <MoleComponent
              key={hole.id}
              hole={hole}
              isFever={isFever}
              showRomaji={settings.showRomajiHint}
              disabled={isAnsweringLocked}
              onHit={handleMoleHit}
            />
          ))}
        </div>
      </div>

      {/* Floating Score Animation Overlays */}
      {floatingEffects.map((eff) => (
        <div
          key={eff.id}
          className="fixed pointer-events-none z-50 font-black text-2xl sm:text-3xl animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          style={{
            left: eff.x - 30,
            top: eff.y - 40,
            color: eff.color
          }}
        >
          {eff.text}
        </div>
      ))}

      {/* Bottom Educational Hint Banner */}
      <div className="bg-amber-900/90 text-amber-100 px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 border-t-2 border-amber-950">
        <span>💡 答題技巧：仔細聽題目台語發音，越快打中正確漢字分數越高！</span>
      </div>
    </div>
  );
};
