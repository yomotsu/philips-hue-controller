import type { Light } from "../../types";
import { getHueIconPath } from "../../utils/hueIcon";

interface Props {
  light: Light;
  onToggle: (id: string) => void;
  toggling: boolean;
}

export function LightCard({ light, onToggle, toggling }: Props) {
  return (
    <div
      className={`grid grid-cols-[32px_1fr_auto] items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
        light.on
          ? "bg-[#1e1e3a] border-[#f0c040]"
          : "bg-[#16213e] border-[#2a2a4a]"
      } ${!light.reachable ? "opacity-50" : ""}`}
    >
      <div className="flex flex-col items-center gap-1">
        <img
          src={getHueIconPath(light.archetype)}
          alt={light.archetype ?? "light"}
          className={`w-8 h-8 ${light.on ? "icon-on" : "icon-off"}`}
        />
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
            light.on ? "bg-[#f0c040] text-[#1a1a2e]" : "bg-[#333] text-gray-500"
          }`}
        >
          {light.reachable ? (light.on ? "ON" : "OFF") : "未接続"}
        </span>
      </div>
      <span className="text-sm font-medium">{light.name}</span>
      <button
        onClick={() => onToggle(light.id)}
        disabled={toggling || !light.reachable}
        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
          light.on ? "bg-[#f0c040]" : "bg-[#444] ring-1 ring-[#666]"
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          light.on ? "translate-x-5" : "translate-x-0"
        }`} />
      </button>
    </div>
  );
}
