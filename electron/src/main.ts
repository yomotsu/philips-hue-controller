import { app, BrowserWindow, dialog, screen } from "electron";
import { join } from "path";

function startServer(): void {
  const serverEntry = join(process.resourcesPath, "server", "dist", "index.js");
  process.env.NODE_ENV = "production";
  process.env.CONFIG_DIR = app.getPath("userData");
  process.env.CLIENT_DIST = join(process.resourcesPath, "client", "dist");

  process.on("exit", (code) => {
    if (code === 1) {
      dialog.showErrorBox(
        "起動エラー",
        "ポート 8765 が使用中です。\n他のインスタンスを終了してから再起動してください。"
      );
    }
  });

  require(serverEntry);
}

function createWindow(): void {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const width = 250;
  const height = 800;
  const win = new BrowserWindow({
    width,
    height,
    x: sw - width,
    y: Math.round((sh - height) / 2),
    transparent: true,
    vibrancy: "under-window",
    visualEffectState: "active",
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    title: "Philips Hue Controller",
  });
  win.loadURL(app.isPackaged ? "http://localhost:8765" : "http://localhost:8766");
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    startServer();
    setTimeout(createWindow, 1500);
  } else {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
