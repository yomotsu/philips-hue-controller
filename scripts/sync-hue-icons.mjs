import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const ICONS = [
  "bulb-candle", "bulb-classic", "bulb-filament", "bulb-spot",
  "single-spot", "double-spot",
  "pendant-round", "pendant-long",
  "ceiling-round", "ceiling-square",
  "floor-shade", "floor-lantern",
  "table-shade",
  "recessed-ceiling", "recessed-floor",
  "go", "lightstrip", "play-bar",
  "plug", "bloom",
];

const BASE = "https://raw.githubusercontent.com/arallsopp/hass-hue-icons/main/docs/svgs";
const OUT = "client/public/hass-hue-icons";

mkdirSync(OUT, { recursive: true });

for (const name of ICONS) {
  const res = await fetch(`${BASE}/${name}.svg`);
  if (!res.ok) { console.warn(`skip: ${name}`); continue; }
  writeFileSync(join(OUT, `${name}.svg`), await res.text());
  console.log(`✓ ${name}.svg`);
}
