import express from "express";
import cors from "cors";
import { join } from "path";
import bridgeRouter from "./routes/bridge";
import lightsRouter from "./routes/lights";
import groupsRouter from "./routes/groups";

const app = express();
const PORT = 8765;
const isProd = process.env.NODE_ENV === "production";

if (!isProd) {
  app.use(cors({ origin: "http://localhost:8766" }));
}
app.use(express.json());

app.use("/api/bridge", bridgeRouter);
app.use("/api/lights", lightsRouter);
app.use("/api/groups", groupsRouter);

if (isProd) {
  const clientDist = process.env.CLIENT_DIST ?? join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(join(clientDist, "index.html"));
  });
}

const server = app.listen(PORT, () => {
  console.log(`Hue server running on http://localhost:${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Please close other instances.`);
    process.exit(1);
  } else {
    throw err;
  }
});
