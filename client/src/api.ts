import type { BridgeStatus, Light, Room } from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = (await res.json()) as T;
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }
  return data;
}

export function getBridgeStatus(): Promise<BridgeStatus> {
  return request<BridgeStatus>("/api/bridge/status");
}

export function discoverBridge(bridgeIp: string): Promise<{ name: string }> {
  return request<{ name: string }>("/api/bridge/discover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bridgeIp }),
  });
}

export function createUser(
  bridgeIp: string
): Promise<{ ok?: boolean; linkButtonRequired?: boolean }> {
  return request<{ ok?: boolean; linkButtonRequired?: boolean }>(
    "/api/bridge/create-user",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bridgeIp }),
    }
  );
}

export function setConfig(
  bridgeIp: string,
  username: string
): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/bridge/set-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bridgeIp, username }),
  });
}

export function getLights(): Promise<Light[]> {
  return request<Light[]>("/api/lights");
}

export function getRooms(): Promise<Room[]> {
  return request<Room[]>("/api/groups");
}

export function toggleRoom(id: string): Promise<{ on: boolean }> {
  return request<{ on: boolean }>(`/api/groups/${id}/toggle`, {
    method: "PUT",
  });
}

export function toggleLight(id: string): Promise<{ on: boolean }> {
  return request<{ on: boolean }>(`/api/lights/${id}/toggle`, {
    method: "PUT",
  });
}

export function allLightsOff(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/api/lights/all-off", { method: "PUT" });
}
