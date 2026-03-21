import { Router, Request, Response } from "express";
import { loadConfig } from "../config";

const router = Router();

interface HueLightState {
  on: boolean;
  reachable: boolean;
}

interface HueLight {
  name: string;
  state: HueLightState;
}

function getConfig(res: Response): ReturnType<typeof loadConfig> {
  const config = loadConfig();
  if (!config) {
    res.status(401).json({ error: "Bridge not configured" });
    return null;
  }
  return config;
}

router.get("/", async (_req: Request, res: Response) => {
  const config = getConfig(res);
  if (!config) return;

  try {
    const response = await fetch(
      `http://${config.bridgeIp}/api/${config.username}/lights`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = (await response.json()) as Record<string, HueLight>;
    const lights = Object.entries(data).map(([id, light]) => ({
      id,
      name: light.name,
      on: light.state.on,
      reachable: light.state.reachable,
    }));
    res.json(lights);
  } catch {
    res.status(500).json({ error: "Failed to fetch lights" });
  }
});

router.put("/:id/toggle", async (req: Request, res: Response) => {
  const config = getConfig(res);
  if (!config) return;

  const { id } = req.params;
  const base = `http://${config.bridgeIp}/api/${config.username}/lights/${id}`;

  try {
    const stateRes = await fetch(base, { signal: AbortSignal.timeout(5000) });
    const lightData = (await stateRes.json()) as HueLight;
    const newOn = !lightData.state.on;

    await fetch(`${base}/state`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ on: newOn }),
      signal: AbortSignal.timeout(5000),
    });

    res.json({ on: newOn });
  } catch {
    res.status(500).json({ error: "Failed to toggle light" });
  }
});

export default router;
