AWOS / METAR (HTML front-end + Render proxy)

What this solves
- Browser JS (GitHub Pages) is blocked by CORS when calling many aviation METAR feeds directly.
- This Render service proxies AviationWeather.gov METAR JSON and adds CORS headers, so your HTML can fetch it.

Files
- server.js         Express proxy (Render)
- package.json      Node deps
- render.yaml       Optional "infrastructure-as-code" for Render
- frontend_snippet.html  Copy/paste snippet for your GitHub Pages index.html

Step-by-step (DO THESE IN ORDER)

1) Put these files in a repo
- Create a new GitHub repo (or add to your existing one).
- Commit:
  - package.json
  - server.js
  - render.yaml (optional)
  - frontend_snippet.html (reference)

2) Deploy the proxy on Render
- Render dashboard -> New -> Web Service
- Connect to your GitHub repo
- Build Command: npm install
- Start Command: npm start
- Environment variables:
    ALLOWED_ORIGIN = https://<your-github-username>.github.io
  Use "*" temporarily for testing, then lock it down.

3) Confirm the proxy works
- Open:
    https://YOUR-SERVICE.onrender.com/health
  Expect: ok
- Open:
    https://YOUR-SERVICE.onrender.com/metar?ids=KAUO
  Expect: JSON array with METAR object(s)

4) Update your GitHub Pages index.html
- Copy the contents of frontend_snippet.html into your index.html (or merge it).
- Set:
    const RENDER_BASE = "https://YOUR-SERVICE.onrender.com";
    const STATION = "KAUO";

5) Map element IDs
Your HTML must have these IDs (or change the snippet to match yours):
- wind, temp, dewpoint, altimeter, visibility, flightCat
Optional row wrappers to hide when missing:
- rowAltimeter, rowVisibility

Notes
- If the METAR genuinely lacks visibility/altimeter, the snippet hides those rows.
- Flight category: uses metar.fltcat if provided; otherwise computes from visibility/ceiling.
