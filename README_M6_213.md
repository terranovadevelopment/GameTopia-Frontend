# GameTopia Frontend M6.213 — New division deployment visibility

Backend API compatibility: M6.198 (unchanged). Base: M6.212.

## Fixed
- The multiplayer new-day roster synchronization now adds newly produced divisions returned by the authoritative `/positions` endpoint, instead of only updating preexisting divisions.
- The production notification requests the matching server-authored division and inserts it on the map before showing the arrival report; unsuccessful synchronization is explicitly reported and retried at the end of replay.
- Reconnecting and loading games use the same complete roster reconciliation, so produced divisions can become visible without waiting an extra day.

## Verify in game
1. Start city infantry production and progress until it completes.
2. At production notification, confirm the new division is visible at the reported city or fallback deployment hex.
3. Acknowledge notification and start Planning; select the new division and plot movement immediately.
4. Repeat with occupied city hex and fallback deployment.
5. Verify that a city with pacification above zero cannot complete production (requires staged backend PR #1 to be merged).

The existing backend creates units at the end-of-day boundary and includes them in the next-day server state; this frontend update reconciles those new units. No backend API modification is required for this specific visibility bug.
