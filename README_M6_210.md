# GameTopia M6.210 — Mouse and Music Controls

Frontend: **M6.210**. Required backend: **M6.198** (unchanged).

## Changed
- **Right-click** with a selected division: plot or extend its movement route. It never inserts a pause waypoint.
- **Shift + right-click** with a selected division: add a 1-TI pause at the division’s current hex or an already plotted route hex. If clicked elsewhere, do not alter the route.
- Battlefield help and status guidance now agree with the input behavior.
- **Music defaults to OFF**. Bundled music files remain in the frontend; users can turn music on using the provided music control. Sound effects and push-to-talk are unchanged.

## Scope
- Frontend only. Does not change combat, movement time accounting, server execution or autosaves.
- Tested with JavaScript syntax checks and archive integrity verification; live browser gameplay testing still required.
