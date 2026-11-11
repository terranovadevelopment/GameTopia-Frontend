# GameTopia M6.218 Frontend
- Lake margins now vary gently and narrowly INSIDE lake hexes, no broad pale hex-side strips.
- Battle report opens about 240 CSS pixels (~2.5 inches) from firing location when screen space allows, retaining drag interaction.
- Blue/red outcome soldier is presented on neutral cream matte for clear contrast.
- Retreat report displays server-recorded combat casualties plus repeated ZOC retreat casualties.
- Automatic Daily Situation Report at start of every subsequent planning day, even if replay skipped or day had no combat; one automatic open per completed day.
- Backend M6.218 change required to provide `combatCasualties` and validate the ZOC loss total.
- Issues #060, #064, #071, #074, #075 remain open until playtest confirms.
