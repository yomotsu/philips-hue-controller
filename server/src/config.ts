import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_DIR = process.env.CONFIG_DIR ?? join(__dirname, "../../");
const CONFIG_PATH = join(CONFIG_DIR, "bridge-config.json");

export interface BridgeConfig {
  bridgeIp: string;
  username: string;
}

export function loadConfig(): BridgeConfig | null {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as BridgeConfig;
  } catch {
    return null;
  }
}

export function saveConfig(bridgeIp: string, username: string): void {
  const config: BridgeConfig = { bridgeIp, username };
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}
