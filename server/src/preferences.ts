import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_DIR = process.env.CONFIG_DIR ?? join(__dirname, "../../");
const PREFS_PATH = join(CONFIG_DIR, "preferences.json");

interface Preferences {
  roomOrder?: string[];
  switchbotToken?: string;
  switchbotSecret?: string;
}

export function loadPreferences(): Preferences {
  if (!existsSync(PREFS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(PREFS_PATH, "utf-8")) as Preferences;
  } catch {
    return {};
  }
}

export function savePreferences(updates: Partial<Preferences>): void {
  const current = loadPreferences();
  writeFileSync(PREFS_PATH, JSON.stringify({ ...current, ...updates }, null, 2), "utf-8");
}
