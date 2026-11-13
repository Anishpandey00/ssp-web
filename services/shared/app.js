// Express setup shared by every Smart Study Planner service.
import express from "express";
import { jwtSecret } from "./auth.js";

export function createService() {
  const app = express();

  // Express 4 does not catch errors thrown by async handlers; without this a
  // failed query becomes an unhandled rejection that stops the whole process.
  // Route them to the error handler instead.
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const register = app[method].bind(app);
    app[method] = (path, ...handlers) =>
      register(path, ...handlers.map((fn) => (req, res, next) =>
        Promise.resolve(fn(req, res, next)).catch(next)));
  }

  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, bypass-tunnel-reminder");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PATCH,PUT,OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  return app;
}

// Adds /health, the 404 and error handlers, runs `init`, then listens.
// The process exits if start-up fails, so Docker or Azure restarts it.
export function startService(app, { name, port, init, health }) {
  app.get("/health", async (req, res) => {
    try {
      if (health) await health();
      res.json({ ok: true, service: name });
    } catch {
      res.status(503).json({ ok: false, service: name });
    }
  });

  app.use((req, res) => res.status(404).json({ ok: false, error: "Not found." }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ ok: false, error: "Request body is not valid JSON." });
    }
    console.error(`[${name}]`, err);
    return res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
  });

  Promise.resolve()
    .then(() => jwtSecret())
    .then(() => init?.())
    .then(() => {
      app.listen(port, "0.0.0.0", () => console.log(`${name} listening on port ${port}`));
    })
    .catch((err) => {
      console.error(`${name} failed to start:`, err.message || err);
      process.exit(1);
    });
}
