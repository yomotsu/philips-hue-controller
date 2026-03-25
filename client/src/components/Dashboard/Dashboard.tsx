import { useState, useRef, Fragment } from "react";
import { useLights } from "../../hooks/useLights";
import { useSwitchBot } from "../../hooks/useSwitchBot";
import { LightCard } from "./LightCard";
import { SwitchBotSection } from "./SwitchBotSection";

export function Dashboard() {
  const { lights, rooms, loading, error, toggle, toggleRoomById, turnAllOff: hueAllOff, turnGoodnightOff: hueGoodnightOff, reorderRooms, refresh, togglingIds, togglingRoomIds, allOff, goodnight } = useLights();
  const switchBot = useSwitchBot();

  async function turnAllOff() {
    await Promise.all([hueAllOff(), switchBot.turnAllOff()]);
  }

  async function turnGoodnightOff() {
    await Promise.all([hueGoodnightOff(), switchBot.turnAllOff()]);
  }
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const switchRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragHandleRef = useRef<string | null>(null);

  function handleSwitchKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      switchRefs.current[index + 1]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      switchRefs.current[index - 1]?.focus();
    }
  }

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
    <div className="max-w-2xl mx-auto py-4">
      <header className="mb-4 px-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-3">
          <div />
          <h1 className="text-2xl font-bold text-[#f0c040] whitespace-nowrap">Home Controls</h1>
          <div className="flex justify-end">
            <button
              onClick={() => { refresh(); switchBot.refresh(); }}
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
        <div className="flex gap-2">
          <button
            ref={(el) => { switchRefs.current[0] = el; }}
            onKeyDown={(e) => handleSwitchKeyDown(e, 0)}
            onClick={turnAllOff}
            disabled={allOff || loading || rooms.every((r) => !r.anyOn)}
            className="flex-1 px-4 py-2 rounded-lg bg-[#2a2a4a] text-[#e0e0e0] font-bold text-sm cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity whitespace-nowrap"
          >
            {allOff ? "..." : "全OFF"}
          </button>
          <button
            onClick={turnGoodnightOff}
            disabled={goodnight || loading || rooms.filter((r) => r.name.toUpperCase() !== "BEDROOM").every((r) => !r.anyOn)}
            title="おやすみ（BEDROOM以外をOFF）"
            className="px-3 py-2 rounded-lg bg-[#2a2a4a] text-[#e0e0e0] cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {goodnight ? "..." : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>
        </div>
      </header>
      {error && <p className="mb-4 text-red-500 text-sm">{error}</p>}
      {loading && lights.length === 0 ? (
        <p className="text-gray-500 text-center py-10">ライトを取得中...</p>
      ) : (
        <>
        <div className="pl-2 pr-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">Philips Hue</span>
            <div className="flex-1 h-px bg-[#2a2a4a]" />
          </div>
        </div>
        <div
          className="pl-2 pr-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (!dragId || !dragOverId) { setDragId(null); setDragOverId(null); return; }
            const ids = rooms.map((r) => r.id);
            const from = ids.indexOf(dragId);
            const to = ids.indexOf(dragOverId);
            if (from !== to) {
              const next = [...ids];
              next.splice(from, 1);
              next.splice(to, 0, dragId);
              reorderRooms(next);
            }
            setDragId(null);
            setDragOverId(null);
          }}
        >
          {rooms.map((room, index) => {
            const roomLights = room.lightIds
              .map((id) => lightMap.get(id))
              .filter((l): l is NonNullable<typeof l> => l != null);
            if (roomLights.length === 0) return null;
            const isDragging = dragId === room.id;
            const isOver = dragOverId === room.id && dragId !== room.id;
            return (
              <Fragment key={room.id}>
                <div className={`h-0.5 rounded-full transition-colors ${isOver ? "bg-[#f0c040]" : "bg-transparent"}`} />
              <section
                draggable
                onDragStart={(e) => { if (dragHandleRef.current !== room.id) { e.preventDefault(); return; } e.dataTransfer.effectAllowed = "move"; setDragId(room.id); }}
                onDragOver={(e) => {
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relY = e.clientY - rect.top;
                  if (relY <= 25) {
                    if (room.id !== dragId) setDragOverId(room.id);
                  } else if (relY >= rect.height - 25) {
                    const next = rooms[index + 1];
                    if (next && next.id !== dragId) setDragOverId(next.id);
                    else setDragOverId(null);
                  } else {
                    setDragOverId(null);
                  }
                }}
onDragEnd={() => { dragHandleRef.current = null; setDragId(null); setDragOverId(null); }}
                className={`group my-1.5 transition-opacity ${isDragging ? "opacity-40" : "opacity-100"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className="text-[#444] group-hover:text-white cursor-grab active:cursor-grabbing flex-shrink-0 pl-0.5 transition-colors"
                      onMouseDown={() => { dragHandleRef.current = room.id; }}
                      onMouseUp={() => { dragHandleRef.current = null; }}
                    >
                      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                        <circle cx="3" cy="2.5" r="1.2"/><circle cx="3" cy="7" r="1.2"/><circle cx="3" cy="11.5" r="1.2"/>
                        <circle cx="7" cy="2.5" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/>
                      </svg>
                    </span>
                    <button
                      onClick={() => toggleSection(room.id)}
                      className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer min-w-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform flex-shrink-0 ${openSections.has(room.id) ? "rotate-90" : ""}`}>
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                      <span className="text-sm font-semibold uppercase tracking-widest">
                        {room.name}
                      </span>
                    </button>
                  </div>
                  <button
                    ref={(el) => { switchRefs.current[index + 1] = el; }}
                    onClick={() => { if (!togglingRoomIds.has(room.id)) toggleRoomById(room.id); }}
                    onKeyDown={(e) => handleSwitchKeyDown(e, index + 1)}
                    aria-disabled={togglingRoomIds.has(room.id)}
                    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer aria-disabled:opacity-40 aria-disabled:cursor-not-allowed flex-shrink-0 ${
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
              </Fragment>
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
        </div>
        </>
      )}
      <SwitchBotSection
        devices={switchBot.devices}
        loading={switchBot.loading}
        error={switchBot.error}
        configured={switchBot.configured}
        toggle={switchBot.toggle}
        configure={switchBot.configure}
      />
    </div>
  );
}
