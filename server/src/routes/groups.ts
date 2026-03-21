import { Router, Request, Response } from "express";
import { loadConfig } from "../config";

const router = Router();

interface HueGroup {
  name: string;
  type: string;
  lights: string[];
  state: { all_on: boolean; any_on: boolean };
}

router.get("/", async (_req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.status(401).json({ error: "Bridge not configured" });
    return;
  }
  try {
    const response = await fetch(
      `http://${config.bridgeIp}/api/${config.username}/groups`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = (await response.json()) as Record<string, HueGroup>;
    const rooms = Object.entries(data)
      .filter(([, g]) => g.type === "Room")
      .map(([id, g]) => ({
        id,
        name: g.name,
        lightIds: g.lights,
        anyOn: g.state.any_on,
      }));
    res.json(rooms);
  } catch {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

router.put("/:id/toggle", async (req: Request, res: Response) => {
  const config = loadConfig();
  if (!config) {
    res.status(401).json({ error: "Bridge not configured" });
    return;
  }
  const { id } = req.params;
  const base = `http://${config.bridgeIp}/api/${config.username}/groups/${id}`;
  try {
    const stateRes = await fetch(base, { signal: AbortSignal.timeout(5000) });
    const group = (await stateRes.json()) as HueGroup;
    const newOn = !group.state.any_on;
    await fetch(`${base}/action`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ on: newOn }),
      signal: AbortSignal.timeout(5000),
    });
    res.json({ on: newOn });
  } catch {
    res.status(500).json({ error: "Failed to toggle room" });
  }
});

export default router;
