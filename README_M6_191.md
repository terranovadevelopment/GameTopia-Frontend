# GameTopia M6.191 — Registered Accounts and Game List

Based on M6.190. All earlier core game, PostgreSQL account and autosave logic retained.

- No new guest registration or guest game entries: server enforces accounts on create/join. Legacy guest memberships stay stored and are not automatically removed.
- Games list combines Join, Resume and Load with actual backend phase, turn, creation date and host.
- Sound Effects V and Music U moved to gameplay Options. Supply keeps S. Existing unit symbol and water diagnostic options remain accessible without U/V shortcut.
- Music/Sound toggles are independent of voice communications.
- Browser caches: dedicated M6.191 version verifier.

Deployment: back up production DB, update backend first, confirm /api/health M6.191 and registered-only mode; then update frontend. Test two registered accounts and all game phases on separate computers.
