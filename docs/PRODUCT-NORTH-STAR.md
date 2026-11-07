# Product north star

> "my goal is, this app should be used by naïve to professional people to save time in editing reels in premier pro, this should quick fix and time saver for everyone"
>
> — the owner

## Design rules

1. **Three workspaces, one project.**
   - Quick: big choices and one-tap edits.
   - Craft: every tool, with every setting showing.
   - Studio: Premiere-style, with resizable panels, track headers, keyframes
     and all shortcuts.

   Switching changes only the layout. Nothing in the project is lost. See
   `docs/design/MODES.md`.

2. **One tap everywhere.** Each common fix is one tap and one undo step:
   captions, removing pauses, cutting to the beat, fitting to 9:16, cleaning
   the voice, a hook title, an end card, punch-ins, looks and loudness. Panels
   have one-tap presets. "Do it all" makes the usual fixes for the kind of
   video it sees. Every edit lives in one registry (`src/lib/oneTap.ts`).
3. **Show the time saved.** Every one-tap edit counts the editing time it
   replaces, with conservative estimates. The total shows quietly in the title
   bar and in Settings.
4. **Plain copy.** No render, encode, codec, bitrate, LUT, VAD, reframe,
   transcribe, proxy, sidecar, inference or model on the surface. Say "Export",
   "Fit to 9:16", "Captions", "colour file", "AI pack". Studio may keep pro
   terms like Keyframes.
5. **Premium chrome.** The title bar, timeline and preview keep
   Premiere-grade density. Simplicity comes from fewer choices and plainer
   copy, not from big, childish controls.
6. **Each panel: one primary action, 3-4 big choices, one "More settings"
   row.** Empty states explain the one next thing, with one button. Every
   icon-only control has a tooltip that shows its shortcut.
7. **On-device first.** Captions, pause detection, beats, punch-ins, looks and
   voice clean-up run on this computer wherever possible. Credits are only for
   AI work, and AI actions show their price before they run.
