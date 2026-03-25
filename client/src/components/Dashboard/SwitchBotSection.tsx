import { useState, useRef, useEffect } from "react";
import type { SwitchBotDevice } from "../../types";

interface Props {
  devices: SwitchBotDevice[];
  loading: boolean;
  error: string | null;
  configured: boolean;
  toggle: (id: string) => void;
  configure: (token: string, secret: string) => Promise<void>;
}

function HelpPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-5 h-5 rounded-full bg-[#2a2a4a] text-gray-400 hover:text-[#e0e0e0] text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
      >
        ?
      </button>
      {open && (
        <div className="absolute left-0 top-7 z-50 w-72 rounded-xl bg-[#1e1e3a] border border-[#2a2a4a] p-3 text-xs text-[#c0c0d0] leading-relaxed shadow-xl">
          <p className="font-semibold text-[#e0e0e0] mb-1.5">Token / Secret の取得方法</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>SwitchBot アプリを開く</li>
            <li>プロフィール → 設定（歯車アイコン）</li>
            <li><span className="text-[#f0c040]">アプリバージョンを 10 回連続タップ</span></li>
            <li>「開発者向けオプション」をタップ</li>
            <li>Token と Client Secret をコピー</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export function SwitchBotSection({ devices, loading, error, configured, toggle, configure }: Props) {
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!token || !secret) return;
    setSaving(true);
    try {
      await configure(token, secret);
      setToken("");
      setSecret("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pl-2 pr-4 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">SwitchBot</span>
        <div className="flex-1 h-px bg-[#2a2a4a]" />
      </div>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {!configured && !loading ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <HelpPopover />
            <input
              type="text"
              placeholder="Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#1e1e3a] border border-[#2a2a4a] text-sm text-[#e0e0e0] placeholder-gray-600 focus:outline-none focus:border-[#f0c040]"
            />
            <input
              type="password"
              placeholder="Secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#1e1e3a] border border-[#2a2a4a] text-sm text-[#e0e0e0] placeholder-gray-600 focus:outline-none focus:border-[#f0c040]"
            />
            <button
              onClick={handleSave}
              disabled={saving || !token || !secret}
              className="px-3 py-1.5 rounded-lg bg-[#2a2a4a] text-[#e0e0e0] text-sm cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {saving ? "..." : "保存"}
            </button>
          </div>
        </div>
      ) : loading && devices.length === 0 ? (
        <p className="text-gray-500 text-sm">取得中...</p>
      ) : (
        <div className="flex flex-col">
          {devices.map((device) => (
            <div key={device.id} className="my-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0 pl-[14px]">
                <span className="text-sm">🔌</span>
                <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                  {device.name}
                </span>
              </div>
              <button
                onClick={() => toggle(device.id)}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                  device.on ? "bg-[#f0c040]" : "bg-[#444] ring-1 ring-[#666]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    device.on ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
          {configured && devices.length === 0 && !loading && (
            <p className="text-gray-500 text-sm">対象デバイスが見つかりません</p>
          )}
        </div>
      )}
    </div>
  );
}
