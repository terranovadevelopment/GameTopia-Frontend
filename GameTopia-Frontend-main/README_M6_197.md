# GameTopia M6.197 — Kick enforcement, microphone picker, 10% combat casualty base

Frontend: kicked users receive a blocking removal dialog on the next 2.5-second state poll and are returned to Games Underway; voice has default/explicit microphone choice, input meter and stream switching. Backend: enforces player membership on state and command requests; base casualty multiplier .10 (was .07).

Deploy backend and then frontend. Database schema unchanged. M6.197 must match both services.
