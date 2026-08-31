import React from 'react';
import { X, Sparkles, BookOpen, Volume2, Award, Zap, HelpCircle } from 'lucide-react';

interface TeacherGuideModalProps {
  onClose: () => void;
}

export const TeacherGuideModal: React.FC<TeacherGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-amber-50 rounded-3xl border-4 border-amber-500 shadow-2xl p-6 sm:p-8 my-8 text-stone-900 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b-2 border-amber-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600 text-white rounded-xl shadow-sm">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-950">
                教師教學指引與遊戲說明
              </h2>
              <p className="text-xs text-stone-600 font-bold">
                閩南語聽力打地鼠 ‧ 互動式本土語文數位教材
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

        {/* Content Guide */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1 text-xs sm:text-sm">
          {/* Section 1: Gameplay */}
          <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 space-y-2">
            <h3 className="font-black text-amber-900 flex items-center gap-1.5 text-base">
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span>1. 核心玩法與遊戲機制</span>
            </h3>
            <ul className="list-disc list-inside space-y-1 text-stone-700 leading-relaxed pl-1">
              <li><strong>聽音辨字</strong>：每題自動播放閩南語音檔，學生需從地洞冒出的漢字中，點擊正確的語詞。</li>
              <li><strong>時間紅利</strong>：上方時間條倒數中，越快敲擊答對分數越高！</li>
              <li><strong>連擊與狂熱 (Combo & Fever)</strong>：連續答對 5 題會啟動「狂熱模式」，分數加倍且地鼠戴上金冠。</li>
              <li><strong>防猜懲罰</strong>：答錯會扣除 20 分並中斷連擊，鼓勵學生先聽後答。</li>
            </ul>
          </div>

          {/* Section 2: Google Sheets Setup */}
          <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 space-y-2">
            <h3 className="font-black text-amber-900 flex items-center gap-1.5 text-base">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>2. 試算表題庫連結步驟</span>
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-stone-700 leading-relaxed pl-1">
              <li>在 Google 試算表中建立 A 到 H 欄：<code>grade</code>, <code>gradeName</code>, <code>lesson</code>, <code>lessonName</code>, <code>prompt</code>, <code>taiwanese</code>, <code>chinese</code>, <code>audioUrl</code>。</li>
              <li>點擊試算表右上角<strong>「共用」</strong>，設為<strong>「知道連結的任何人皆可查看」</strong>。</li>
              <li>複製試算表網址，貼到遊戲的<strong>「連結試算表」</strong>視窗中即可立即套用！</li>
            </ol>
          </div>

          {/* Section 3: Audio Tips & Google Drive / Apps Script Audio Guide */}
          <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 space-y-2">
            <h3 className="font-black text-amber-900 flex items-center gap-1.5 text-base">
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span>3. 自訂台語音檔設定說明（Google Drive / MP3）</span>
            </h3>
            <div className="space-y-1.5 text-stone-700 leading-relaxed pl-1 text-xs">
              <p>
                <strong>為什麼會聽到國語？</strong>
                因為當題庫中 <code>audioUrl</code> 欄位為空值時，瀏覽器若無內建台語發音引擎，可能會無法正確合成台語語音。
              </p>
              <p>
                <strong>如何加入自訂台語音檔？</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>將您的 MP3 錄音檔上傳至 <strong>Google 雲端硬碟</strong>。</li>
                <li>將音檔共用設定為「知道連結的人皆可檢視」，並將共用連結（如 <code>https://drive.google.com/file/d/XXXX/view</code>）填入試算表的 <code>audioUrl</code> 欄位。</li>
                <li>本遊戲<strong>已內建 Google Drive 直連串流轉換</strong>，會自動解析並流暢播放！</li>
                <li>在 Google Apps Script (<code>程式碼.gs</code>) 中，確保回傳物件有包含 <code>audioUrl: row[7]</code> 即可。</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t-2 border-amber-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm border-2 border-amber-700 shadow-sm transition-all active:scale-95"
          >
            我知道了，開始遊戲！
          </button>
        </div>
      </div>
    </div>
  );
};
