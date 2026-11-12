ARMAGEDDON / GameTopia M6.224 — INCREMENTAL FRONTEND UPDATE

Prerequisite: M6.223 frontend is installed in C:\Projects\Gametopia\GameTopia-Frontend

INSTALLATION:
1. Right-click this ZIP and select Extract All.
2. Copy armageddon.html, release-check.html, and src/ (preserve folder structure)
   into C:\Projects\Gametopia\GameTopia-Frontend.
3. Replace existing files, commit and push in GitHub Desktop.
4. Deploy and create a NEW game to see starting-position changes.

CHANGES:
- Correct counter-style caption and selector clipping on the Map Setup screen.
- Mobilized: randomly select 20% of divisions for rear-city urban hexes;
  place other 80% at exact 3–4 hex distance from enemy territory.
- Unmobilized: use friendly urban hexes first, overflow to adjacent friendly hexes.
- Per-side deterministic seeded shuffling maintains reproducible scenarios.
- No changes to ongoing or loaded games; new deployment applies to new games only.
- Version marker M6.224.

TESTS:
- JavaScript syntax: node --check src/game-data.js (passed)
- Deployment: small, medium, large, huge; Blue and Red; two seeds;
  both mobilized and unmobilized (passed).
- ZIP integrity verified.
Live browser setup rendering and multiplayer still need verification.
