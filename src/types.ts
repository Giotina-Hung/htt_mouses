export interface VocabItem {
  id: string;
  grade: string | number;
  gradeName: string;
  lesson: string | number;
  lessonName: string;
  prompt: string;      // 台羅拼音 (例: gû-ling)
  taiwanese: string;   // 台語漢字 (例: 牛奶)
  chinese: string;     // 華語翻譯 (例: 牛奶)
  audioUrl: string;    // 音檔連結
  customDistractors?: string; // 指定干擾項
  speedFactor?: number;       // 速度調整
}

export interface MoleHole {
  id: number;
  word: string;
  prompt: string;
  chinese: string;
  isCorrect: boolean;
  isSpecial?: 'none' | 'hint' | 'bomb';
  isActive: boolean;
  isHit: boolean;
  hitType?: 'correct' | 'wrong' | 'hint' | 'bomb';
}

export interface QuestionRecord {
  id: string;
  vocab: VocabItem;
  userChoice: string;
  isCorrect: boolean;
  timeSpentMs: number;
  earnedScore: number;
  comboCount: number;
  playedAt: number;
}

export interface GameSettings {
  holesCount: 4 | 6;
  questionTimeSec: number;
  feverModeEnabled: boolean;
  showRomajiHint: boolean;
  soundVolume: number;
  sfxVolume: number;
  selectedGrade: string;
  selectedLesson: string;
  autoPlayAudio: boolean;
}

export interface LessonGroup {
  grade: string;
  gradeName: string;
  lessons: {
    lesson: string;
    lessonName: string;
    items: VocabItem[];
  }[];
}
