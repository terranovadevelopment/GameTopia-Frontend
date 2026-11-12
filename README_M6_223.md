# GameTopia M6.223 — New Game Day Splash

This is an incremental frontend patch requiring M6.222.

- The Bluenstein/Redonia battle photograph covers the game screen at the start of each new day.
- The correct game day number is overlaid.
- Each player clicks anywhere (or presses Enter/Space) to dismiss the splash and begin their own Planning view.
- No unit-order interactions can pass through the splash.
- An original synthesized bugle fanfare plays once per player on splash display when already unlocked; otherwise the first click unlocks sound and plays it. Sound OFF remains respected.
- Multiplayer replay finishes before the next day's splash. The Daily Situation Report appears after the player dismisses the splash.
- The splash appears on the first day and on reconnect to an unacknowledged day. No backend update is necessary.

Install: Extract All, copy the files into C:\Projects\Gametopia\GameTopia-Frontend, replace files, then commit and push in GitHub Desktop.
