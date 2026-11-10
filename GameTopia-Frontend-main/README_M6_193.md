# GameTopia M6.193

- Game Setup is bounded by browser viewport with internal scrolling and accessible controls.
- Background music is stopped and cannot restart during gameplay, but remains available on pregame story/setup screens.
- Registered account cannot Join the same game twice: Join returns HTTP 409 ALREADY_ENROLLED; Resume reclaims original position.
- Previous gameplay, persistent PostgreSQL account/autosave rules, and Sound Effects controls retained.
- Requires frontend and backend M6.193.
- Back up the database before deployment and verify on live Render/GitHub Pages.
