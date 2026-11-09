# GameTopia / ARMAGEDDON M6.189 — Setup Layout and Music Options

- M6.188 PostgreSQL and renewable 14-day autosave behavior is preserved.
- Common, Bluenstein, and Redonia backstory: music On/Off is accessible from Options.
- Game Setup: Music On/Off moved into Options; standalone controls hidden.
- Game Setup panel is viewport constrained and internally scrollable with sticky controls on smaller displays; no offscreen controls.
- Sound and voice controls in gameplay remain separate.
- Browsers may require an explicit player click before music can play.
- Backend is behaviorally unchanged from M6.188 except for matching M6.189 version labeling.
- Release is local, not deployed. Verify with two browsers and with Render PostgreSQL before production use.

## Cache correction for frontend
All six HTML entry points use `src/verify-backend-m6189.js?v=189fix1` to avoid old cached verifier scripts. The verifier requires matching backend M6.189. Deploy the COMPLETE folder contents at repository root, including `src/`, `assets/`, `music/`, and `sounds/`. Old pages will continue to show 188 until GitHub Pages publishes the new HTML.
