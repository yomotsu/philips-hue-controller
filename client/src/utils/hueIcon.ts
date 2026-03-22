const ARCHETYPE_MAP: Record<string, string> = {
  sultan_bulb: "bulb-classic",
  classic_bulb: "bulb-classic",
  vintage_bulb: "bulb-classic",
  candle_bulb: "bulb-candle",
  vintage_candle_bulb: "bulb-candle",
  spot_bulb: "bulb-spot",
  single_spot: "single-spot",
  double_spot: "double-spot",
  pendant_round: "pendant-round",
  pendant_long: "pendant-long",
  ceiling_round: "ceiling-round",
  ceiling_square: "ceiling-square",
  floor_shade: "floor-shade",
  floor_lantern: "floor-lantern",
  table_shade: "table-shade",
  recessed_ceiling: "recessed-ceiling",
  recessed_floor: "recessed-floor",
  hue_go: "go",
  hue_lightstrip: "lightstrip",
  hue_play: "play-bar",
  plug: "plug",
  hue_bloom: "bloom",
};

export function getHueIconPath(archetype?: string): string {
  const name = (archetype && ARCHETYPE_MAP[archetype]) ?? "bulb-classic";
  return `/hass-hue-icons/${name}.svg`;
}
