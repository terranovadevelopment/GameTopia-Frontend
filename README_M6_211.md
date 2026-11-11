# GameTopia M6.211 — Pacification and Production Visibility

Frontend: **M6.211**. Compatible server health identifier: **M6.198**.

- City overlay uses a distinctive GOLD DASHED HEX RING around any city at pacification level 1–5, with a BLUE or RED banner showing the owner's nation and pacification level.
- Paused production stays visible in the city report when pacification is nonzero, including remaining turns.
- City owners can CANCEL production during pacification, receiving the full paid RP cost back through the existing backend endpoint.
- The frontend does not offer any new production actions while pacification remains above zero.
- Local-game production and maintenance pause during pacification and resume at zero.

Backend changes are **staged separately** in the GameTopia-Backend draft pull request. Until those changes are merged and deployed, the backend's existing pacification and maintenance behavior may remain unchanged. The city overlay requires the server's updated city pacification values to be reconciled into the frontend.

Use this ZIP's root-level files directly in your GameTopia-Frontend repository. Do not create a nested GameTopia-Frontend-main folder.
