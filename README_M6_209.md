# GameTopia M6.209 — Frontend Corrections

Base: M6.208 complete frontend, flattened root archive.

- Preserve local route overlays across multiplayer replay and trim only traversed waypoints; show the remaining time to the next hex.
- Display allied routes when they are available in the planner (server must expose teammate plans).
- Show completed new-division production counters with the production message at TI 10.
- Synchronize the server-authoritative supply and replacement ratings after each turn.
- Hide opposing side troop, casualty, supply and RP summaries in the Daily Situation Report, unless Both Sides playtest is active.
- Blend lake shoreline appearance with adjacent terrain (rendering only).
- Keep original game controls: left click selects a unit; Shift+left click opens an occupied city; right click remains the plot/pause gesture.

**Requires backend work:** Server does not yet carry remaining movement routes across day boundaries. It retains positive movement TIs only if re-submitted to the same next hex. Team orders are not yet published for a teammate-visible overlay. Supply diagnosis, meeting-engagement advance, and legacy reinforcement timing require server integration tests.

Backend compatibility requirement remains M6.198. Do not deploy this frontend as proof that backend rule changes have been made.
