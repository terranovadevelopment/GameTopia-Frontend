# GameTopia / ARMAGEDDON M6.198

- Music tracks retained; story and setup Options allows toggling music while on those screens (Options expanded initially).
- Widened floating Players panel by 48 CSS pixels and changed color-picker green to #00FF00.
- Removed obsolete lower-right owner-color dot from NATO and silhouette counters. Counter background already uses player color.
- Added top-bar **Leave Game**, confirmed by user, enforceable only in Planning. Server implements voluntary departure with ownership succession, AI takeover where applicable, zero-human termination, Ready reset and acknowledgement notices.
- Retreat notices center view at source unit, drag from title, pointer arrow, list ZOC extra casualties and animate recorded retreat for four seconds after acknowledgment.
- Division production notice centers on new unit, with a draggable panel and live arrow.
- Styled popup caption buttons for vertical alignment.
- Daily supply report now lists the specific units behind each out-of-supply/negative-supply count; values still derive from authoritative end-of-day supply calculation, not visual guesswork. **Reported Blue=1 requires confirming that identified unit and tracing its supply path before declaring the count should be zero.**
- Compatible frontend and backend version M6.198.

Live Render, microphone, and two-computer multiplayer verification remain necessary. Do not replace existing production storage without backup.
