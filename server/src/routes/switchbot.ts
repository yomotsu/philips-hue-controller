import { Router } from "express";
import * as crypto from "crypto";
import { loadPreferences, savePreferences } from "../preferences";

const router = Router();

const SWITCHBOT_BASE = "https://api.switch-bot.com/v1.1";
const PLUG_TYPES = new Set(["Plug Mini (JP)", "Plug", "Plug Mini (US)", "Bot"]);

function makeHeaders(token: string, secret: string) {
  const t = Date.now().toString();
  const nonce = crypto.randomUUID();
  const sign = crypto
    .createHmac("sha256", secret)
    .update(token + t + nonce)
    .digest("base64");
  return {
    Authorization: token,
    t,
    nonce,
    sign,
    "Content-Type": "application/json",
  };
}

async function sbFetch(token: string, secret: string, path: string, options?: RequestInit) {
  const res = await fetch(`${SWITCHBOT_BASE}${path}`, {
    ...options,
    headers: { ...makeHeaders(token, secret), ...(options?.headers as Record<string, string> ?? {}) },
  });
  const data = await res.json() as { statusCode: number; body: unknown; message?: string };
  if (data.statusCode !== 100) {
    throw new Error(data.message ?? `SwitchBot API error: ${data.statusCode}`);
  }
  return data.body;
}

router.get("/config", (_req, res) => {
  const prefs = loadPreferences();
  res.json({ configured: !!(prefs.switchbotToken && prefs.switchbotSecret) });
});

router.post("/config", (req, res) => {
  const { token, secret } = req.body as { token?: string; secret?: string };
  if (!token || !secret) {
    res.status(400).json({ error: "token and secret are required" });
    return;
  }
  savePreferences({ switchbotToken: token, switchbotSecret: secret });
  res.json({ ok: true });
});

router.get("/devices", async (_req, res) => {
  const prefs = loadPreferences();
  if (!prefs.switchbotToken || !prefs.switchbotSecret) {
    res.status(400).json({ error: "SwitchBot not configured" });
    return;
  }
  try {
    const body = await sbFetch(prefs.switchbotToken, prefs.switchbotSecret, "/devices") as {
      deviceList: Array<{ deviceId: string; deviceName: string; deviceType: string }>;
    };
    const plugs = body.deviceList.filter((d) => PLUG_TYPES.has(d.deviceType));

    const devices = await Promise.all(
      plugs.map(async (d) => {
        try {
          const status = await sbFetch(
            prefs.switchbotToken!,
            prefs.switchbotSecret!,
            `/devices/${d.deviceId}/status`
          ) as { power?: string };
          return { id: d.deviceId, name: d.deviceName, type: d.deviceType, on: status.power === "on" };
        } catch {
          return { id: d.deviceId, name: d.deviceName, type: d.deviceType, on: false };
        }
      })
    );

    res.json(devices);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch devices" });
  }
});

router.put("/:deviceId/toggle", async (req, res) => {
  const prefs = loadPreferences();
  if (!prefs.switchbotToken || !prefs.switchbotSecret) {
    res.status(400).json({ error: "SwitchBot not configured" });
    return;
  }
  const { deviceId } = req.params;
  try {
    const status = await sbFetch(
      prefs.switchbotToken,
      prefs.switchbotSecret,
      `/devices/${deviceId}/status`
    ) as { power?: string };
    const currentlyOn = status.power === "on";
    const command = currentlyOn ? "turnOff" : "turnOn";

    await sbFetch(prefs.switchbotToken, prefs.switchbotSecret, `/devices/${deviceId}/commands`, {
      method: "POST",
      body: JSON.stringify({ command, parameter: "default", commandType: "command" }),
    });

    res.json({ on: !currentlyOn });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to toggle device" });
  }
});

export default router;
