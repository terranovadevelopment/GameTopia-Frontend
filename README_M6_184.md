# GameTopia / ARMAGEDDON M6.184

## Changes
- Password registration minimum is eight alphanumeric characters (no special characters); existing accounts remain unchanged.
- Retains server-persisted, individually acknowledged join/Kick notices and Not Ready resets.
- Member notice popup now uses a blocking overlay with an explicit acknowledgment button.
- Voice playback now exposes a native audio player with manual replay, file-size status, and microphone device identification. If permission is granted only after a short press, the interface asks the player to hold again.
- Music enables afresh when the game loads and provides more accurate browser playback errors; the speaker-tone test helps distinguish device output from missing MP3s.
- This release cannot guarantee speaker output or microphone transmission without actual browser/computer testing.

## Deployment
Backend must be deployed before the matching frontend. Preserve persistent account/game data and the repository .git folders. Do not upload ZIP archives directly as site files.
