import { Router, Request, Response } from "express";
import https from "https";
import { loadConfig } from "../config";

const router = Router();
const clients = new Set<Response>();

let bridgeReq: ReturnType<typeof https.request> | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectDelay = 1000;
let zombieCheckTimer: NodeJS.Timeout | null = null;

function broadcast(data: string) {
  for (const client of clients) {
    if (client.writableEnded || client.destroyed) {
      clients.delete(client);
      continue;
    }
    client.write(`data: ${data}\n\n`);
  }
}

function connectToBridge() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const config = loadConfig();
  if (!config) return;

  const req = https.request(
    {
      hostname: config.bridgeIp,
      path: "/eventstream/clip/v2",
      method: "GET",
      headers: {
        "hue-application-key": config.username,
        Accept: "text/event-stream",
      },
      rejectUnauthorized: false,
    },
    (res) => {
      reconnectDelay = 1000;
      let buffer = "";

      res.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (line.startsWith("data: ")) {
              broadcast(line.slice(6));
              break;
            }
          }
        }
      });

      res.on("end", scheduleReconnect);
    }
  );

  req.on("error", scheduleReconnect);
  req.end();
  bridgeReq = req;
}

function scheduleReconnect() {
  if (clients.size === 0) return;
  reconnectTimer = setTimeout(() => {
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    connectToBridge();
  }, reconnectDelay);
}

function disconnectFromBridge() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (bridgeReq) {
    bridgeReq.destroy();
    bridgeReq = null;
  }
}

function startZombieCheck() {
  if (zombieCheckTimer) return;
  zombieCheckTimer = setInterval(() => {
    for (const client of clients) {
      if (client.writableEnded || client.destroyed) {
        clients.delete(client);
      }
    }
    if (clients.size === 0) {
      clearInterval(zombieCheckTimer!);
      zombieCheckTimer = null;
      disconnectFromBridge();
    }
  }, 60 * 60 * 1000);
}

router.get("/", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.add(res);

  if (clients.size === 1) {
    connectToBridge();
    startZombieCheck();
  }

  _req.on("close", () => {
    clients.delete(res);
    if (clients.size === 0) {
      clearInterval(zombieCheckTimer!);
      zombieCheckTimer = null;
      disconnectFromBridge();
    }
  });
});

export default router;
