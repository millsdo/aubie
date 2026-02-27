import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * CORS
 * Use Render env var ALLOWED_ORIGINS as a comma-separated list, e.g.:
 *   ALLOWED_ORIGINS=https://aubie-tracker.onrender.com,https://millsdo.github.io
 *
 * If you set ALLOWED_ORIGINS="*", it will allow all origins.
 */
const ALLOWED_ORIGINS_RAW = (process.env.ALLOWED_ORIGINS || "*").trim();

function setCors(req, res) {
  const origin = req.headers.origin;

  if (ALLOWED_ORIGINS_RAW === "*") {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin) {
    const allowed = new Set(
      ALLOWED_ORIGINS_RAW
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    );

    if (allowed.has(origin)) {
      // Must echo the origin (cannot use "*" when credentials or multiple origins are involved)
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Health check
app.get("/health", (req, res) => {
  setCors(req, res);
  res.status(200).send("ok");
});

// Root info
app.get("/", (req, res) => {
  setCors(req, res);
  res.status(200).send("awos-proxy is running. Try /health or /metar?ids=KAUO");
});

// Preflight
app.options("/metar", (req, res) => {
  setCors(req, res);
  res.status(204).send("");
});

// METAR proxy
app.get("/metar", async (req, res) => {
  try {
    const idsRaw = (req.query.ids || "KAUO").toString().toUpperCase();
    const ids = idsRaw.replace(/[^A-Z0-9,]/g, "");

    const upstream = `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(ids)}&format=json`;

    const r = await fetch(upstream, {
      headers: { "User-Agent": "awos-proxy/1.0 (Render)" }
    });

    const body = await r.text();

    setCors(req, res);
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    res.status(r.status).send(body);
  } catch (err) {
    setCors(req, res);
    res.status(500).json({ error: "proxy_failed", detail: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`awos-proxy listening on ${PORT}`);
});
