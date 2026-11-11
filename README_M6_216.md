# GameTopia M6.216 frontend

- Loaded autosave = new game instance: original host sees Resume; other original saved members see Join, which safely reconnects their reserved account slot, color, side, and units. Requires M6.216 backend metadata from PR #3.
- Allied routes are read from server allyOrders and drawn in the owning player color. Pending route edits synchronize during Planning, not just on Ready. No enemy plots are disclosed.
- Carryover routes received from server are restored into local planner where necessary.
- #057 #058 #059 #062 #065 user-confirmed resolved. #060 #063 #064 remain open pending playtest; #076 restored Join vs Resume new issue.
- No claims that map shorelines or advance-after-combat behavior have passed a human playtest.
