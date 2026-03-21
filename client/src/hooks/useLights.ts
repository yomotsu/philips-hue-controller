import { useState, useEffect, useCallback } from "react";
import type { Light, Room } from "../types";
import { getLights, getRooms, toggleLight, toggleRoom } from "../api";

export function useLights() {
  const [lights, setLights] = useState<Light[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [togglingRoomIds, setTogglingRoomIds] = useState<Set<string>>(new Set());

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

  return { lights, rooms, loading, error, toggle, toggleRoomById, refresh: load, togglingIds, togglingRoomIds };
}
