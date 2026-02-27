import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Set this in Render as an environment variable:
 *   ALLOWED_ORIGIN = https://<your-github-username>.github.io
 * Use "*" for quick testing, then lock it down.
 */
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

app.get("/health", (req, res) => {
  setCors(res);
  res.status(200).send("ok");
});

app.options("/metar", (req, res) => {
  setCors(res);
  res.status(204).send("");
});

app.get("/metar", async (req, res) => {
  try {
    // Accept "ids=KAUO" or "ids=KAUO,KMEM" etc.
    const idsRaw = (req.query.ids || "KAUO").toString().toUpperCase();

    // Basic sanitation: allow A-Z, 0-9, comma only
    const ids = idsRaw.replace(/[^A-Z0-9,]/g, "");

    const upstream = `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(ids)}&format=json`;

    const r = await fetch(upstream, {
      headers: { "User-Agent": "awos-proxy/1.0 (Render)" }
    });

    const body = await r.text();

    setCors(res);
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    res.status(r.status).send(body);
  } catch (err) {
    setCors(res);
    res.status(500).json({ error: "proxy_failed", detail: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`awos-proxy listening on ${PORT}`);
});
app.get("/", (req, res) => {
  setCors(res);
  res.status(200).send("awos-proxy ok. Use /health or /metar?ids=KAUO");
});
