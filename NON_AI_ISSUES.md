# GameTopia / ARMAGEDDON — Numbered non-AI issue register

Stable IDs: refer to an issue by its number (e.g., **Issue #005**). Never renumber existing IDs when closing issues; append new ones. This is a tracked worklist, not proof of completed live tests.

| Issue | Area | Work / acceptance criterion | Status |
|---|---|---|---|
| **#001** | Deployment and packaging | Confirm live M6.207 assets, root-flat ZIP and consistent version label | User-confirmed resolved |
| **#002** | Login before backstory | Require registered login and backend-verified permanent player ID before story or catalog | User-confirmed resolved |
| **#003** | Account registration | Verify unique IDs, email verification, persistent sessions and password reset | User-confirmed resolved |
| **#004** | Saved-game catalog | One row per game ID; original host shown; original creation date preserved | User-confirmed resolved |
| **#005** | Autosave selection and loading | Scrollable per-game saves ordered newest first; validate player authorization and exact restoration | User-confirmed resolved |
| **#006** | Crash recovery and checkpoints | Verified TI checkpoints, complete RNG and state, backup, idempotent restore | User-confirmed resolved |
| **#007** | Disconnected player membership | Preserve enrolled player, units, cities, orders and colors indefinitely while disconnected | User-confirmed resolved |
| **#008** | Player reconnection | Reclaim original enrolled position with same registered account | User-confirmed resolved |
| **#009** | Ready gating | Every enrolled human Ready; disconnected enrolled player blocks until explicitly kicked | User-confirmed resolved |
| **#010** | Kick and asset transfer | Authorized same-side senior player kicks; transfer units/cities; reset Ready | User-confirmed resolved |
| **#011** | Delegation and ownership colors | Verify division/city selection, recipient colors and delegation mode | User-confirmed resolved |
| **#012** | Players panel and battle popup | Always-visible Ready panel, casualties, winner and pacification acknowledgment | User-confirmed resolved |
| **#013** | Voice communications | Push-to-talk buffered on release, common/team/private channels and notices | User-confirmed resolved |
| **#014** | Game sound effects | Combat and movement sounds, timing and playback | User-confirmed resolved |
| **#015** | Combat rules | One fire/division/day; 3 increments; morale, retreats and ZOC compliance | User-confirmed resolved |
| **#016** | Movement and fog of war | Prevent swaps; movement initiation cost; order persistence; adjacency visibility | User-confirmed resolved |
| **#017** | Human economy and production | Day 1 and daily RP income before planning, maintenance, reinforcements | User-confirmed resolved |
| **#018** | Supply and pacification | Daily supply evaluation, penalties, overlays, city pacification | User-confirmed resolved |
| **#019** | Multiplayer execution and replay | Authoritative synchronized day and consistent client replays | User-confirmed resolved |
| **#020** | Account administration and invitations | Invite restrictions, moderation, reports, appeal and notices | User-confirmed resolved |
| **#021** | How to Play website | Keep clickable placeholder buttons on opening and battle screens; future page will offer Return to Game | Placeholder implemented; webpage pending |
| **#022** | Optional game description | Remove unused description from new game form | Removed in M6.207; confirmation pending |

AI and strategic-AI evaluation are intentionally excluded.

## Release M6.207 changes

- #022: Removed the optional Description field from Start New Game; removed unused saved description draft and outgoing request property.
- #001: Retains flat-root ZIP packaging, no extra enclosing folder.
- #001-#021: Remain open until verified by the specified tests; frontend edits alone do not close backend or multiplayer issues.
| **#023** | Battle winner soldier graphic | Realistic blue/red/white soldier, 0.75 inches tall, based on winning side/draw | Implemented M6.208; live verification pending |

## M6.208 changes
- #021: How to Play buttons are present but intentionally do nothing; future dedicated page and Return to Game navigation are not yet implemented.
- #023: Three realistic, color-coded soldier PNGs are shown in battle summary: blue for Bluenstein, red for Redonia, white for draw. Height 72 CSS pixels (about 0.75 inch at the CSS 96 DPI reference).
- #022: Existing removal is preserved.
- #001–#020: User-confirmed resolved; no gameplay/engine changes included.
- Backend requirement remains M6.198.


## M6.216 issue register addendum
- #057, #058, #059, #061, #062 and #065 — user-confirmed resolved.
- #072 — user-confirmed resolved, pending confirmation of speech recognition interpretation.
- #060, #063, #064, #074, #075 — open; code present for #060/#063 but not user-verified.
- #076 — restored-save lobby button: show Join to original saved allies other than loader; restore the same original player slot, side, player color and units. Live verification pending.
