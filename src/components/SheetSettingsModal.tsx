import React, { useState } from 'react';
import { X, Database, Check, AlertCircle, RefreshCw, FileSpreadsheet, ExternalLink, HelpCircle, Zap, Code2 } from 'lucide-react';
import { VocabItem } from '../types';
import { fetchVocabFromGoogleSheet, parseCSV, convertRowsToVocabItems } from '../utils/sheetParser';
import { DEFAULT_VOCAB_DATA, GAS_API_URL } from '../data/defaultVocab';
import { sfx } from '../utils/audioSynthesizer';

interface SheetSettingsModalProps {
  currentSheetUrl: string;
  onSaveSheetData: (items: VocabItem[], sheetUrl: string) => void;
  onClose: () => void;
  currentVocabCount: number;
}

export const SheetSettingsModal: React.FC<SheetSettingsModalProps> = ({
  currentSheetUrl,
  onSaveSheetData,
  onClose,
  currentVocabCount
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'csv' | 'gas_guide'>('url');
  const [urlInput, setUrlInput] = useState(currentSheetUrl || GAS_API_URL);
  const [csvInput, setCsvInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ count: number; grades: string[] } | null>(null);

  // Handle Fetch (GAS Web App or Google Sheets CSV)
  const handleFetchUrl = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || urlInput;
    if (!targetUrl.trim()) {
      setErrorMessage('請輸入 Google Apps Script 網路應用程式或 Google 試算表連結');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    const result = await fetchVocabFromGoogleSheet(targetUrl);

    setIsLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      const grades = Array.from(new Set(result.items.map((i) => i.gradeName || `${i.grade}年級`)));
      setSuccessInfo({
        count: result.items.length,
        grades
      });
      sfx.playCorrect();
      onSaveSheetData(result.items, targetUrl);
    }
  };

  // Handle Direct CSV Text Parsing
  const handleParseCsv = () => {
    if (!csvInput.trim()) {
      setErrorMessage('請貼上 CSV 或表格內容');
      return;
    }

    try {
      const rows = parseCSV(csvInput);
      const items = convertRowsToVocabItems(rows);

      if (items.length === 0) {
        setErrorMessage('未能成功解析有效詞彙，請確認第一列包含欄位名稱（如 taiwanese, audioUrl, grade, lesson）');
        return;
      }

      const grades = Array.from(new Set(items.map((i) => i.gradeName || `${i.grade}年級`)));
      setSuccessInfo({
        count: items.length,
        grades
      });
      setErrorMessage(null);
      sfx.playCorrect();
      onSaveSheetData(items, 'csv-direct-input');
    } catch {
      setErrorMessage('CSV 解析出錯，請確認格式');
    }
  };

  // Reset to Default Mock / Official GAS Data
  const handleResetDefault = () => {
    sfx.playHit(0.3);
    setUrlInput(GAS_API_URL);
    setCsvInput('');
    setErrorMessage(null);
    setSuccessInfo({
      count: DEFAULT_VOCAB_DATA.length,
      grades: ['真平版 3年級', '康軒版 4年級', '康軒版 5年級', '真平版 6年級']
    });
    onSaveSheetData(DEFAULT_VOCAB_DATA, GAS_API_URL);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-amber-50 rounded-3xl border-4 border-amber-500 shadow-2xl p-6 sm:p-8 my-8 text-stone-900 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b-2 border-amber-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-950">
                題庫連結與同步設定
              </h2>
              <p className="text-xs text-stone-600 font-bold">
                目前載入：{currentVocabCount} 個語詞（已整合 Google Apps Script 雲端題庫）
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

        {/* Mode Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => {
              setActiveTab('url');
              setErrorMessage(null);
            }}
            className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm border-2 transition-all ${
              activeTab === 'url'
                ? 'bg-amber-500 text-white border-amber-700 shadow-sm'
                : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/50'
            }`}
          >
            ⚡ Google 題庫 API / 試算表同步
          </button>
          <button
            onClick={() => {
              setActiveTab('csv');
              setErrorMessage(null);
            }}
            className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm border-2 transition-all ${
              activeTab === 'csv'
                ? 'bg-amber-500 text-white border-amber-700 shadow-sm'
                : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/50'
            }`}
          >
            📋 直接貼上 CSV 表格
          </button>
          <button
            onClick={() => setActiveTab('gas_guide')}
            className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm border-2 transition-all ${
              activeTab === 'gas_guide'
                ? 'bg-amber-500 text-white border-amber-700 shadow-sm'
                : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/50'
            }`}
          >
            💡 程式碼.gs 說明
          </button>
        </div>

        {/* Tab 1: Google Sheet / Apps Script URL Input */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            {/* Quick One-Click Sync for user's official GAS */}
            <div className="p-3.5 bg-amber-100/80 rounded-2xl border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                  <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span>預設官方 155 詞完整題庫 (Google Apps Script API)</span>
                </div>
                <p className="text-[11px] text-amber-900/80 font-bold mt-0.5">
                  真平 3 年級、康軒 4 年級、康軒 5 年級、真平 6 年級
                </p>
              </div>
              <button
                onClick={() => {
                  setUrlInput(GAS_API_URL);
                  handleFetchUrl(GAS_API_URL);
                }}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs border border-amber-800 shadow transition-all active:scale-95 flex items-center justify-center gap-1 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>立即一鍵同步最新題庫</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-amber-900 mb-1.5">
                Google 應用程式腳本網址 (Web App /exec) 或 Google 試算表連結
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-amber-300 bg-white text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  id="fetch-sheet-btn"
                  onClick={() => handleFetchUrl()}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm border-2 border-emerald-800 shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  <span>{isLoading ? '同步中...' : '讀取題庫'}</span>
                </button>
              </div>
            </div>

            {/* Hint Box */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 text-xs text-stone-700 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>系統已內建支援兩種連結格式：</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-stone-600">
                <li><strong>Google Apps Script 網路應用程式</strong>：網址結尾為 <code>/exec</code>，回傳題庫 JSON。</li>
                <li><strong>標準 Google 試算表網址</strong>：只要將共用權限設為「知道連結的任何人皆可查看」即可直接貼上。</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Direct CSV / TSV Paste */}
        {activeTab === 'csv' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-amber-900 mb-1.5">
                從 Excel 或 Google 試算表複製整份表格直接貼於此：
              </label>
              <textarea
                rows={5}
                placeholder="grade,gradeName,lesson,lessonName,prompt,taiwanese,chinese,audioUrl&#10;3,真平版 3年級,1,第一課 食晝,gû-ling,牛奶,牛奶,https://..."
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-300 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              onClick={handleParseCsv}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm border-2 border-emerald-800 shadow-md transition-all active:scale-95"
            >
              解析並套用此表格
            </button>
          </div>
        )}

        {/* Tab 3: Google Apps Script Guide */}
        {activeTab === 'gas_guide' && (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-950 font-bold flex items-start gap-2">
              <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-sm text-emerald-900">解答：您不需再於「程式碼.gs」中輸入內容！</p>
                <p className="mt-1 font-normal text-xs text-emerald-800">
                  您所提供的 Apps Script 網址已經成功編寫並發布完成。本網頁已直接將該 API 寫入遊戲作為預設題庫來源，並已內建解析與發音引擎。
                </p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-black text-amber-950 text-xs">
                <Code2 className="w-4 h-4 text-amber-700" />
                <span>您的 Apps Script 端點資訊：</span>
              </div>
              <div className="bg-stone-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] break-all select-all">
                https://script.google.com/macros/s/AKfycbx-gByr1mHa-l0pA-KbXdnYmMsozvAYRwFqSWKoDroT0ssApHTz65-Fj4eGCU6eb0sC/exec
              </div>
              <p className="text-stone-600">
                若您日後在試算表中新增更多課次或修改語詞，只要您的 Apps Script 會讀取最新試算表，直接點擊本視窗的<strong>「立即一鍵同步最新題庫」</strong>即可自動獲取最新題目！
              </p>
            </div>
          </div>
        )}

        {/* Feedback Message */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-100 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {successInfo && (
          <div className="mt-4 p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>成功同步 {successInfo.count} 個語詞！涵蓋 {successInfo.grades.join(', ')}</span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700"
            >
              完成返回
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t-2 border-amber-200 flex items-center justify-between">
          <button
            onClick={handleResetDefault}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 underline decoration-amber-400 underline-offset-4 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重新載入預設 155 詞題庫</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-bold text-xs sm:text-sm border border-stone-400 transition-all active:scale-95"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
