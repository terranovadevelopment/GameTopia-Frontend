# GameTopia M6.201 — Login before ARMAGEDDON backstory

- Selecting ARMAGEDDON on `games.html` directs the user to `account.html?next=armageddon-backstory.html`.
- The backstory remains **hidden** until the backend confirms the saved token using `/api/accounts/me` and supplies the account's permanent `number` (player ID).
- Missing/expired tokens send the user to login. Backend downtime gives a retry/login choice and does not show the backstory or pretend the visitor has been authenticated.
- Existing registered accounts can continue after session verification; account login and registration remain available.
- Visible frontend version is M6.201. Backend compatibility remains M6.198.
- Autosave recovery and AI unit production were not modified.

## Deployment

1. Unzip and upload the **contents** of `GameTopia-Frontend-main` to the GitHub repository ROOT, not an enclosing ZIP or folder.
2. Commit the replaced files and confirm Render has completed deployment.
3. Visit `/release-check.html` on the exact website you're using: marker must be `GT-FRONTEND-M6-201-VERIFIED-LOGIN-BEFORE-BACKSTORY`.
4. Select ARMAGEDDON: the login or verified-account Continue screen must appear **before** any backstory image. With a valid account, proceed to backstory, then games.
