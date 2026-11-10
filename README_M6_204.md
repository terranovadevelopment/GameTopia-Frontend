# GameTopia M6.204 — One Game Per Row

Frontend release M6.204; compatible backend remains M6.198.

- Available Games shows one row per permanent game ID, not per autosave.
- Active and saved records for the same game ID are combined. Resume remains available for a live enrolled game.
- Saved-only games show View Saves. A live game with saves has an additional View Saves control in its Description column.
- The autosave popup scrolls, shows most recent timestamp first, and contains Load buttons. No autosave Load button appears in the main catalog.
- Columns are Game, Player, Date, Turn, Status, Action, Description.
- Never conflate different permanent game IDs just because names match. Saves without a game ID are reported instead of silently grouped by title.
- Login before ARMAGEDDON backstory and the existing How to Play controls are retained.

The frontend cannot fix incorrect server-side game IDs or recover backups not returned by the backend.

Deploy to the **GameTopia-Playtest** Render service, https://gametopia-playtest.onrender.com, which is connected to TerraNovaDevelopment/GameTopia-Frontend.
