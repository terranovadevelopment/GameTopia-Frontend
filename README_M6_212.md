# GameTopia M6.212 — Replay interaction, retreat tracking and audio checks

Frontend-only update based on M6.211. Backend API compatibility remains M6.198.

- During battle replay, prevent the map canvas from capturing a mouse drag when a battle report is open; ensure the firing detail X has a clickable hit target.
- Animate retreat and movement using stable world-space coordinates, leaving the current map pan/zoom to the renderer.
- Retain recorded retreat.mp3 and surrender.mp3; warn in browser console if playback fails or is blocked.
- No music enabled by default; battle sounds remain separate.

QA checklist: begin map drag before/after opening battle report; click firing report X; drag map during retreat animation at two zoom levels; verify endpoint; listen to retreat and surrender events with Sound ON and browser unmuted.
These changes passed static syntax/ZIP checks, not live browser testing.
