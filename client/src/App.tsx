import { useState, useEffect } from "react";
import { getBridgeStatus } from "./api";
import { Setup } from "./components/Setup/Setup";
import { Dashboard } from "./components/Dashboard/Dashboard";
import "./App.css";

type View = "loading" | "setup" | "dashboard";

export function App() {
  const [view, setView] = useState<View>("loading");

  useEffect(() => {
    getBridgeStatus()
      .then((status) => setView(status.configured ? "dashboard" : "setup"))
      .catch(() => setView("setup"));
  }, []);

  if (view === "loading")
    return (
      <div className="flex items-center justify-center h-screen text-xl text-gray-500">
        読み込み中...
      </div>
    );
  if (view === "setup") return <Setup onComplete={() => setView("dashboard")} />;
  return <Dashboard />;
}
