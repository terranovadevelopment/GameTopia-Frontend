# GameTopia M6.214 coordinated frontend package

Built from the complete M6.213 frontend. Backend PR #1 contains server changes and must be tested and merged for full rules enforcement.

Changes:
- Real irregular lake/land shorelines with actual surrounding terrain textures, while hex outlines stay visible.
- Redonia/Bluenstein colored soldier portraits for retreat, retreat blocked, and surrender reports.
- Recover unfinished own routes from server `myOrders` when the new day starts and on reconnect.
- Submit only routes for divisions actually owned by this player, not allied divisions.
- Existing firing-window mouse, retreat animation, sound and reinforcement sync fixes retained from M6.212–213.

Deploy matching backend movement/supply/pacification/production changes from backend PR #1 separately. Backend health API remains M6.198 for compatibility until both deployments coordinated.
