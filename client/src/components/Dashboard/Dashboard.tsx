import { useLights } from "../../hooks/useLights";
import { LightCard } from "./LightCard";

export function Dashboard() {
  const { lights, rooms, loading, error, toggle, toggleRoomById, refresh, togglingIds, togglingRoomIds } = useLights();

  const lightMap = new Map(lights.map((l) => [l.id, l]));
  const assignedIds = new Set(rooms.flatMap((r) => r.lightIds));
  const unassigned = lights.filter((l) => !assignedIds.has(l.id));

  function renderRoomLights(lightItems: typeof lights) {
    return (
      <details className="mt-2 group">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-400 transition-colors select-none py-1 flex items-center gap-1.5">
          <span className="text-xs transition-transform group-open:rotate-90 inline-block">▶</span>
          個別操作
        </summary>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 mt-3">
          {lightItems.map((light) => (
            <LightCard
              key={light.id}
              light={light}
              onToggle={toggle}
              toggling={togglingIds.has(light.id)}
            />
          ))}
        </div>
      </details>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <header className="flex justify-between items-center mb-7">
        <h1 className="text-2xl font-bold text-[#f0c040]">Philips Hue</h1>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-[#2a2a4a] text-[#e0e0e0] font-bold text-sm cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "読込中..." : "更新"}
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
              <section key={room.id} className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                    {room.name}
                  </h2>
                  <button
                    onClick={() => toggleRoomById(room.id)}
                    disabled={togglingRoomIds.has(room.id)}
                    className={`px-3.5 py-1.5 rounded-md text-sm font-bold cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed ${
                      room.anyOn ? "bg-[#555] text-[#ccc]" : "bg-[#f0c040] text-[#1a1a2e]"
                    }`}
                  >
                    {togglingRoomIds.has(room.id) ? "..." : room.anyOn ? "すべてOFF" : "すべてON"}
                  </button>
                </div>
                {renderRoomLights(roomLights)}
              </section>
            );
          })}
          {unassigned.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                  その他
                </h2>
              </div>
              {renderRoomLights(unassigned)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
