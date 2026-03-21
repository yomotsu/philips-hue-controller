import { useState } from "react";

interface Props {
  onDiscover: (ip: string) => void;
  onDirectSave: (ip: string, username: string) => void;
  loading: boolean;
  error: string | null;
}

export function DiscoverStep({ onDiscover, onDirectSave, loading, error }: Props) {
  const [ip, setIp] = useState("");
  const [showDirect, setShowDirect] = useState(false);
  const [directIp, setDirectIp] = useState("");
  const [username, setUsername] = useState("");

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Bridge IPアドレスを入力</h2>
      <p className="text-gray-400 mb-5 leading-relaxed">
        Hue BridgeのIPアドレスをHueアプリまたはルーターの管理画面で確認してください。
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="例: 192.168.1.100"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ip && onDiscover(ip)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-[#333] bg-[#16213e] text-[#e0e0e0] text-base focus:outline-none focus:border-[#f0c040]"
        />
        <button
          onClick={() => onDiscover(ip)}
          disabled={!ip || loading}
          className="px-5 py-2.5 rounded-lg bg-[#f0c040] text-[#1a1a2e] font-bold cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {loading && !showDirect ? "接続中..." : "接続"}
        </button>
      </div>
      {error && !showDirect && <p className="mt-3 text-red-500 text-sm">{error}</p>}

      <div className="mt-8 border-t border-[#333] pt-5">
        <button
          onClick={() => setShowDirect((v) => !v)}
          disabled={loading}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {showDirect ? "▲ 直接入力を閉じる" : "▼ IPアドレスとAPIキーを直接入力する"}
        </button>
        {showDirect && (
          <div className="mt-3 flex flex-col gap-2">
            <input
              type="text"
              placeholder="IPアドレス（例: 192.168.1.100）"
              value={directIp}
              onChange={(e) => setDirectIp(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-[#333] bg-[#16213e] text-[#e0e0e0] text-base focus:outline-none focus:border-[#f0c040]"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="APIキー（username）"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && directIp && username && onDirectSave(directIp, username)
                }
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#333] bg-[#16213e] text-[#e0e0e0] text-base focus:outline-none focus:border-[#f0c040]"
              />
              <button
                onClick={() => onDirectSave(directIp, username)}
                disabled={!directIp || !username || loading}
                className="px-5 py-2.5 rounded-lg bg-[#f0c040] text-[#1a1a2e] font-bold cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {loading && showDirect ? "保存中..." : "保存"}
              </button>
            </div>
            {error && showDirect && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
