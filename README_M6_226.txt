GameTopia / ARMAGEDDON — M6.226 incremental update

Prerequisite: M6.225 already installed.

Extract All and copy all extracted files (and their folders) into:
C:\Projects\Gametopia\GameTopia-Frontend
Replace the matching files, then commit and push with GitHub Desktop.

Terrain density factor for clusters: None 0, Low 0.5, Medium 1, High 2.
The same scaling is now applied to NONCAPITAL city counts per side.
Every nation retains one capital, regardless of the city density setting.
For a medium map the baseline is ~17 noncapital settlements per side;
Low ~9, Medium ~17, High ~34 (plus one capital per side).
The total may be lower if there is insufficient legal land to keep city hexes
separated. Locations remain deterministic for a seed.

Rivers and streams use the same density factors (Medium 2/19, High 4/38
on a standard medium-size map, respectively).
Only NEWLY GENERATED games are affected; saves retain their original maps.
Frontend only. No backend change is needed.
