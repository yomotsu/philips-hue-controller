import { useState, useEffect, useCallback } from "react";
import type { SwitchBotDevice } from "../types";
import { getSwitchBotConfig, setSwitchBotConfig, getSwitchBotDevices, toggleSwitchBot } from "../api";

export function useSwitchBot() {
  const [devices, setDevices] = useState<SwitchBotDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const config = await getSwitchBotConfig();
      if (!config.configured) {
        setConfigured(false);
        setDevices([]);
        return;
      }
      setConfigured(true);
      const data = await getSwitchBotDevices();
      setDevices(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "SwitchBotの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
    const prev = devices.find((d) => d.id === id);
    if (!prev) return;
    setDevices((ds) => ds.map((d) => (d.id === id ? { ...d, on: !d.on } : d)));
    try {
      const result = await toggleSwitchBot(id);
      setDevices((ds) => ds.map((d) => (d.id === id ? { ...d, on: result.on } : d)));
    } catch {
      setDevices((ds) => ds.map((d) => (d.id === id ? { ...d, on: prev.on } : d)));
    }
  }

  async function turnAllOff() {
    const onDevices = devices.filter((d) => d.on);
    if (onDevices.length === 0) return;
    setDevices((ds) => ds.map((d) => ({ ...d, on: false })));
    try {
      await Promise.all(onDevices.map((d) => toggleSwitchBot(d.id)));
    } catch {
      await load();
    }
  }

  async function configure(token: string, secret: string) {
    await setSwitchBotConfig(token, secret);
    await load();
  }

  return { devices, loading, error, configured, toggle, turnAllOff, configure, refresh: load };
}
