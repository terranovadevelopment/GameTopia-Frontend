# GameTopia M6.200 — Frontend login entry and deployment verification

## Behavioral changes

- After selecting ARMAGEDDON on `games.html`, players enter the registered login page (`account.html?next=armageddon-backstory.html`) before reaching the ARMAGEDDON backstory.
- The backstory and game catalog also redirect visitors without a stored account token to login. Backend remains authoritative for verifying credentials; the login page validates saved sessions against `/api/accounts/me`.
- How to Play remains available on the GameTopia splash, game-selection page, and main battle toolbar.
- Autosaves are grouped in the game catalog with individual saves in a scrollable picker, but **backend autosave recovery is not part of this frontend release**.
- Visible frontend build label is advanced to `M6.200`, with a new `/release-check.html` deployment marker.
- Backend version requirement remains `M6.198`. Do NOT change the backend verification file to match the frontend display label.

## Deploy without nesting files

1. Unzip this package on your computer.
2. Open the folder named `GameTopia-Frontend-main` INSIDE the extracted package.
3. Upload its contents, not the ZIP itself and not an extra `GameTopia-Frontend-main` folder, into the ROOT of the GitHub repository `TerraNovaDevelopment/GameTopia-Frontend` on its deployment branch. The repository root must contain `index.html`, `games.html`, `account.html`, `armageddon-backstory.html`, `armageddon-lobby.html`, `armageddon.html`, `release-check.html`, `how-to-play.js`, `README.txt`, and folders `src` and `assets`.
4. Replace existing files (especially `src/version.js` and HTML files), then commit all changes.
5. Wait for the hosting provider to deploy this commit. If GitHub Pages and Render are both used, determine which URL you are viewing and confirm THAT service uses the repository/branch you updated.
6. Visit `https://YOUR-FRONTEND-ADDRESS/release-check.html` and verify the marker `GT-FRONTEND-M6-200-LOGIN-FIRST` is displayed.
7. On the same domain, open `games.html`, select ARMAGEDDON, and confirm it opens the login page before the backstory. Refresh with Ctrl+Shift+R if necessary.

## Troubleshooting

- If the release-check URL is 404, M6.200 was not deployed to this site (or static host routes are misconfigured).
- If release-check shows M6.200 but main pages show M6.198, the HTML files, version.js, or static cache are out of sync. Inspect and redeploy the matching files from this ZIP.
- If version changes but login flow does not, inspect `games.html` on the same domain for the hyperlink `account.html?next=armageddon-backstory.html`.
- Do NOT overwrite or reset backend storage in response to missing autosaves. Backend recovery must be investigated separately.
