# GameTopia M6.190 — Unified Games Screen

- ARMAGEDDON game lobby now shows **one compact scrollable list**, with one row per eligible active game and autosave.
- The action is **Resume** when this account is already enrolled, **Join** for other active games, and **Load** for accessible autosaves.
- Dedupe active games using game IDs; maintain original authentication/reconnect and saved-game-load API flows.
- Registered account and saved-game queries are independent; guest users can still see joinable games.
- List refreshes approximately every ten seconds while visible.
- Screen has Start New Game above the list; former three sections and large game cards removed.
- Preserve M6.189 music setup, PostgreSQL, autosave retention, and gameplay rules.
- Both frontend and backend version checks report M6.190.

Deploy backend first, followed by frontend. This build has not been deployed to the live site.
