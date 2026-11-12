# GameTopia M6.219 — Terrain, Roads, City Sight, U, Advance popup

- Increase lake shore transition moderately, keeping coast inside its hex.
- Increase forest/rough/swamp/mountain feather 22% to 34% of hex radius, clipped inside terrain hex.
- Add 50% more unique city-to-city road links (not necessarily exactly 50% more road *hexes*). Generated on new map rendering; existing backend save geometry may remain fixed.
- Friendly unpacified cities perform standard line-of-sight spotting.
- U toggles unit symbols; no music U shortcut.
- Selected friendly/allied route renders white; other allied routes retain player ownership color.
- Advances have an acknowledgment popup before three-second animation; existing movement SFX remains placeholder until a new licensed advance recording is selected.
- Production cancellation now reconciles the server-confirmed queue and RP refund, and reports failure if the job remains. Live/backend verification is still required. Per-TI allied route erasure remains to be verified.
- Music remains OFF by default.
