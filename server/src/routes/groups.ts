import { Router, Request, Response } from "express";
import { loadConfig } from "../config";
import { loadPreferences, savePreferences } from "../preferences";

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
    const DEFAULT_NAME_ORDER = [
      "entrance", "hallway", "kitchen", "counter", "living room",
      "yellow room", "black room", "bedroom", "laundry room", "bathroom", "toilet",
    ];

    const { roomOrder } = loadPreferences();
    let ordered: typeof rooms;
    if (roomOrder && roomOrder.length > 0) {
      ordered = [
        ...roomOrder.map((id) => rooms.find((r) => r.id === id)).filter((r): r is NonNullable<typeof r> => r != null),
        ...rooms.filter((r) => !roomOrder.includes(r.id)),
      ];
    } else {
      ordered = [...rooms].sort((a, b) => {
        const ai = DEFAULT_NAME_ORDER.indexOf(a.name.toLowerCase());
        const bi = DEFAULT_NAME_ORDER.indexOf(b.name.toLowerCase());
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    }
    res.json(ordered);
  } catch {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

router.put("/order", (req: Request, res: Response) => {
  const { ids } = req.body as { ids?: string[] };
  if (!Array.isArray(ids)) {
    res.status(400).json({ error: "ids must be an array" });
    return;
  }
  savePreferences({ roomOrder: ids });
  res.json({ ok: true });
});

router.put("/goodnight", async (_req: Request, res: Response) => {
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
    const targets = Object.entries(data).filter(
      ([, g]) => g.type === "Room" && g.name.toUpperCase() !== "BEDROOM" && g.state.any_on
    );
    await Promise.all(
      targets.map(([id]) =>
        fetch(`http://${config.bridgeIp}/api/${config.username}/groups/${id}/action`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ on: false }),
          signal: AbortSignal.timeout(5000),
        })
      )
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to sleep" });
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
