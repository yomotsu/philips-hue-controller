import type { Light } from "../../types";

interface Props {
  light: Light;
  onToggle: (id: string) => void;
  toggling: boolean;
}

export function LightCard({ light, onToggle, toggling }: Props) {
  return (
    <div
      className={`flex items-center gap-3.5 px-5 py-4 rounded-xl border transition-colors ${
        light.on
          ? "bg-[#1e1e3a] border-[#f0c040]"
          : "bg-[#16213e] border-[#2a2a4a]"
      } ${!light.reachable ? "opacity-50" : ""}`}
    >
      <div className="text-3xl w-9 text-center">{light.on ? "💡" : "○"}</div>
      <div className="flex-1 flex flex-col gap-1">
        <span className="text-base font-medium">{light.name}</span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded w-fit ${
            light.on ? "bg-[#f0c040] text-[#1a1a2e]" : "bg-[#333] text-gray-500"
          }`}
        >
          {light.reachable ? (light.on ? "ON" : "OFF") : "未接続"}
        </span>
      </div>
      <button
        onClick={() => onToggle(light.id)}
        disabled={toggling || !light.reachable}
        className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed ${
          light.on ? "bg-[#f0c040] text-[#1a1a2e]" : "bg-[#2a2a4a] text-[#e0e0e0]"
        }`}
      >
        {toggling ? "..." : "切替"}
      </button>
    </div>
  );
}
