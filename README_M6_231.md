# ARMAGEDDON / GameTopia M6.231 — Nation Report and Uncapped Replacements

Incremental frontend patch from M6.230. Replace matching files in your GameTopia-Frontend folder; commit/push using GitHub Desktop. Backend fix has been separately merged on TerraNovaDevelopment/GameTopia-Backend (PR #9), and live backend deployment must complete before playing new games with uncapped replacement rates.

## Changes
- Daily Situation Report: Bluenstein fixed as left column, Redonia as right column. Each nation displays casualties and strength when permitted, plus the public counts of divisions retreated and surrendered.
- The Replacements per city hex/day setup values no longer have a 100-soldier maximum. Whole-number nonnegative entries such as 130, 200, 250, 1500 are accepted; real deliveries are limited by the recipient division's unmet losses and 10,000-soldier maximum strength.
- The scenario generator passes the selected replacement rate into the authoritative snapshot. The backend no longer clamps either the rate or dispatch to 100. The standard default remains 100 per eligible city hex per day.
- GameTopia frontend version marker M6.231. Preserves M6.230 ready panel restoration.

## Testing
- JavaScript syntax checks passed for changed scripts.
- Frontend structural/parameter tests passed for multiple replacement rates.
- GitHub Actions backend suite passed, including the new test-m6231-unlimited-replacements.js.
- Live two-player and actual game report visual verification remain outstanding.

## Installation
1. Ensure frontend M6.230 is installed.
2. Extract All from the small M6.231 ZIP.
3. Copy extracted files/folders into C:\\Projects\\Gametopia\\GameTopia-Frontend, replacing matching files.
4. Commit and push through GitHub Desktop, and verify Render deployment.

Note: starting-rate changes apply to new games. In-progress games keep the handicap values captured when created.
