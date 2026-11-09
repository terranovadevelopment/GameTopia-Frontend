# GameTopia M6.194

- An active game with no connected players cannot be resumed or newly joined. Retained membership and units are unchanged, and a saved turn must be loaded to restart.
- The public games list and My Registered Games list omit wholly disconnected sessions; PostgreSQL autosaves remain visible and loadable.
- Connected sessions retain Resume, Join, and execution-phase joining rules.
- COMM moved from Players panel to top bar without changing channel behavior.
- Rivers and streams render with smoothed corners. Their underlying crossing edges and combat rules are unchanged.
- Frontend/backend version M6.194.
- Presence-based detection uses the existing authenticated 90-second heartbeat window, so disappearance after closing the final tab is not instantaneous.
