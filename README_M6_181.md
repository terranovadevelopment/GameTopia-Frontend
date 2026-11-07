# GameTopia M6.181 — TerraNova deployment correction

## Purpose
This coordinated frontend + backend release updates the live API base URL to `https://gametopia-backend.onrender.com`, removes obsolete test-backend references in all shipped frontend source, and allows the TerraNovaDevelopment GitHub Pages origin in the Node backend CORS defaults.

## Deployment
1. Back up saved-game/account state and any existing server configuration.
2. Publish `GameTopia-Backend` to the TerraNovaDevelopment backend repository and deploy to the existing Render service.
3. Publish `GameTopia-Frontend` to the TerraNovaDevelopment frontend repository and deploy GitHub Pages from `main` root.
4. Verify `https://gametopia-backend.onrender.com/api/health` reports `M6.181`.
5. Open `https://terranovadevelopment.github.io/GameTopia-Frontend/`, hard refresh, and test registration, Start/Join, lobby, and audio.

The two packages must be deployed together: the website version gate expects backend M6.181.
The server keeps honoring additional origins in `GAMETOPIA_CORS_ORIGINS`.

## Changes
- Replace hardcoded old Render server references throughout website JavaScript and HTML, including account, lobby, game start, heartbeat, event streams, and verification.
- Approve `https://terranovadevelopment.github.io` by default for backend CORS requests and preflights.
- Make version and cache-busting tokens consistent with M6.181.
- Remove an obsolete website-preview banner and stale localhost-only lobby guidance.
- Retain existing game rules, public URL, and account/game persistence behavior.
- Keep README_M6_180.md and README_M6_181.md only.

## Quality controls
Check `RELEASE_MANIFEST.json` for hashes of distributed files. Live deployment and audio playback require browser testing and are not validated by local automated tests.
