# Code Map

This repo now has one released product surface and one archived prototype surface.

## Released surface

- `index.html`: public Competitive Analysis UI. Only the Competitive nav item is visible; the old module sections are hidden from the release surface.
- `script.js`: app state, competitive analysis generation, source ledger, CSV/JSON export, local save/import, and the hidden backlog module logic kept for compatibility.
- `styles.css`: shared layout and component styles.
- `api/competitive-research.js`: no-key server-side search route. It fetches public search snippets, filters ambiguous product names, returns source rows, and avoids exposing credentials.
- `server.js`: local static server plus `/api/competitive-research` route for localhost testing.
- `vercel.json`: Vercel static/app routing config.

## Archived surface

- `backup/full-os-prototype/`: snapshot of the full multi-module prototype before the release UI was narrowed to Competitive Analysis.
- `backup/full-os-prototype/index.html`: full six-module UI.
- `backup/full-os-prototype/script.js`: full workflow logic for competitive, brief, questions, personas, synthesis, and reporting.
- `backup/full-os-prototype/api/competitive-research.js`: competitive research route copied with the archive.
- `backup/full-os-prototype/server.js`: local runner copied with the archive.

## Operational notes

- Live competitive research needs the Node/Vercel server route. Opening the HTML file directly skips that route and falls back to local evidence.
- The source route intentionally returns public snippets and source URLs, not confirmed findings. The UI tells reviewers to inspect source links before treating rows as validated.
- The hidden backlog modules still exist in root `index.html` and `script.js` for compatibility, but they are not part of Release 1.
