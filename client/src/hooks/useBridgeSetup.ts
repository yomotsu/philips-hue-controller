import { useState } from "react";
import { discoverBridge, createUser, setConfig } from "../api";

type Step = "discover" | "link";
type Status = "idle" | "loading" | "error";

export function useBridgeSetup(onComplete: () => void) {
  const [step, setStep] = useState<Step>("discover");
  const [bridgeIp, setBridgeIp] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [linkButtonRequired, setLinkButtonRequired] = useState(false);

  async function handleDiscover(ip: string) {
    setStatus("loading");
    setError(null);
    try {
      await discoverBridge(ip);
      setBridgeIp(ip);
      setStep("link");
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "接続に失敗しました");
      setStatus("error");
    }
  }

  async function handleCreateUser() {
    setStatus("loading");
    setError(null);
    setLinkButtonRequired(false);
    try {
      const result = await createUser(bridgeIp);
      if (result.linkButtonRequired) {
        setLinkButtonRequired(true);
        setStatus("idle");
        return;
      }
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "APIキーの取得に失敗しました");
      setStatus("error");
    }
  }

  async function handleManualSave(username: string) {
    setStatus("loading");
    setError(null);
    try {
      await setConfig(bridgeIp, username);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
      setStatus("error");
    }
  }

  async function handleDirectSave(ip: string, username: string) {
    setStatus("loading");
    setError(null);
    try {
      await setConfig(ip, username);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
      setStatus("error");
    }
  }

  return {
    step,
    bridgeIp,
    status,
    error,
    linkButtonRequired,
    handleDiscover,
    handleCreateUser,
    handleManualSave,
    handleDirectSave,
  };
}
