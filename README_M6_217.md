# GameTopia frontend M6.217

- Advance after combat: 3 seconds, terrain-independent world-point animation, movement sound.
- Retreat and surrender: existing MP3 assets preserved, playback at actual replay notification, audio test buttons made visible.
- Daily Situation Report: count actual server surrender events, mark surrendered divisions lost, and exclude surrendered troop strength from remaining force.
- Terrain boundary overlays for forest, rough, swamp, mountains clipped entirely inside each terrain hex.
- Lake overlay: remove exterior water wedges; natural, curved interior shorelines with adjacent land texture.
- Backend unchanged from M6.216: server already emits `advance` and `surrender` events.

Status: syntax checked only; live user playtest required.
