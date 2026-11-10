# GameTopia / ARMAGEDDON M6.197 — Players/COMM/KICK initialization hotfix

Corrects a fatal frontend initialization failure introduced when M6.195 moved the COMM control out of the Players panel into the top bar. The code still looked up COMM inside the panel, yielding null, then threw when assigning `comm.onclick`; this prevented the roster polling, voice, and Kick controls from initializing. The hotfix uses `document.getElementById('gtCommToggle')` to retrieve the relocated element. No game rules, player membership, database schema or saved games are changed.

Deploy BACKEND first (version checker M6.197), then FRONTEND. Confirm health check and refresh the website with Ctrl+Shift+R. Test player roster, COMM window and senior-player KICK. Terrain image 404s remain a separate known issue.
