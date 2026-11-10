# GameTopia M6.202 — Login-first frontend release

New release number **M6.202**, distinct from M6.201. All displayed frontend version strings and version-script cache tags are updated. The backend remains compatible with M6.198.

## Entry flow

1. Select **ARMAGEDDON** on `games.html` (button now says *Log In to View Games & Start New Game*).
2. `account.html?next=armageddon-backstory.html` handles registration, login, or verifies a saved registration.
3. `armageddon-backstory.html` remains hidden while it independently verifies `/api/accounts/me` returns a valid account and permanent player ID.
4. Once verified, the player sees the first backstory scene and can continue to Available Games.

How to Play remains available from selection and battle-screen pages. Autosave listing and AI production are not changed by this release.

## Deployment verification

Open `/release-check.html` on the same hostname as the GameTopia site. Look for `GT-FRONTEND-M6-202-LOGIN-BEFORE-BACKSTORY`. See `INSTALL.txt` for the safe GitHub Desktop Fetch/Pull/Commit/Push process.
