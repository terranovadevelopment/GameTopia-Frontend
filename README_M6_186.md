# GameTopia M6.187 — Eight-character registration hotfix (Frontend)

- Registration accepts passwords of 8–256 ASCII letters and digits, no special characters. Existing passwords unaffected.
- Frontend shows explicit eight-character guidance and validates before calling registration API.
- Backend checks eight-character passwords and persists only salted scrypt password hashes.
- Accounts stored in `GAMETOPIA_DATA_DIR/accounts.json`, or `server_data/accounts.json` by default. Protect and back up the data directory; a Render ephemeral disk is not durable.
- Deploy BOTH updated packages. M6.187 backend health must match M6.187 frontend version verification.
- After deploying inspect actual published `account.html` to verify `minlength="8"` and `M6.187`.
- Test: `npm test` for backend, including `test-m6186-registration.js`.
