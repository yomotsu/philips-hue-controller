import { useBridgeSetup } from "../../hooks/useBridgeSetup";
import { DiscoverStep } from "./DiscoverStep";
import { LinkStep } from "./LinkStep";

interface Props {
  onComplete: () => void;
}

export function Setup({ onComplete }: Props) {
  const {
    step,
    bridgeIp,
    status,
    error,
    linkButtonRequired,
    handleDiscover,
    handleCreateUser,
    handleManualSave,
    handleDirectSave,
  } = useBridgeSetup(onComplete);

  return (
    <div className="max-w-md mx-auto mt-16 px-5">
      <h1 className="text-2xl font-bold mb-6 text-[#f0c040]">Philips Hue セットアップ</h1>
      <div className="flex items-center gap-2 mb-8 text-sm">
        <span className={step === "discover" ? "text-[#f0c040] font-bold" : "text-green-500"}>
          1. Bridge検出
        </span>
        <span className="text-gray-600">→</span>
        <span className={step === "link" ? "text-[#f0c040] font-bold" : "text-gray-600"}>
          2. 認証
        </span>
      </div>
      {step === "discover" && (
        <DiscoverStep
          onDiscover={handleDiscover}
          onDirectSave={handleDirectSave}
          loading={status === "loading"}
          error={error}
        />
      )}
      {step === "link" && (
        <LinkStep
          bridgeIp={bridgeIp}
          onActivate={handleCreateUser}
          onManualSave={handleManualSave}
          loading={status === "loading"}
          error={error}
          linkButtonRequired={linkButtonRequired}
        />
      )}
    </div>
  );
}
