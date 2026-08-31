import React, { useState, useEffect, useMemo } from 'react';
import { VocabItem, GameSettings, QuestionRecord } from './types';
import { DEFAULT_VOCAB_DATA, GAS_API_URL } from './data/defaultVocab';
import { groupVocabByLesson } from './utils/gameEngine';
import { sfx } from './utils/audioSynthesizer';
import { fetchVocabFromGoogleSheet } from './utils/sheetParser';
import { Navbar } from './components/Navbar';
import { LessonSelector } from './components/LessonSelector';
import { WhackAMoleGame } from './components/WhackAMoleGame';
import { GameSummaryModal } from './components/GameSummaryModal';
import { SheetSettingsModal } from './components/SheetSettingsModal';
import { WordListPreviewModal } from './components/WordListPreviewModal';
import { TeacherGuideModal } from './components/TeacherGuideModal';

const STORAGE_KEY_VOCAB = 'tw_mole_vocab_data_v4';
const STORAGE_KEY_SHEET_URL = 'tw_mole_sheet_url_v4';

export default function App() {
  // 1. Vocabulary Database State
  const [vocabList, setVocabList] = useState<VocabItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOCAB);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Verify that at least some items have audioUrl
          const withAudio = parsed.filter((it: VocabItem) => it.audioUrl && it.audioUrl.trim().length > 0);
          if (withAudio.length > 0) {
            return parsed;
          }
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_VOCAB_DATA;
  });

  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_SHEET_URL) || GAS_API_URL;
  });

  // Background auto-refresh from live GAS on load to ensure freshest database
  useEffect(() => {
    const autoSyncFreshData = async () => {
      try {
        const targetUrl = sheetUrl || GAS_API_URL;
        const result = await fetchVocabFromGoogleSheet(targetUrl);
        if (!result.error && result.items && result.items.length > 0) {
          setVocabList(result.items);
          localStorage.setItem(STORAGE_KEY_VOCAB, JSON.stringify(result.items));
        }
      } catch (err) {
        console.warn('Auto sync GAS error:', err);
      }
    };
    autoSyncFreshData();
  }, [sheetUrl]);

  // 2. Settings State
  const [settings, setSettings] = useState<GameSettings>({
    holesCount: 4,
    questionTimeSec: 6,
    feverModeEnabled: true,
    showRomajiHint: true,
    soundVolume: 1.0,
    sfxVolume: 1.0,
    selectedGrade: '3',
    selectedLesson: '1',
    autoPlayAudio: true
  });

  // 3. Game Flow State
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'summary'>('menu');
  const [activeLessonItems, setActiveLessonItems] = useState<VocabItem[]>([]);
  const [gameRecords, setGameRecords] = useState<QuestionRecord[]>([]);

  // 4. Modals State
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isWordListModalOpen, setIsWordListModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Grouped Lesson Data
  const lessonGroups = useMemo(() => {
    return groupVocabByLesson(vocabList);
  }, [vocabList]);

  // Ensure selected grade & lesson always exist
  useEffect(() => {
    if (lessonGroups.length > 0) {
      const gradeExists = lessonGroups.some((g) => g.grade === settings.selectedGrade);
      if (!gradeExists) {
        const firstGrade = lessonGroups[0];
        setSettings((prev) => ({
          ...prev,
          selectedGrade: firstGrade.grade,
          selectedLesson: firstGrade.lessons[0]?.lesson || '1'
        }));
      } else {
        const currentGradeGroup = lessonGroups.find((g) => g.grade === settings.selectedGrade);
        const lessonExists = currentGradeGroup?.lessons.some((l) => l.lesson === settings.selectedLesson);
        if (!lessonExists && currentGradeGroup?.lessons[0]) {
          setSettings((prev) => ({
            ...prev,
            selectedLesson: currentGradeGroup.lessons[0].lesson
          }));
        }
      }
    }
  }, [lessonGroups, settings.selectedGrade, settings.selectedLesson]);

  // Save to localStorage when changed
  const handleSaveSheetData = (items: VocabItem[], newUrl: string) => {
    setVocabList(items);
    setSheetUrl(newUrl);
    try {
      localStorage.setItem(STORAGE_KEY_VOCAB, JSON.stringify(items));
      localStorage.setItem(STORAGE_KEY_SHEET_URL, newUrl);
    } catch {
      // ignore
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sfx.setMuted(nextMuted);
  };

  // Start Normal Game
  const handleStartGame = () => {
    const currentGradeGroup = lessonGroups.find((g) => g.grade === settings.selectedGrade);
    const currentLesson = currentGradeGroup?.lessons.find((l) => l.lesson === settings.selectedLesson);
    const items = currentLesson?.items || [];

    if (items.length === 0) return;

    setActiveLessonItems(items);
    setGameState('playing');
  };

  // Start Practice with specific items (e.g. Mistakes review)
  const handlePracticeMistakes = (mistakes: VocabItem[]) => {
    if (!mistakes || mistakes.length === 0) return;
    setActiveLessonItems(mistakes);
    setGameState('playing');
  };

  // Current Lesson Name for Top Bar
  const currentGradeGroup = lessonGroups.find((g) => g.grade === settings.selectedGrade);
  const currentLesson = currentGradeGroup?.lessons.find((l) => l.lesson === settings.selectedLesson);
  const displayLessonTitle = currentLesson
    ? `${currentGradeGroup?.gradeName} ‧ ${currentLesson.lessonName}`
    : '閩南語聽力教材';

  return (
    <div className="min-h-screen bg-[#faf6ee] text-stone-900 flex flex-col font-['Noto_Sans_TC',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        onOpenWordList={() => setIsWordListModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        totalWordsCount={vocabList.length}
        currentLessonName={displayLessonTitle}
      />

      {/* Main Game Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
        {gameState === 'menu' && (
          <LessonSelector
            lessonGroups={lessonGroups}
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
            onStartGame={handleStartGame}
          />
        )}

        {gameState === 'playing' && (
          <WhackAMoleGame
            lessonItems={activeLessonItems}
            allPoolItems={vocabList}
            settings={settings}
            onGameOver={(records) => {
              setGameRecords(records);
              setGameState('summary');
            }}
            onExitGame={() => setGameState('menu')}
          />
        )}

        {gameState === 'summary' && (
          <div className="w-full max-w-3xl">
            <GameSummaryModal
              records={gameRecords}
              onPlayAgain={() => {
                setGameState('playing');
              }}
              onPracticeMistakesOnly={handlePracticeMistakes}
              onBackToMenu={() => setGameState('menu')}
            />
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="py-4 text-center text-xs font-bold text-amber-900/60 border-t border-amber-200">
        <span>閩南語聽力打地鼠 ‧ 國小本土語文數位互動教材</span>
      </footer>

      {/* Sheet Settings Modal */}
      {isSheetModalOpen && (
        <SheetSettingsModal
          currentSheetUrl={sheetUrl}
          currentVocabCount={vocabList.length}
          onSaveSheetData={handleSaveSheetData}
          onClose={() => setIsSheetModalOpen(false)}
        />
      )}

      {/* Word List Preview Modal */}
      {isWordListModalOpen && (
        <WordListPreviewModal
          items={vocabList}
          onClose={() => setIsWordListModalOpen(false)}
        />
      )}

      {/* Teacher Guide & Help Modal */}
      {isHelpModalOpen && (
        <TeacherGuideModal onClose={() => setIsHelpModalOpen(false)} />
      )}
    </div>
  );
}
