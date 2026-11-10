# GameTopia M6.199 — Frontend release

- Registered login is mandatory immediately after selecting ARMAGEDDON in the GameTopia games list, before any backstory screens. Registered users with valid saved sessions can choose Continue as Registered Player.
- After successful login, ARMAGEDDON backstory leads to the game catalog. Direct access to backstory without a stored account token redirects to login. Backend remains authoritative for validating account tokens.
- Catalog continues to show games and their grouped autosaves; a scrollable popup lets the user select an individual autosave.
- An unavailable autosave API now shows an explicit error instead of falsely reporting an empty catalog; a successful zero-result response is described accurately.
- Two How to Play / README buttons remain in the game selection and in-game toolbar.
- Frontend version advanced to M6.199. Backend compatibility expectation remains M6.198 until a coordinated backend update is provided.

## Important backend limitation

Previous autosaves cannot be restored or made to appear by a frontend ZIP alone. The account-specific POST /api/saved-games/catalog backend endpoint must return retained saves. Review server logs, persistence/database, prior deployments, and account ownership if it returns zero entries. DO NOT overwrite/reset backend storage in an attempt to find old saves.

## Install

Upload the contents of GameTopia-Frontend-main into your frontend GitHub repository and commit; let deployment complete, then hard-refresh with Ctrl+Shift+R. Uploading this ZIP alone into GitHub as a file does not deploy its contents.
