GameTopia M6.198 frontend maintenance update — November 10, 2026

- Game selection now routes through registered account login before entering the ARMAGEDDON game catalog.
- Accounts already signed in can continue with their saved identity.
- Game catalog retains active game join/resume rows.
- Server autosaves are grouped by original gameId: one catalog row per saved game.
- Clicking a saved-game row or its "View Saves" button opens a scrollable dialog listing each autosave turn and timestamp, with per-autosave Load buttons.
- How to Play is available on the opening splash, ARMAGEDDON selection card, and battle toolbar, sharing README.txt.
- No backend files were available to change AI city production. AI unit production remains an OPEN ISSUE requiring backend assessment; this update does not claim to fix it.
- No backend protocol/version change. Frontend still expects M6.198.

Files changed: games.html, account.html, armageddon-backstory.html, armageddon-lobby.html.
