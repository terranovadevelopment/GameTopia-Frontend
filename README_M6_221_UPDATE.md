# GameTopia M6.221 frontend incremental update

Requires M6.220 already installed. Use Extract All; then copy the extracted
files (including src) into C:\Projects\Gametopia\GameTopia-Frontend.
Replace matching files; do not introduce another nested folder.
Commit and push via GitHub Desktop.

Fixes: Visible Mouse & Keyboard Controls; surrender shown/removed before
retreat and advance; multiplayer Replay Turn uses server events rather than
restarting a local saved game; Ready locks plotting; synthetic execution
trumpet; restored right-click selected-unit 1-TI pause; suppress false zero
morale display; preliminary WebRTC live push-to-talk (not recorded).
Capital victory splash is triggered by the authoritative backend victory.

Matching backend commit:
https://github.com/terranovadevelopment/GameTopia-Backend/commit/73ebeaf8723b70048ebaa4ed278afa97c88db2ce

Important: live voice needs browser permission/HTTPS and peer connectivity;
STUN-only WebRTC is not guaranteed through restrictive NAT (TURN may be needed).
All multiplayer features still require real two-computer playtesting.
