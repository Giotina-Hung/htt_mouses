import { VocabItem, MoleHole, LessonGroup } from '../types';

export function groupVocabByLesson(items: VocabItem[]): LessonGroup[] {
  const gradeMap = new Map<string, { gradeName: string; lessonsMap: Map<string, { lessonName: string; items: VocabItem[] }> }>();

  items.forEach((item) => {
    const gradeKey = String(item.grade);
    if (!gradeMap.has(gradeKey)) {
      gradeMap.set(gradeKey, {
        gradeName: item.gradeName || `${item.grade}年級`,
        lessonsMap: new Map()
      });
    }

    const gradeData = gradeMap.get(gradeKey)!;
    const lessonKey = String(item.lesson);

    if (!gradeData.lessonsMap.has(lessonKey)) {
      gradeData.lessonsMap.set(lessonKey, {
        lessonName: item.lessonName || `第${item.lesson}課`,
        items: []
      });
    }

    gradeData.lessonsMap.get(lessonKey)!.items.push(item);
  });

  const result: LessonGroup[] = [];

  gradeMap.forEach((gData, grade) => {
    const lessonsList: { lesson: string; lessonName: string; items: VocabItem[] }[] = [];
    gData.lessonsMap.forEach((lData, lesson) => {
      lessonsList.push({
        lesson,
        lessonName: lData.lessonName,
        items: lData.items
      });
    });

    // Sort lessons numerically if possible
    lessonsList.sort((a, b) => {
      const numA = parseInt(a.lesson, 10);
      const numB = parseInt(b.lesson, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.lesson.localeCompare(b.lesson);
    });

    result.push({
      grade,
      gradeName: gData.gradeName,
      lessons: lessonsList
    });
  });

  // Sort grades
  result.sort((a, b) => {
    const numA = parseInt(a.grade, 10);
    const numB = parseInt(b.grade, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.grade.localeCompare(b.grade);
  });

  return result;
}

/**
 * Shuffle array with Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generate hole contents for a single question
 */
export function generateMoleHoles(
  targetItem: VocabItem,
  allLessonItems: VocabItem[],
  allPoolItems: VocabItem[],
  holesCount: 4 | 6
): MoleHole[] {
  const distractorsNeeded = holesCount - 1;
  const distractorWords: string[] = [];

  // 1. Check custom distractors from spreadsheet first
  if (targetItem.customDistractors) {
    const customList = targetItem.customDistractors
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s !== targetItem.taiwanese);
    
    distractorWords.push(...customList);
  }

  // 2. Add other words from the same lesson
  if (distractorWords.length < distractorsNeeded) {
    const sameLessonOtherWords = allLessonItems
      .filter((item) => item.taiwanese !== targetItem.taiwanese && !distractorWords.includes(item.taiwanese))
      .map((item) => item.taiwanese);
    
    const shuffledLessonWords = shuffleArray(sameLessonOtherWords);
    distractorWords.push(...shuffledLessonWords);
  }

  // 3. If still not enough, draw from full grade pool
  if (distractorWords.length < distractorsNeeded) {
    const otherPoolWords = allPoolItems
      .filter((item) => item.taiwanese !== targetItem.taiwanese && !distractorWords.includes(item.taiwanese))
      .map((item) => item.taiwanese);
    
    const shuffledPool = shuffleArray(otherPoolWords);
    distractorWords.push(...shuffledPool);
  }

  // 4. Fallback fillers if pool is extremely small
  const fallbackWords = ['茶米茶', '便當', '水餃', '水果', '米粉', '油條', '包子', '地瓜'];
  let fbIndex = 0;
  while (distractorWords.length < distractorsNeeded) {
    const fb = fallbackWords[fbIndex % fallbackWords.length];
    if (fb !== targetItem.taiwanese && !distractorWords.includes(fb)) {
      distractorWords.push(fb);
    }
    fbIndex++;
  }

  const selectedDistractors = distractorWords.slice(0, distractorsNeeded);

  // Combine target and distractors
  const options = [
    {
      word: targetItem.taiwanese,
      prompt: targetItem.prompt,
      chinese: targetItem.chinese,
      isCorrect: true
    },
    ...selectedDistractors.map((word) => {
      const match = allPoolItems.find((p) => p.taiwanese === word);
      return {
        word,
        prompt: match?.prompt || '',
        chinese: match?.chinese || word,
        isCorrect: false
      };
    })
  ];

  // Shuffle hole positions
  const shuffledOptions = shuffleArray(options);

  return shuffledOptions.map((opt, index) => ({
    id: index,
    word: opt.word,
    prompt: opt.prompt,
    chinese: opt.chinese,
    isCorrect: opt.isCorrect,
    isActive: true,
    isHit: false
  }));
}

/**
 * Score calculation based on time bonus, combos, and fever mode
 */
export function calculateScore(
  timeRemainingRatio: number, // 0.0 ~ 1.0
  combo: number,
  isFever: boolean
): number {
  const baseScore = 100;
  const timeBonus = Math.round(timeRemainingRatio * 100); // 0 ~ 100
  const comboMultiplier = 1 + Math.min(combo * 0.2, 1.5); // max 2.5x
  const feverMultiplier = isFever ? 2 : 1;

  return Math.round((baseScore + timeBonus) * comboMultiplier * feverMultiplier);
}
