import { VocabItem } from '../types';
import { DEFAULT_VOCAB_DATA, GAS_API_URL } from '../data/defaultVocab';

/**
 * Parses JSON response from Google Apps Script (GAS) Web App
 * e.g. https://script.google.com/macros/s/.../exec
 */
export function parseGASJson(jsonObj: unknown): VocabItem[] {
  if (!jsonObj || typeof jsonObj !== 'object') return [];

  let dataArray: unknown[] = [];
  if (Array.isArray(jsonObj)) {
    dataArray = jsonObj;
  } else if ('data' in (jsonObj as Record<string, unknown>) && Array.isArray((jsonObj as Record<string, unknown>).data)) {
    dataArray = (jsonObj as Record<string, unknown>).data as unknown[];
  } else if ('questions' in (jsonObj as Record<string, unknown>) && Array.isArray((jsonObj as Record<string, unknown>).questions)) {
    dataArray = (jsonObj as Record<string, unknown>).questions as unknown[];
  }

  const items: VocabItem[] = [];

  dataArray.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const row = item as Record<string, unknown>;

    const promptRaw = typeof row.prompt === 'string' ? row.prompt.trim() : '';
    // Extract Taiwanese Romanization & Chinese from prompt: 🎯 請點擊「gû-ling」（牛奶） 對應的正確選項！
    const match = promptRaw.match(/「([^」]+)」(?:[（(]([^）)]+)[）)])?/);
    const romanization = match && match[1] ? match[1].trim() : (typeof row.prompt === 'string' ? row.prompt : '');
    const chineseMeaning = match && match[2] ? match[2].trim() : '';

    const taiwanese =
      typeof row.taiwanese === 'string' && row.taiwanese.trim()
        ? row.taiwanese.trim()
        : chineseMeaning || romanization || `題目${index + 1}`;

    const chinese =
      typeof row.chinese === 'string' && row.chinese.trim()
        ? row.chinese.trim()
        : chineseMeaning || taiwanese;

    const gradeRaw = typeof row.grade === 'string' ? row.grade.replace(/grade/gi, '').trim() : String(row.grade || '3');
    const gradeName =
      typeof row.gradeName === 'string' && row.gradeName.trim()
        ? row.gradeName.trim()
        : `${gradeRaw}年級`;

    const lessonRaw = typeof row.lesson === 'string' ? row.lesson.trim() : String(row.lesson || '1');
    const lessonName =
      typeof row.lessonName === 'string' && row.lessonName.trim()
        ? row.lessonName.trim()
        : `第${lessonRaw}課`;

    const audioUrl = typeof row.audioUrl === 'string' ? row.audioUrl.trim() : '';

    items.push({
      id: `gas-${index + 1}-${Date.now().toString(36)}`,
      grade: gradeRaw,
      gradeName,
      lesson: lessonRaw,
      lessonName,
      prompt: romanization,
      taiwanese,
      chinese,
      audioUrl
    });
  });

  return items;
}

/**
 * Parses CSV string with RFC-4180 quotation support
 */
