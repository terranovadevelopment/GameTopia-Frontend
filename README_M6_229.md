# GameTopia / ARMAGEDDON M6.229 — Update from M6.228

Small frontend patch. Extract All, copy files into the existing GameTopia-Frontend directory and replace files. Push from GitHub Desktop. M6.228 is required.

## Changed
- Nation handicaps add Blue and Red *City RP income rate (%)* at 100% default; separate from initial RP balance and replacements per city. 200% yields 2 RP per eligible city hex per game day, 50% yields 0.5. Server changes have been merged into the backend repository and MUST be deployed for multiplayer.
- Default division strength mix per nation: Small 8 infantry/2 armored/2 motorized/2 mechanized; Medium 12/3/3/3; Large 24/6/6/6; Huge 36/9/9/9. Existing explicit unit handicap percentages and per-type editing remain available.
- When Start New Game is selected from the Games listing while another enrolled game is active, the client calls the authoritative voluntary-leave endpoint first. This hands over divisions and cities to the senior remaining same-side player (Mike in the reported case) and resets readiness. If the previous game is not in Planning or the server rejects departure, new-game creation does not proceed. The in-game setup action also performs the departure.
- Removed redundant Load Saved Game setup button. Saved games remain available from the previous Games screen.
- Vertically centered Acknowledge captions in player membership notices, readiness, and daily report.
- City pacification naturally reverses one notch per day while friendly control is restored; backend regression now covers 3→2→1→0.
- Shorter, more local inland tributary paths are selected for streams. Existing seeded river directions retain north-south, east-west and both diagonals. New maps only.
- City density None still retains each capital. If there are too few city/adjacent hexes for unmobilized divisions, additional divisions use the closest legal friendly hexes, rather than failing scenario generation. Mobilized rear-city garrisons use the same overflow when indispensable.

## AI backend changes (merged, CI passed)
- Server-authoritative daily AI planning stages forces around visible defenders if the adjacent estimated strength is below the 1.5:1 threshold, instead of attacking prematurely.
- When attack conditions are met, one primary attacker enters the occupied defender hex and adjacent supporters hold position. Emergency capital defense remains exempt from the normal ratio requirement.
- AI units with significantly negative supply avoid voluntary offensive staging; no hidden enemy unit location is consulted.
- New regression tests run with npm test for AI economy, coordinated attacks, routing, and gradual pacification recovery, alongside the preexisting production tests.
- Existing strategic objectives, production, 20% reserve, capital garrison, and once-per-day planner remain in place.
- Advanced operational AI, full multi-day campaign simulation, and live-game balance verification are still incomplete. Do not consider Issues 027–056 closed merely because this patch passes CI.

Backend merged commit: 7853a08a42bac8b2559e17a7e389d044bcee966a
Backend PR: https://github.com/terranovadevelopment/GameTopia-Backend/pull/8

## Verification performed
- Frontend inline JavaScript syntax parsing passed.
- Fresh scenario generation checked across all four map sizes and multiple mobilization/city-density settings, with per-type troop totals and non-overlapping positions validated.
- Generated river directions and stream edges tested on multiple seeds.
- Backend GitHub Actions regression suite passed following the final code changes.

## Needs live playtest
- Verify Render backend is deployed before using RP handicaps; starting both front and back from matching code matters.
- Start a game while Mike is enrolled and confirm departure and full asset transfer, including Ready status, using the actual two computers.
- Confirm city RP income on Day 1 and subsequent turns with non-default handicaps.
- Review stream and river shapes visually on several new maps.
- Confirm the acknowledgement button's caption renders centered in your browser.
