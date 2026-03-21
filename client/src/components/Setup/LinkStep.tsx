import { useState } from "react";

interface Props {
  bridgeIp: string;
  onActivate: () => void;
  onManualSave: (username: string) => void;
  loading: boolean;
  error: string | null;
  linkButtonRequired: boolean;
}

export function LinkStep({ bridgeIp, onActivate, onManualSave, loading, error, linkButtonRequired }: Props) {
  const [showManual, setShowManual] = useState(false);
  const [username, setUsername] = useState("");

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Bridgeのリンクボタンを押してください</h2>
      <p className="text-gray-400 mb-5 leading-relaxed">
        <strong className="text-[#e0e0e0]">{bridgeIp}</strong> のBridge本体にあるリンクボタンを押してから、下のボタンをクリックしてください。
      </p>
      <button
        onClick={onActivate}
        disabled={loading}
        className="px-5 py-2.5 rounded-lg bg-[#f0c040] text-[#1a1a2e] font-bold cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? "取得中..." : "有効化"}
      </button>
      {linkButtonRequired && (
        <p className="mt-3 text-orange-400 text-sm">
          リンクボタンが押されていません。Bridgeのボタンを押してから再度お試しください。
        </p>
      )}
      {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}

      <div className="mt-8 border-t border-[#333] pt-5">
        <button
          onClick={() => setShowManual((v) => !v)}
          disabled={loading}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {showManual ? "▲ 手動入力を閉じる" : "▼ APIキーを直接入力する"}
        </button>
        {showManual && (
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              placeholder="APIキー（username）を貼り付け"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && username && onManualSave(username)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[#333] bg-[#16213e] text-[#e0e0e0] text-base focus:outline-none focus:border-[#f0c040]"
            />
            <button
              onClick={() => onManualSave(username)}
              disabled={!username || loading}
              className="px-5 py-2.5 rounded-lg bg-[#f0c040] text-[#1a1a2e] font-bold cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
