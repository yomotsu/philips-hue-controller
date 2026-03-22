import { useState } from "react";
import { useLights } from "../../hooks/useLights";
import { LightCard } from "./LightCard";

export function Dashboard() {
  const { lights, rooms, loading, error, toggle, toggleRoomById, turnAllOff, refresh, togglingIds, togglingRoomIds, allOff } = useLights();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const lightMap = new Map(lights.map((l) => [l.id, l]));
  const assignedIds = new Set(rooms.flatMap((r) => r.lightIds));
  const unassigned = lights.filter((l) => !assignedIds.has(l.id));

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function renderRoomLights(id: string, lightItems: typeof lights) {
    return openSections.has(id) ? (
      <div className="flex flex-col gap-1 mt-3">
        {lightItems.map((light) => (
          <LightCard
            key={light.id}
            light={light}
            onToggle={toggle}
            toggling={togglingIds.has(light.id)}
          />
        ))}
      </div>
    ) : null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="mb-7">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-3">
          <div />
          <h1 className="text-2xl font-bold text-[#f0c040] whitespace-nowrap">Philips Hue</h1>
          <div className="flex justify-end">
            <button
              onClick={refresh}
              disabled={loading}
              className="p-1.5 rounded-lg bg-[#2a2a4a] text-[#e0e0e0] cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""}>
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
            </button>
          </div>
        </div>
        <button
          onClick={turnAllOff}
          disabled={allOff || loading}
          className="w-full px-4 py-2 rounded-lg bg-[#2a2a4a] text-[#e0e0e0] font-bold text-sm cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity whitespace-nowrap"
        >
          {allOff ? "..." : "全OFF"}
        </button>
      </header>
      {error && <p className="mb-4 text-red-500 text-sm">{error}</p>}
      {loading && lights.length === 0 ? (
        <p className="text-gray-500 text-center py-10">ライトを取得中...</p>
      ) : (
        <>
          {rooms.map((room) => {
            const roomLights = room.lightIds
              .map((id) => lightMap.get(id))
              .filter((l): l is NonNullable<typeof l> => l != null);
            if (roomLights.length === 0) return null;
            return (
              <section key={room.id} className="mb-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleSection(room.id)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform flex-shrink-0 ${openSections.has(room.id) ? "rotate-90" : ""}`}>
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                    <span className="text-sm font-semibold uppercase tracking-widest">
                      {room.name}
                    </span>
                  </button>
                  <button
                    onClick={() => toggleRoomById(room.id)}
                    disabled={togglingRoomIds.has(room.id)}
                    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 ${
                      room.anyOn ? "bg-[#f0c040]" : "bg-[#444] ring-1 ring-[#666]"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      room.anyOn ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
                {renderRoomLights(room.id, roomLights)}
              </section>
            );
          })}
          {unassigned.length > 0 && (
            <section className="mb-6">
              <button
                onClick={() => toggleSection("__unassigned__")}
                className="flex items-center gap-1.5 mb-3 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform flex-shrink-0 ${openSections.has("__unassigned__") ? "rotate-90" : ""}`}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
                <h2 className="text-sm font-semibold uppercase tracking-widest">
                  その他
                </h2>
              </button>
              {renderRoomLights("__unassigned__", unassigned)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
