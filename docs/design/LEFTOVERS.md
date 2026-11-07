# Premium design: the leftovers pass

This pass finished the items the first premium restyle (see `MODES.md`,
"Visual styling") left open. Screenshots are in `docs/screenshots/leftovers/`
at 1822x1132 and 1280x800.

## What changed

1. **4:5 feed posts.** `AspectRatio` now includes `"4:5"` (`ASPECTS`,
   `ASPECT_SIZE` and `ASPECT_NAME` in `src/lib/project.ts`). The shape works in
   the preview, every ratio picker (Quick shows 9:16, 1:1, 4:5, 16:9), export
   (`Aspect::Portrait`, 1080x1350, 720x900 draft), letterbox maths, the
   hand-off writers (FCPXML and xmeml sequences) and safe zones. Safe zones now
   depend on the shape: Reels UI on 9:16, the profile grid's 3:4 crop on 4:5,
   and a dashed 10% title-safe area on every shape (`safeZoneFor` in
   `src/templates/rules.ts`). Export has a "Feed post" preset in place of
   "Story". Older `.verso` files load unchanged; a shape this version doesn't
   know falls back to 9:16.
2. **Preview zoom.** Craft and Studio have a "Fit" menu in the preview toolbar:
   Fit, 50%, 100% and 200% of the output's real pixels. When zoomed, drag the
   stage to pan. The frame is scaled as a whole, so captions and overlays
   scale with it.
3. **Icons.** The 22 shell icons the spec lists are drawn from the mock's
   `<defs>` into `src/assets/icons/`. `boost`, `speaker`, `video` and `thirds`
   are new names in `IconName`. They are used for the Boost rail item, audible
   track toggles, the video track, clip and media icons, and the thirds toggle.
4. **Frame overlays.** A rule-of-thirds toggle sits in the preview toolbar
   (Craft and Studio). When a clip's reframe plan follows someone, the preview
   draws tracking brackets with an "Auto · Speaker N" tag. The brackets come
   from this session's face tracks (`rememberAnalysis` and `speakerAt` in
   `src/lib/reframe.ts`). After a restart the face tracks are gone, so the
   brackets sit in the centre of the crop, where the plan keeps the speaker.
5. **Project settings.** When nothing is selected, the inspector shows name,
   shape, frame rate (24/30/60), export size (720p/1080p/4K) and background
   colour (`ProjectSettings.tsx`). These are optional `Project` fields (`fps`,
   `quality`, `background`). Export starts from them. The background fills the
   preview frame and the base layer of the export.
6. **Look grades.** Original, Warm, Film, Clean and Night are real grades. Each
   one is a `GradeCurve`: a Rec. 709 saturation matrix, then per-channel
   contrast, lift, gamma and gain. The curve is stored on `Clip.color`. The
   preview and the inspector swatches apply it as an SVG filter built from the
   same numbers (`LookFilters.tsx`). Export applies `colorchannelmixer` + `lutrgb`
   (`curve_filters` in `export/color.rs`). In `looks-preview-vs-export.png`,
   each look shifts the colours by the same amount in preview and export,
   within 1 to 4 levels.
7. **Louder above 100%.** The preview routes a clip's media element through a
   Web Audio GainNode when its volume is above 1 (`src/lib/audioBoost.ts`).
   The elements load with `crossOrigin` so the asset protocol gives the graph
   real samples. Export applies the same gain. At 150%, both are 3.5 dB louder
   than 100%.
8. **Spec details.** Caption chips on the timeline are grouped into phrases of
   at least 80px, and a group too narrow for 4 characters has no label. Ruler
   labels under the playhead head or a snap flag are hidden. The inspector
   shows a 40px fade at the bottom while there is more to scroll. Every
   tooltip waits 500 ms; the last native `title` attributes were moved to the
   portal tooltip. The Media panel's header hairline runs through the
   scrollbar gutter.
9. **CSS.** The `--ui-*` token layer is defined once, at the top of
   `src/styles/app.css`, with the spec's values. app.css no longer has the
   65 rules and 372 declarations that premium.css (or a later rule with the
   same selector) always overrode. Screenshots of Welcome, Quick, Craft,
   Studio and Export at both sizes matched pixel for pixel before and after
   (the only difference was 2px of scrollbar thumb on Export).

## Known limits

- Frame rate drives export, the preview label and the timeline corner.
  Timecodes and frame stepping stay at 30 fps.
- Tracking brackets use real face boxes only for analyses run in this
  session (see item 4).
