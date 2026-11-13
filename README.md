# GameTopia — ARMAGEDDON: Bluenstein vs Redonia

**Current frontend build: M6.265** · **Backend API compatibility: M6.198** · Updated November 13, 2026

ARMAGEDDON is a turn-based, hex-map strategy game within GameTopia. Human players lead Bluenstein or Redonia in simultaneous daily planning and server-executed operations, with AI taking over only a side that has **no** human players.

**Playtest:** https://gametopia-playtest.onrender.com/  
**Backend:** https://gametopia-backend.onrender.com/api/health

## Start, join and play
1. Sign in with a registered account, start or join a game, choose an available personal player color and select a nation. The host starts the game from Initiation.
2. Each day has **10 time increments (TIs)**. Plot unit movement and city production during Planning. All enrolled human players must select **Ready** before the server executes the day. Disconnected enrolled players remain Not Ready until explicitly removed.
3. Watch the server-authored combat/movement replay, acknowledge required notices, then plan the next day. Refreshing or loading a turn-start autosave should open the current Planning turn without replaying the previous day.
4. In multiplayer, teammates may delegate divisions and cities during Planning. Personal player colors identify ownership separately from national colors.

## Game rules at a glance
- **Map:** 25 km hexes, one division per hex, terrain-dependent movement; fog of war limits enemy intelligence. An adjacent enemy is visible. Ownership of a city and actual militia strength are different kinds of intelligence.
- **Movement:** collect the full TI cost to enter a hex before moving or engaging; leftover credit is capped at the cost of the next intended hex. Orders can persist across days. Friendly blocking and ZOC restrictions apply.
- **Combat:** each division fires at most once daily, battles have up to three combat increments, and adjacent divisions can support. Attacker must first meet movement cost to initiate. Rivers, streams and bridges penalize attacks.
- **Defense:** primary defenders receive **20% natural casualty reduction**, with **up to 30% additional Improved Position (IP) reduction**. Stationary divisions gain one IP per stationary TI, capped at 30 IP. These modifiers multiply, giving at most 44% total reduction from these two factors.
- **Manpower:** actual losses cannot exceed the soldiers present. Soldiers and casualty counts are integers. Eliminated militia with zero strength cannot prevent an otherwise legal advance into their city hex; capture/pacification rules still apply.
- **Experience:** starting divisions **90**; newly produced reinforcement divisions **80**; incoming replacement soldiers **70**. Replacements blend into veteran formations by headcount. Surviving divisions gain one experience point per day and one for battle participation; server cap is 110. Opening city militia starts at 90; local newly recruited militia is rated 70.
- **Morale:** a failed check puts a division at risk of subsequent surrender. A persistent red counter warning is visible only to its own side, or to both sides in authorized playtesting. FAILING AI divisions withdraw when a safe route exists; retreat destinations preserve safety priorities and prefer movement toward a nearby friendly city on ties.
- **Cities:** eligible controlled cities provide Resource Points (RPs), support production and require pacification after capture. Production and maintenance are tracked in daily accounting. City militia are separate from regular divisions.
- **Victory:** capture and pacify the enemy capital.

## AI strategy (current)
- AI strategic orders are planned **once at the beginning of each game day**.
- At most **10%** of AI divisions are deliberately retained for rear/capital/city defense; the bulk advance toward nearer enemy cities and front lines, subject to blocking and supply.
- For voluntary assaults against visible defenders, the AI requires at least **two eligible adjacent friendly divisions**, including a supporter, and approximately **2:1 combined local power**; threatened-capital emergency attacks may use **1:1** but still require adjacent support.
- When these criteria are not met, troops stage near the enemy instead of entering an occupied enemy hex. FAILING morale units are excluded from attacking and supporting.

## UI, reports and saving
- Use the **PLAYERS** button in the top toolbar to restore/recenter the draggable Players / Ready panel.
- Battle banners show **Blue losses / Red losses in the largest type**, together with the winner graphic and battle participants.
- **Daily Situation Report:** two nations' available military totals, eliminated/retreated/surrendered divisions, RP carryover/income/maintenance/available balance, supply, production and firing records.
- **Both Sides** solo-playtest view displays both nations' eligible information; ordinary play hides sensitive opponent information. Enemy city militia may be shown as a *presence marker*, which is **not** a one-soldier strength estimate.
- Authoritative autosaves are written at the **start of each Planning turn**. Restored turns skip replay while retaining the previous completed day's report for review.

## Repository and deployment
- Source: `TerraNovaDevelopment/GameTopia-Frontend`; multiplayer backend: `TerraNovaDevelopment/GameTopia-Backend`.
- Render/GitHub deployment is distinct from a GitHub commit: check the public site's visible frontend build label and backend health endpoint before concluding a build is live.
- Historical version-specific `README_M6_*.md` files are **release history**, not the authoritative current guide. `README.txt` is the short player tutorial. This `README.md` is the maintained overview.
- Syntax and focused regression checks are run during individual updates; **full live two-computer/Render playtesting is still required** and is not implied by a successful commit.

## Recent changes (M6.255–M6.265)
| Build | Change |
| --- | --- |
| M6.255 | AI-supported attack requirements and staging instead of unsupported attacks |
| M6.256 | Restore/recenter Players panel, reconnect warning |
| M6.258 | 20% natural defense; 30% maximum IP defense |
| M6.259 | Push AI divisions toward enemy cities, 10% rear defense allocation |
| M6.260 | Friendly-only / Both-Sides FAILING morale counter warning |
| M6.261 | Direct restoration into saved Planning turn, no previous-turn replay |
| M6.262 | Retreat tie-break toward friendly city; both-side daily reports saved independently of replay |
| M6.263 | Integer militia losses, elimination and advance; distinguish unknown enemy militia strength |
| M6.264 | FAILING AI division withdrawal; enlarged battle casualty totals |
| **M6.265** | Starting 90 / reinforcement 80 / replacement 70 experience; current README refresh |
