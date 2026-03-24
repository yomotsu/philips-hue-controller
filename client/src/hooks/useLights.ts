import { useState, useEffect, useCallback } from "react";
import type { Light, Room } from "../types";
import { getLights, getRooms, toggleLight, toggleRoom, allLightsOff, goodnightOff, saveRoomOrder } from "../api";

interface HueEventItem {
  type: string;
  id_v1?: string;
  on?: { on: boolean };
}

interface HueEvent {
  type: string;
  data: HueEventItem[];
}

export function useLights() {
  const [lights, setLights] = useState<Light[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [togglingRoomIds, setTogglingRoomIds] = useState<Set<string>>(new Set());
  const [allOff, setAllOff] = useState(false);
  const [goodnight, setGoodnight] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lightsData, roomsData] = await Promise.all([getLights(), getRooms()]);
      setLights(lightsData);
      setRooms(roomsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const es = new EventSource("/api/events");

    es.onmessage = (event) => {
      try {
        const updates = JSON.parse(event.data as string) as HueEvent[];
        for (const update of updates) {
          if (update.type !== "update") continue;
          for (const item of update.data) {
            if (item.type === "light" && item.id_v1 && item.on !== undefined) {
              const lightId = item.id_v1.replace("/lights/", "");
              const newOn = item.on.on;
              setLights((prev) => {
                const updated = prev.map((l) =>
                  l.id === lightId ? { ...l, on: newOn } : l
                );
                setRooms((prevRooms) =>
                  prevRooms.map((r) => ({
                    ...r,
                    anyOn: r.lightIds.some(
                      (id) => updated.find((l) => l.id === id)?.on ?? false
                    ),
                  }))
                );
                return updated;
              });
            }
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => es.close();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleFocus = () => load();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") load();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [load]);

  async function toggle(id: string) {
    setTogglingIds((prev) => new Set(prev).add(id));
    setLights((prev) =>
      prev.map((l) => (l.id === id ? { ...l, on: !l.on } : l))
    );
    try {
      const result = await toggleLight(id);
      setLights((prev) =>
        prev.map((l) => (l.id === id ? { ...l, on: result.on } : l))
      );
    } catch {
      setLights((prev) =>
        prev.map((l) => (l.id === id ? { ...l, on: !l.on } : l))
      );
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function toggleRoomById(id: string) {
    setTogglingRoomIds((prev) => new Set(prev).add(id));
    try {
      const result = await toggleRoom(id);
      // ルームに属するライトの状態を一括更新
      setRooms((prev) =>
        prev.map((r) => (r.id === id ? { ...r, anyOn: result.on } : r))
      );
      setLights((prev) =>
        prev.map((l) => {
          const room = rooms.find((r) => r.id === id);
          return room?.lightIds.includes(l.id) ? { ...l, on: result.on } : l;
        })
      );
    } finally {
      setTogglingRoomIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function turnAllOff() {
    setAllOff(true);
    try {
      await allLightsOff();
      setLights((prev) => prev.map((l) => ({ ...l, on: false })));
      setRooms((prev) => prev.map((r) => ({ ...r, anyOn: false })));
    } finally {
      setAllOff(false);
    }
  }

  async function turnGoodnightOff() {
    setGoodnight(true);
    try {
      await goodnightOff();
      setRooms((prev) =>
        prev.map((r) =>
          r.name.toUpperCase() !== "BEDROOM" ? { ...r, anyOn: false } : r
        )
      );
      setLights((prev) => {
        const bedroomIds = new Set(
          rooms.filter((r) => r.name.toUpperCase() === "BEDROOM").flatMap((r) => r.lightIds)
        );
        return prev.map((l) => (bedroomIds.has(l.id) ? l : { ...l, on: false }));
      });
    } finally {
      setGoodnight(false);
    }
  }

  async function reorderRooms(ids: string[]) {
    setRooms((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      return ids.map((id) => map.get(id)).filter((r): r is NonNullable<typeof r> => r != null);
    });
    await saveRoomOrder(ids);
  }

  return { lights, rooms, loading, error, toggle, toggleRoomById, turnAllOff, turnGoodnightOff, reorderRooms, refresh: load, togglingIds, togglingRoomIds, allOff, goodnight };
}
