# GameTopia M6.232 — Starting Force Handicap Fix

Incremental frontend patch on top of M6.231.

The previously displayed default exact unit counts were being serialized into the setup query even after a starting-force handicap was changed. Those stale exact counts took precedence over the starting-force percentage, leaving both sides with 21 divisions. M6.232 recalculates all non-manually edited type counts when the side handicap or map size changes and immediately before Start New Game serializes the query. Individual type counts edited by the player remain intentionally overriding values.

For a Medium map at Blue 100% and Red 130%, expect Blue Infantry 12, Motorized 3, Mechanized 3, Armored 3 (21 total), Red Infantry 16, Motorized 4, Mechanized 4, Armored 4 (28 total).

Newly created games only. Existing games retain original divisions.

Install: Extract All, copy matching files to C:\Projects\Gametopia\GameTopia-Frontend, replace, commit and push via GitHub Desktop. No backend modification required.

Tests: JavaScript syntax checks, source logic checks, expected counts across four map sizes, ZIP CRC verification. Live two-player browser verification remains pending.
