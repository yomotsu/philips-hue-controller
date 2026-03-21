import { Router, Request, Response } from "express";
import { loadConfig, saveConfig } from "../config";

const router = Router();

router.get("/status", (_req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.json({ configured: false });
    return;
  }
  res.json({ configured: true, bridgeIp: config.bridgeIp });
});

router.post("/discover", async (req: Request, res: Response) => {
  const { bridgeIp } = req.body as { bridgeIp: string };
  if (!bridgeIp) {
    res.status(400).json({ error: "bridgeIp is required" });
    return;
  }
  try {
    const response = await fetch(`http://${bridgeIp}/api/config`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Bridge not responding");
    const data = (await response.json()) as { name?: string };
    if (!data.name) throw new Error("Not a Hue Bridge");
    res.json({ ok: true, name: data.name });
  } catch {
    res.status(400).json({ error: "Could not reach Hue Bridge at that IP" });
  }
});

router.post("/create-user", async (req: Request, res: Response) => {
  const { bridgeIp } = req.body as { bridgeIp: string };
  if (!bridgeIp) {
    res.status(400).json({ error: "bridgeIp is required" });
    return;
  }
  try {
    const response = await fetch(`http://${bridgeIp}/api`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ devicetype: "hue-controller#myapp" }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await response.json()) as Array<{
      success?: { username: string };
      error?: { type: number; description: string };
    }>;
    const result = data[0];
    if (result.error) {
      if (result.error.type === 101) {
        res.status(202).json({ linkButtonRequired: true });
        return;
      }
      res.status(400).json({ error: result.error.description });
      return;
    }
    if (result.success) {
      saveConfig(bridgeIp, result.success.username);
      res.json({ ok: true, username: result.success.username });
      return;
    }
    res.status(500).json({ error: "Unexpected response from Bridge" });
  } catch {
    res.status(400).json({ error: "Could not reach Hue Bridge at that IP" });
  }
});

router.post("/set-config", (req: Request, res: Response) => {
  const { bridgeIp, username } = req.body as { bridgeIp: string; username: string };
  if (!bridgeIp || !username) {
    res.status(400).json({ error: "bridgeIp and username are required" });
    return;
  }
  saveConfig(bridgeIp, username);
  res.json({ ok: true });
});

export default router;
