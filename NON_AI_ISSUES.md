# ARMAGEDDON / GameTopia — Outstanding non-AI work

This is an issue and verification register, not a claim that all items are fixed. M6.206 intentionally does not alter backend game rules or persistence.

| Area | Remaining verification or implementation | Status |
|---|---|---|
| Deployment | Confirm M6.206 on GameTopia-Playtest, assets load, no nested ZIP | Packaging checked; live pending |
| Login | Enforce registered login and backend-verified permanent player ID before backstory and game catalog | Live regression pending |
| Registration | Email verification, persistent logins, reset, unique account IDs | Backend tests needed |
| Saved games | Group by immutable game ID; original host; creation date; one row per game | Frontend improved; backend metadata/live tests pending |
| Autosaves | Per-game scrollable newest-first list; authorization and restore exact turn | Live tests needed |
| Recovery | Verified TI checkpoints, RNG state, restoration, backup, no duplicate actions | Backend/source review and crash tests needed |
| Membership | Player persists across disconnection; reconnect into original slot; no unrequested removal | Multiplayer tests needed |
| Ready | All enrolled humans Ready; offline enrolled players block execution until kicked | Multiplayer tests needed |
| Kick | Senior same-side player can kick, transferring units/cities; all Not Ready | Multiplayer tests needed |
| Delegation | Units/cities multi-select and ownership color, correct interaction modes | UI/live tests needed |
| UI | Player/Ready floating panel, battle popup and winner, pacification acknowledgement | UI/live tests needed |
| Voice | PTT buffering/release playback, private/team communications, recipient notices | Two-device tests needed |
| Audio | Combat and movement sound playback, effects timing | Browser sound tests needed |
| Combat | One fire per division/day, morale timing clarified, 3 increments, retreats and ZOC | Rule regression tests needed |
| Movement | No swap, entry cost before initiation, order persistence, hex visibility | Rule regression tests needed |
| Economy | Day-1-and-daily city income before planning, maintenance, reinforcement placement | Engine tests needed |
| Supply | Daily evaluation, penalties and overlays; city pacification | Engine tests needed |
| Multiplayer | Server authoritative daily execution, consistent client replay | Cross-client regression tests needed |
| Accounts/admin | Invitation rules, suspension, player reports, appeals and notices | Product/backend tests needed |

AI issues and strategic-AI review are deliberately excluded. Do not claim non-AI closure until a regression suite passes against the deployed frontend and backend.
