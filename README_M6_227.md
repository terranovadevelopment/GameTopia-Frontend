# GameTopia M6.227 — Logical Roads and Saved-Game Host Metadata

This is an **incremental frontend update**. Install only after GameTopia M6.226.

## Installation (Windows)
1. Right-click the ZIP and select **Extract All**.
2. Copy the extracted files and the `src` folder directly into:
   `C:\Projects\Gametopia\GameTopia-Frontend`
3. Select **Replace the files in the destination**.
4. Commit and push your GameTopia-Frontend GitHub repository using GitHub Desktop.
5. Wait until your Render frontend deployment completes; refresh the game lobby.

## Changes
- Generate a connected local road network among cities, beginning with a short-road backbone and adding worthwhile secondary connections instead of long crossing roads.
- Prefer existing road corridors, avoid lakes, and route around costly terrain such as mountains and swamps when a sensible alternative exists.
- Preserve exact adjacent-hex road connections used by movement and bridges.
- Repair original host name lookup in live game and saved game catalog (no longer incorrectly reports Host unavailable when creator is present).
- Render unknown metadata as Unknown (legacy save), without inventing a host name.

## Backend dependency
The corresponding original-game metadata correction is in the GameTopia-Backend repository PR #7, returning original host name and game creation timestamp from durable autosaves. Without this backend change, old saved games may still lack their original host metadata.

**Road changes apply to newly generated maps only.** Existing saved games preserve their original roads.

## Verification
JavaScript syntax and a local roads connectivity/no-lake regression test have passed. Live deployment and full browser playtest are still required.
