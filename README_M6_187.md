# GameTopia / ARMAGEDDON M6.187 — Save / Load UI

- Games Underway now displays **Load a Saved Game — PostgreSQL Autosaves**.
- Log in with a permanent registered account. Select **Find My Autosaves**.
- A saved turn is displayed only if your account's permanent ID was enrolled
  in the original game at the time of that save.
- Load starts a separate active game with the original roster and ownership;
  all players begin Not Ready, with no movement plots or member acknowledgments.
- Other players log in with their existing GameTopia registered accounts and
  reconnect to their original positions. No disconnected player is kicked automatically.
- This frontend must be deployed together with matching M6.187 backend.
- This is a development build; live Render PostgreSQL integration is not yet verified.
