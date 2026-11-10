# GameTopia M6.206 — Non-AI Stabilization: Save Catalog Metadata

Frontend: M6.206. Required backend: M6.198 (unchanged).

## Fixes
- The catalog labels **Player (Host)** and **Created** explicitly.
- The host label is taken only from original host/creator metadata, never an arbitrary autosave player name.
- The game creation date comes from game creation metadata, not the newest autosave date.
- Nested backend save catalogs propagate original host/creation metadata when available.
- Version labels and script cache-busting updated to M6.206.
- Retains one row per permanent game ID; autosaves are selected in the popup with newest first.
- Keeps root-level ZIP packaging (no extra enclosing directory).

## Backend dependency
If a game record lacks original host identity or creation timestamp, the catalog displays **Host unavailable** or an em dash. Correct values require the backend to return original host account ID/display name and game creation time. The frontend cannot reconstruct them reliably from an autosave participant name.

## Validation status
Local static checks and JavaScript parsing only. Real account authorization, autosave restore, multiplayer sync, media, combat, production, and server crash recovery must be tested live with the matching backend. Do not mark these as passed.
