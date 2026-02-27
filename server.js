import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Supports BOTH:
 *   ALLOWED_ORIGINS = "https://aubie-tracker.onrender.com,https://millsdo.github.io"
 *   ALLOWED_ORIGIN  = "https://aubie-tracker.onrender.com"
 *
 * If neither is set → allows all (for testing).
 */
const ALLOWED =
  (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.trim()) ||
  (process.env.ALLOWED_ORIGIN && process.env.ALLOWED_ORIGIN.trim()) ||
  "*";

function setCors(req, res) {
  const origin = req.headers.origin;

  if (ALLOWED === "*") {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin) {
    const allowedSet = new Set(
      ALLOWED.split(",").map(s => s.trim()).filter(Boolean)
    );

    if (allowedSet.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

app.get("/", (req, res) => {
  setCors(req, res);
  res.status(200).send("awos-proxy is running. Try /health or /metar?ids=KAUO");
});

app.get("/health", (req, res) => {
  setCors(req, res);
  res.status(200).send("ok");
});

app.options("/metar", (req, res) => {
  setCors(req, res);
  res.status(204).send("");
});

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