export function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === '\t') {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        row.push(cell.trim());
        if (row.some((c) => c.length > 0)) {
          lines.push(row);
        }
        row = [];
        cell = '';
      } else if (char === '\n') {
        row.push(cell.trim());
        if (row.some((c) => c.length > 0)) {
          lines.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Transforms standard or fuzzy Google Sheet CSV rows into structured VocabItem[]
 */
export function convertRowsToVocabItems(rows: string[][]): VocabItem[] {
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[\s_\-]/g, ''));

  // Find column indices with fuzzy fallback
  const getIndex = (keys: string[]): number => {
    return headers.findIndex((h) => keys.some((k) => h.includes(k.toLowerCase())));
  };

  const gradeIdx = getIndex(['grade', '年級']);
  const gradeNameIdx = getIndex(['gradename', '年級名稱', '版本']);
  const lessonIdx = getIndex(['lesson', '課次', '課別']);
  const lessonNameIdx = getIndex(['lessonname', '課名', '單元名稱']);
  const promptIdx = getIndex(['prompt', '拼音', '台羅', '羅馬拼音', 'lomaji']);
  const taiwaneseIdx = getIndex(['taiwanese', '台語', '漢字', '台語漢字', '正解', 'word']);
  const chineseIdx = getIndex(['chinese', '華語', '中文', '翻譯', '華語翻譯', '意涵']);
  const audioIdx = getIndex(['audiourl', 'audio', 'music', '音檔', '語音', 'mp3', 'url']);
  const distractorIdx = getIndex(['customdistractors', 'distractor', '幹擾', '干擾項', '選項']);

  const items: VocabItem[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const taiwanese = taiwaneseIdx >= 0 && row[taiwaneseIdx] ? row[taiwaneseIdx].trim() : '';
    if (!taiwanese) continue; // must have taiwanese text

    const grade = gradeIdx >= 0 && row[gradeIdx] ? row[gradeIdx].trim() : '3';
    const gradeName =
      gradeNameIdx >= 0 && row[gradeNameIdx]
        ? row[gradeNameIdx].trim()
        : `${grade}年級`;

    const lesson = lessonIdx >= 0 && row[lessonIdx] ? row[lessonIdx].trim() : '1';
    const lessonName =
      lessonNameIdx >= 0 && row[lessonNameIdx]
        ? row[lessonNameIdx].trim()
        : `第${lesson}課`;

    const prompt = promptIdx >= 0 && row[promptIdx] ? row[promptIdx].trim() : '';
    const chinese = chineseIdx >= 0 && row[chineseIdx] ? row[chineseIdx].trim() : taiwanese;
    const audioUrl = audioIdx >= 0 && row[audioIdx] ? row[audioIdx].trim() : '';
    const customDistractors = distractorIdx >= 0 && row[distractorIdx] ? row[distractorIdx].trim() : '';

    items.push({
      id: `sheet-${r}-${Date.now().toString(36)}`,
      grade,
      gradeName,
      lesson,
      lessonName,
      prompt,
      taiwanese,
      chinese,
      audioUrl,
      customDistractors: customDistractors || undefined
    });
  }

  return items;
}

/**
 * Converts Google Sheets URL into downloadable CSV/GViz endpoint
 */
export function formatGoogleSheetUrl(url: string): string {
  const trimmed = url.trim();
  
  // If user passed already a CSV or gviz endpoint
  if (trimmed.includes('output=csv') || trimmed.includes('/gviz/tq?tqx=out:csv')) {
    return trimmed;
  }

  // If it's a standard sheet URL like https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    const gidMatch = trimmed.match(/gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`;
  }

  return trimmed;
}

/**
 * Fetches and parses Google Spreadsheet or Google Apps Script Web App URL
 */
export async function fetchVocabFromGoogleSheet(url: string): Promise<{ items: VocabItem[]; error?: string }> {
  try {
    const trimmed = (url || '').trim() || GAS_API_URL;

    // Check if it is a Google Apps Script Web App URL (script.google.com)
    if (trimmed.includes('script.google.com')) {
      const response = await fetch(trimmed, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`無法存取 Google 應用程式腳本 (HTTP ${response.status})。請確認網址已發布為「知道連結的任何人皆可存取」。`);
      }

      const json = await response.json();
      const items = parseGASJson(json);

      if (items.length === 0) {
        throw new Error('未在 Google Apps Script 回傳資料中讀取到有效題目，請確認資料結構');
      }

      return { items };
    }

    // Google Sheets CSV format
    const fetchUrl = formatGoogleSheetUrl(trimmed);
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      throw new Error(`無法存取試算表 (HTTP ${response.status})。請確認試算表已開啟「知道連結的任何人皆可查看」或已「發布到網路」。`);
    }

    const text = await response.text();

    // Check if response is JSON (in case a GAS URL was passed without script.google.com domain)
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        const parsedJson = JSON.parse(text);
        const gasItems = parseGASJson(parsedJson);
        if (gasItems.length > 0) {
          return { items: gasItems };
        }
      } catch {
        // continue to CSV parsing
      }
    }

    const rows = parseCSV(text);
    const items = convertRowsToVocabItems(rows);

    if (items.length === 0) {
      throw new Error('未在試算表中讀取到有效題目資料，請檢查欄位名稱（taiwanese / audioUrl / grade / lesson）');
    }

    return { items };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '載入失敗，請檢查網路連線或試算表分享權限。';
    return { items: DEFAULT_VOCAB_DATA, error: message };
  }
}
