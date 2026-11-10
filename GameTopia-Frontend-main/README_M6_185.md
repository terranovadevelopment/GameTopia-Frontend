# GameTopia M6.185 — Game discovery, backstory music, version visibility

- Backend GET `/api/games` now lists games in Lobby, Planning, or Execution when they have enrolled players, regardless of stale heartbeats or browser disconnections. Membership and Ready rules are unchanged.
- Backstory music has an explicit **Play Music** action and visible playback/error status on all three backstory pages. Clicking the story artwork is another user gesture that can initiate playback. Browser autoplay restrictions remain respected.
- Correct version badge on pregame screens (upper-left); it hides when Day 1 Planning begins. Removes the old inline gameplay version text.
- Password minimum remains **8 alphanumeric characters**, with no special characters allowed for new passwords. Existing credentials retain their existing authentication rules.
- Source scripts use versioned cache keys for M6.185, matched to the backend release.
- All earlier Join/Kick acknowledgment requirements, permanent login, and ownership rules remain unchanged.

Release requires deploying the matching backend and frontend. Back up saved account/game data before replacement. Browser-based audio and multiplayer join testing remain necessary after deployment.
