# Verso UI/UX review: from "nice prototype" to "premium pro tool"

Senior product-design review · November 2026 · read-only audit of `src/styles/*`, `src/components/**`, `src/screens/**`, brand kit v1.0 (`Verso-Brand-and-UI-Guidelines.html`, `06-UI-Mockups/editor-mockup.png`) and `docs/screenshots/*.png`.

Target: Premiere Pro / After Effects / Lightroom-level polish, without losing the brand's promise: *"Designed for people who don't edit."* Every proposal below keeps that bar. Pro power goes behind progressive disclosure: hover, a shortcut, or an "Advanced" switch. The default surface stays plain-language.

---

## 0. Executive summary

Verso already has the hard parts right: one well-chosen palette, Manrope bundled locally, tokens wired through every rule, plain-language copy ("Reading your file…", "Your reel is ready"), real filmstrips and waveforms, frame-accurate snapping, and an undoable history. The Welcome screen is close to premium already.

The gap to "pro" is **density, precision affordances and consistency**, not colour:

1. **Too big and too soft for a dense tool.** 14px body, 36px controls, 20px panel padding, 10–20px radii and 18px panel titles make the editor read like a marketing page. Compare `frameless-editor.png` with Premiere: we show about 40% less information per square inch.
2. **The timeline is a viewer, not an editor.** It has no track headers (lock/mute/eye), no height control, no Ctrl+wheel zoom, no zoom-to-fit, no draggable playhead, no snap indicator, no I/O, no multi-select. Empty Text/Captions rows take as much height as Video (`minmax(40px, 1fr)` in `Timeline.tsx`).
3. **The preview has no tools.** There is no frame stepping, timecode entry, zoom, full screen or safe-zone toggle. The 5-second skip buttons reuse the **undo/redo icons** (`Preview.tsx`), so they look like a second undo.
4. **Inconsistent primitives.** There are 4 modal shells (`.export`, `.about`, `.acct-dialog`, `.settings`), 3 progress bars (`.export__bar`, `.smart-progress__bar`, `.progress-bar`) in 3 colours, CSS-pseudo tooltips that clip inside scroll containers, `×` text glyphs for close buttons, and duplicate rule blocks in `app.css` (`.editor` at L605 and L3189, `.clip` at L1520 and L2039).
5. **Frameless-window regressions.** `Settings.tsx` renders a full-window `role="dialog"` with **no `WindowControls` and no drag region**, so you cannot move, minimise or close the window while Settings is open. Window buttons are 36×30 (`.winctl__btn`) and do not reach the top-right corner, which breaks the Windows Fitts'-law convention.
6. **Brand-rule leaks.** Codecs are on the surface ("H264 · AAC" in the Media list breaks *"No codecs, bitrates or keyframes on the surface"*). Ember leaks into the Pro badge, the focus ring (Glow) and an Effects-purple progress bar (`.smart-progress__bar > span`).

Fix the P0 list (section 4) and the perceived quality jumps the most for the least code. Most P0 items are CSS plus one small component each.

---

## 1. Verdict per screen and panel

Grades: **A** premium · **B** good, needs polish · **C** below premium · **D** blocks the premium feel.

### 1.1 Welcome (`screens/Welcome.tsx`, `.welcome*`, `.action-card*`, `.recent-card*`): **B+**
What works: the hero type (64/800, tight tracking), the Ember payoff on "Reels out.", the 3 action cards and the friendly copy. This matches the brand kit.

Below premium:
- **Recent project thumbnails are flat colour swatches** (`.recent-card__thumb`), not real first frames. Premium apps (Lightroom, Premiere Home) show real media. Use the filmstrip's first frame (`useFilmstrip` already exists) or a cached poster saved on autosave.
- **Recent cards have no hover or context affordance.** Add hover raise (`--ui-raised`), plus "Open", "Show in folder", "Duplicate" and "Remove from list" in a `ContextMenu`, which is already built.
- **The "Most popular" tag** on the first card competes with the hero. Drop it, or make it 11/600 caps on neutral-700. The card position already signals priority.
- **The action cards are not equal width** (`grid-template-columns: 1.25fr 1fr 1fr`). That is fine for emphasis, but then the icon tiles should differ too: give the primary card a 48px brand-gradient icon tile and keep the others neutral.
- **Missing drop-zone.** Dragging a video file anywhere on Welcome should light the whole window ("Drop to make reels") and start Auto-cut. It is the single most "magic" desktop affordance.

### 1.2 Top bar / title bar (`editor/TopBar.tsx`, `.topbar*`, `WindowControls.tsx`, `.winctl*`): **C**
- **Overcrowded right cluster.** It holds 9 items: undo, redo, help, credits, account, Save, Export, separator, 3 window buttons (`frameless-editor.png`). Premiere keeps the right side to workspace and share.
- **The aspect ratio switch sits in the centre of the title bar** (`Segmented` in `.topbar__center`). It is a canvas property. The brand mockup puts it in the Reframe properties as chips ("9:16 Reel · 1:1 · 4:5 · 16:9"). Move it to the preview toolbar (section 3.3) and free the centre for the project name and save state.
- **The Save button is redundant** with autosave (`autosaveProject` exists). Replace it with a quiet status: "Saved" / "Saving…" / "Not saved, retry" (12/500 muted, with a check icon). Keep Ctrl+S.
- **The `help` icon opens About** (`onAbout`), which is a mislabel. Make it a Help menu: Keyboard shortcuts, Take the tour, What's new, About Verso.
- **The `4:5` ratio from the mockup is missing** from `RATIOS`. That is a product gap worth noting.
- **Window controls**: `.winctl__btn` is 36×30 and vertically centred in a 52px bar. Windows 11 convention is **46×(bar height)**, flush to the top-right corner. Close hover should be `#C42B1C` with a white glyph, not a neutral tone. The bar keeps `data-tauri-drag-region` on gaps (good).
- **The wordmark repeats on every screen** (`.topbar__wordmark` 20px). In the editor use the 20px mark only and give the space to the project name. That is how Adobe apps do it (app icon only).

### 1.3 Tool rail (`LeftPanel.tsx` `TABS`, `.rail`, `.rail__item`): **C+**
- **9 items × about 78px each overflow at 768px window height.** In `frameless-editor.png` **"Voice" is cut off** and only a thin scrollbar hints at it (`.rail { overflow-y: auto }`). Fix: item height 56px (icon 20, label 11/600, gap 4). 9 × 56 + 8 gaps × 4 = 536px, which fits.
- **No grouping.** Split into *Make* (Media, Templates, Text, Captions, Audio, Voice) and *Smart* (Auto-cut, Magic, Boost) with a 1px × 32px separator, so people see which tools spend credits.
- **The active state is a box with a 1px inset border** (`.rail__item.is-active`), which reads as a "card". Use raised fill `#1D1D24` + Paper icon + a 2px × 20px Paper indicator bar on the rail's left edge. See section 2.12 for the Ember conflict in the guideline ("Selected tool: Ember icon").
- **Icon size 20px in the rail.** The brand spec says 24 in the rail. With the 56px item, use **20px icon + label** (labels carry meaning) and update the guideline. 24px icons plus labels is what makes the current rail too tall.
- **Rail items cannot collapse the panel.** Clicking the active item should collapse or expand the left panel (Premiere/Figma pattern). See section 3.1.

### 1.4 Left-panel tabs (`.panel`, `.panel__body`, `.panel__head`, `.panel__title`, `.panel__lede`)
Shared verdict: **C+**. The panel head is 18px/700 title + 14px lede + 20px padding, so about 110px of chrome before content. In a pro tool the panel header is a **36px bar** with a 13/600 title and an overflow menu. Move the lede into the empty state or under a "?" tooltip after first use. Panel padding goes 20 → 16. Section gap goes 16 → 12.

| Tab | File | Grade | Specific issues |
|---|---|---|---|
| Media | `LeftPanel.tsx` (`.media-item*`) | C | Meta wraps badly ("30 / fps" splits lines in the screenshot). **"H264 · AAC" breaks the brand's no-codecs rule.** Show `HD · 30 fps · 364 MB` on one line, with the codec only in a tooltip. The `+` add button is a 20px icon with no visible target: make the whole row draggable onto the timeline, double-click to add, and show "Add" on hover. `.media-item` reuses `toast-in`, so it re-animates on every tab switch; remove that. Add a grid/list toggle and a search field when there are 6 or more items. |
| Auto-cut | `editor/AutoCutPanel.tsx` | B− | Results-first copy matches the brand. Moment cards need a real thumbnail, the hook score as a 22px rounded chip using semantic success/warning by score, and hover-to-preview (scrub the moment on the card). "Make all N reels" is the screen's primary action. Per the brand rule ("one Ember button per screen") it may be Ember **only if** Export is not also Ember in the same view. Today both are Ember (mockup too), which breaks "one primary". Make it secondary-filled (Paper on ink) while the editor's Export stays Ember. |
| Magic | `smart/SmartToolsPanel.tsx`, `smart/parts.tsx` (`.smart-card*`, `.smart-progress*`) | B− | Good: undoable single steps and live "Listening… 40%". Each `SmartCard` is a full card with a 20px icon, title and lede, so 4 cards fill 900px. Make them **accordion rows** (44px collapsed: icon, title, one-line result such as "12 pauses · 18 s", a chevron) that expand into controls. The progress fill is `--vs-color-track-effects` (purple). Unify to the Paper determinate bar (section 2.11). |
| Boost | `insights/BoostPanel.tsx` | C+ | Same card-stacking issue. Scores need one visual language with Auto-cut (shared `<ScoreChip>`). |
| Templates | `smart/TemplatesPanel.tsx` (`.tpl-*`) | C | All preview cards **animate at once** (`tpl-pan`, `tpl-breathe`, `tpl-grain`, `tpl-leak`, …). That is visual noise and a CPU/GPU cost next to a playing video. Animate **on hover/focus only** and show the static poster at rest. `.tpl-badge` uses 10px text: minimum 11px. The 2-column grid at 320px gives 136px-wide cards. Allow 3 columns once the panel is resized past 380px. The `.clip-tray` drag-to-slot flow needs a visible drop target state (dashed Paper 40% outline, then solid on hover). |
| Text | `LeftPanel.tsx` text section | C+ | Presets should render **in the actual font and style** (like CapCut/Premiere Essential Graphics) as 2-column 72px tiles, not as text buttons. |
| Captions | `editor/CaptionsPanel.tsx`, `CaptionStylePreview.tsx` | B− | Caption style previews are already real renders, which is good. Add a transcript list (words editable inline, click a line to seek) because this is where non-editors fix mistakes. Language picker as a 32px select, not a full-width block. |
| Audio | `smart/SoundsPanel.tsx`, `smart/CutToBeatToggle.tsx` | C+ | Track rows need a play/preview button (32px) and the duration in tabular numerals, plus a mini waveform. "Cut to beat" as a `Toggle` row with a one-line explanation. |
| Voice | `smart/VoicePanel.tsx` | C | Hidden off-screen by rail overflow (see 1.3). 432 lines of controls: needs accordion sections (Clean up · Voice-over · Dub) per section 3.4. |
| Brand kit | `brand/BrandKitPanel.tsx` | C+ | Logo drop area and swatches need 32px targets and a "Reset" per field. |

### 1.5 Preview and transport (`editor/Preview.tsx`, `.preview*`, `.frame*`, `.transport*`, `.play-btn`): **C**
- **Back/forward 5 s use the `undo`/`redo` icons.** Users read them as undo. This is the clearest "below premium" signal in the whole editor. New icons are needed (section 2.8).
- **Timecode `0:15 / 1:55`** has no frames, the current and total time have the same weight, and you cannot type into it. See section 3.3.
- **No frame step, go-to-start/end, zoom (Fit/50/100/200%), full-screen preview or safe-zone toggle.** `.frame__safe` is an always-on dashed inset with no meaning attached. Reels creators need the **actual Instagram/TikTok/Shorts UI overlay** (caption area at the bottom, action rail on the right) as an optional overlay. That is a killer feature for this audience.
- **The 52px white play button** (`.play-btn`, `--vs-shadow-md`, scale on hover) is the loudest element on screen after Export and louder than the content. Make it 40px, neutral-800 fill, Paper icon, no shadow, no scale. Hover goes to neutral-700. Space plays anyway.
- **The `transport__spec` "9:16 · 1080p"** is good information in the wrong place. Move it into the preview toolbar's ratio/zoom dropdown.
- **The stage background** is a radial gradient (`radial-gradient(60% 70% at 50% 45%, neutral-900, bg-app 75%)`). Pro viewers use flat neutral so colour judgement is not biased. Use flat `#0B0B0F` with an optional checkerboard for transparency.
- **The frame corner radius** (looks about 16px) misrepresents the export, which is square-cornered. Use 4px, or 0 with a 1px `#2A2A33` hairline.

### 1.6 Inspector (`editor/Inspector.tsx`, `.inspector*`, `.prop-row`, `.slider*`, `editor/ReframePanel.tsx`): **C**
- **The head block takes about 140px**: eyebrow "VIDEO CLIP", an 18px title and the meta "0:00 to 1:15 · 75.0s". That meta mixes two time formats. Use a 44px header instead: kind icon in track colour, clip name 13/600 (rename on double-click), and the duration `00:01:15:00` in tnum on the right.
- **Double padding in Reframe**: "Reframe for 9:16" sits 24px further in than the header (`.inspector__section` padding plus the ReframePanel's own padding). Pick one: sections own the padding and children have none.
- **The reframe options look disabled** ("Follow the speaker" and the others at low contrast) even though they are choices. If they are unavailable until "Find speakers" runs, say so inline ("Find speakers first to use these") and give them a real `disabled` state (section 2.10). If they are enabled, give them normal contrast.
- **A centred underlined link** "Recognise people after camera cuts (39 MB download)" breaks the left-aligned rhythm. Make it a left-aligned 12px muted line with a download icon, and put the size in a tooltip.
- **Sliders have no numeric entry, no reset and no units.** "Zoom 100%" is display-only. See section 3.4 for scrub fields.
- **No sections or collapse.** Long clips (video + reframe + zoom + sound + speed) scroll a lot. Use accordions with remembered open state.
- **The empty state** "Pick a clip / Click a clip on the timeline to change it." is good copy. Add project-level settings when nothing is selected (Reel shape, Captions on/off, Brand kit, Music), as Premiere does for sequence settings. An empty inspector is wasted prime space.
- `.inspector__note` uses `margin-top: auto`, which pins a tip to the bottom of a scrolling panel. That is fine, but make it dismissible.

### 1.7 Timeline (`editor/Timeline.tsx`, `.timeline*`, `.track*`, `.clip*`, `.ruler*`, `.playhead*`): **D+** (biggest gap)
- **Track headers** (`.track-label`, 120px) show only an icon and a name. Missing: lock, mute/solo (audio), hide (video/text), track height.
- **Row heights**: `rows = 32px repeat(n, minmax(40px, 1fr))`, so empty Text and Captions rows get the same height as Video. In the screenshot about 110px of the 300px timeline is empty rows. Use fixed heights per kind (section 3.2).
- **Clip look**: fully saturated fills with ink text (`.clip--video { background: track-video }`). The video clip shows a filmstrip **plus** a solid blue label pill. Saturated blocks read as a toy (CapCut/iMovie); Premiere/Resolve use tinted bodies with a vivid edge. Section 2.12 has the spec.
- **Selection** (`.clip.is-selected`: 2px gap ring + 4px Paper ring) is heavy and changes the apparent clip size. Use a 1.5px inset Paper outline plus a +10% body tint.
- **The playhead** is `pointer-events: none` and you can only scrub from the ruler. The head (14×18 rounded tab) cannot be dragged. The 2px line is too thick at high zoom.
- **Snapping exists** (`snapper`, `SNAP_PX = 8`) **but is invisible.** Users cannot tell why a clip "jumped". It needs a snap line and a toggle.
- **Zoom**: the slider plus `−` (a text glyph) and `zoom-in` (an icon) don't match. There is no Ctrl+wheel, no fit, and no keyboard zoom. The ruler uses `formatDuration` (`0:10`) and never shows frames even at max zoom.
- **The labels column and the scroll area are separate grids.** Vertical scrolling (needed once tracks or heights grow) will desync. `.timeline__scroll { overflow-y: hidden }` hides the problem today.
- **Clips are `<button>`s** (good for focus) but have no keyboard move or trim (`,`/`.` nudge), and `aria-pressed` is used for selection where `aria-selected` inside a `listbox`/`grid` would be correct.
- **The permanent hint** "Drag clips to move them. Drag their edges to trim." is good for first use and noise after. Dismiss it after the first successful trim (store a flag).
- **The trim handles** (`EDGE_PX = 8`) have no visible handle until hover. Show a 4px Paper bracket on hover with an `ew-resize` / `col-resize` cursor.

### 1.8 Export dialog (`editor/ExportDialog.tsx`, `.export*`): **B−**
- Good: plain language ("Smoothness", "Bigger file"), determinate progress with ETA, and a real done state with "Open folder".
- The dialog shell is its own (`.export`), not shared. Quality and fps "cards" stack vertically, which makes the dialog tall. Put Quality as a 3-up segmented card row and fps as a 2-up row, both 56px high.
- **Missing a preview thumbnail and a size estimate** ("About 48 MB"). This is the most reassuring information for non-editors.
- **No "Export range"** (I/O points) and no "Export all reels" batch hand-off.
- In the running state, show which step is running ("Adding captions…") not just "Exporting… 62%", per brand rule 06 *Show progress*.
- In the done state, 3 buttons ("Done", "Send to Surecast", "Open folder"): make "Open folder" the primary (it is), and "Done" a ghost on the left side to separate dismiss from actions.

### 1.9 Settings (`screens/Settings.tsx`, `.settings*`): **C**
- **Blocking bug: no `WindowControls` and no drag region** while the full-window Settings overlay is open, with `decorations: false` in `tauri.conf.json`.
- One long scrolling page. Use a 200px left nav (Account, Exports, Captions, Performance, Updates, About) with the content at 640px max width. This is the Lightroom preferences pattern.
- Each row is label + hint + control (`.settings__row`), which is good. Make sure controls right-align on a shared 240px column.
- Add **"Show time as: Seconds / Frames"** and **"Show advanced tools"** (keyframes, track headers, J/K/L hints) here. That is the progressive-disclosure switch that keeps Verso friendly.

### 1.10 Account and credits dialogs (`account/Dialog.tsx`, `AccountPanel.tsx`, `UpgradeDialog.tsx`, `credits/*`, `account.css`, `credits.css`): **B−**
- Visual style is consistent, but: **no focus trap, no initial focus and no focus return** in `Dialog`. The close button is a `×` text glyph at `font-size: var(--vs-font-size-title)`. Radius `--vs-radius-xl` (20px) is too bubbly for a pro tool: use 12px.
- `CreditsBadge` (`.credits-badge`, 32px pill) in the top bar is good. Add a low-credit state (warning tone dot) and a click-through to `UsageHistory`.
- `ProBadge`: make it neutral (section 2.12), not Ember-tinted.
- `CostConfirm` / `OutOfCredits`: show the cost **on the button** ("Find speakers · 2 credits"), not only in a follow-up dialog. That removes one interruption.

### 1.11 Batch (`screens/Batch.tsx`, `.batch*`, `.batch-job*`, `.progress-bar`): **C+**
- Has `WindowControls` (good). Job rows need the shared determinate progress bar with a step label ("Picking the best moments… 3 of 5"), a thumbnail, and per-job actions in an overflow menu instead of inline buttons.
- The empty state (`.empty.batch__empty`) should be a large drop zone ("Drop long videos here") with the file-type hint.
- The Pro gate copy is good and plain.

### 1.12 About (`components/About.tsx`, `.about*`): **B**
Clean. Shares nothing with the other dialogs (own shell, `--vs-radius-xl`). Move it onto the shared `Modal`. The Close button autofocuses with a brown-looking ring (Glow at 55% on dark). The new outline focus spec fixes that.

### 1.13 Context menu (`ContextMenu.tsx`, `.ctx-menu*`): **C+**
It exists and looks consistent, but: no arrow-key navigation, no focus on open, no typeahead, and the on-screen clamp guesses height as `items.length * 32`. See section 2.9.

---

## 2. Design system upgrades (exact values)

`verso-tokens.css` says *"Generated, do not hand-edit."* So **add a UI alias layer at the top of `app.css`** (`--ui-*`) that maps onto `--vs-*`, and feed the agreed values back into the brand kit's token source later. Components use only `--ui-*` from then on.

### 2.1 Type scale (dense pro tool)
Manrope Variable, already bundled via `@fontsource-variable/manrope`. Apply the scale to the editor shell. Welcome and marketing surfaces keep the brand scale.

| Token | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|
| `--ui-text-2xs` | 11 / 14 | 600 | +0.02em | ruler labels, badges (PRO, NEW), kbd, eyebrow (uppercase only here) |
| `--ui-text-xs` | 12 / 16 | 500 | 0 | meta, track header names, tooltips, field labels, toasts secondary |
| `--ui-text-sm` | 13 / 18 | 500 (600 emphasis) | 0 | **default editor UI text**: inspector rows, menu items, list items, buttons (sm/md) |
| `--ui-text-md` | 14 / 20 | 500 | 0 | friendly prose: panel ledes, empty states, dialog body |
| `--ui-text-lg` | 16 / 22 | 700 | -0.01em | dialog titles, inspector clip name (if editable large) |
| `--ui-text-xl` | 20 / 26 | 700 | -0.015em | screen titles (Settings, Batch) |
| `--ui-text-2xl` | 28 / 34 | 800 | -0.03em | Welcome section heads |
| hero | 64 / 68 | 800 | -0.045em | Welcome only (unchanged) |

Rules:
- **Nothing under 11px.** Today `font-size: 10px` appears 3× (`.tpl-badge` at L2958, L3153, L4579). Raise them to 11px.
- **Panel title**: 13/600 in a 36px header bar, replacing 18/700.
- **Timecodes and all numbers** (durations, %, dB, credits) use `.tc`:
  ```css
  .tc { font-variant-numeric: tabular-nums slashed-zero; font-feature-settings: "tnum" 1; letter-spacing: 0; }
  ```
  Manrope has `tnum`. Do **not** introduce JetBrains Mono for timecodes: a second family in the shell reads "developer tool".
- Weights: only 500, 600, 700 in the editor. 800 is for the hero and Welcome only.

### 2.2 Spacing rhythm
Keep the 4px grid. Editor defaults:

| Context | Value |
|---|---|
| Panel inner padding | 16px horizontal, 12px top of first section |
| Section vertical padding | 12px |
| Row gap inside a section | 8px |
| Label-to-control gap | 8px horizontal (inline rows), 4px vertical (stacked) |
| Toolbar internal gap | 4px between icon buttons, 8px + 1px divider between groups |
| Dialog padding | 20px; header 56px; footer 64px |
| Card grids (templates, text presets) | 8px gap |

### 2.3 Sizes and hit targets

| Token | Value | Use |
|---|---|---|
| `--ui-control-xs` | 24px | track header toggles (visual size only; hit area 32px via `::before { inset: -4px }`) |
| `--ui-control-sm` | 28px | inspector inline inputs, segmented items in panels |
| `--ui-control` | 32px | **default** buttons, icon buttons, selects, inputs |
| `--ui-control-lg` | 40px | dialog footer buttons, Export, play |
| Top bar | 48px (from 52) | the brand guide says 52. Propose 48 and update the guide: pro tools sit at 40–48 |
| Rail | 64px wide (from 76), items 56px tall | |
| Track heights | S 32 / M 48 / L 72 (video default M 56, see 3.2) | |

The brand guide says "targets at least 36px". The brief asks for 32px or more on desktop. **Recommend 32px minimum hit area** everywhere and update the guideline. Visual elements may be smaller if the hit area is padded.

### 2.4 Radii

| Token | Value | Use |
|---|---|---|
| `--ui-r-xs` | 3px | kbd, badges, clip label chips |
| `--ui-r-sm` | 4px | **timeline clips**, menu items, checkbox, preview frame |
| `--ui-r-md` | 6px | buttons, inputs, selects, segmented container, tooltips |
| `--ui-r-lg` | 8px | cards inside panels (media items, template tiles, moment cards) |
| `--ui-r-xl` | 12px | dialogs, popovers, menus, toasts, command palette |
| `--ui-r-2xl` | 16px | Welcome action cards only |
| pill | 999px | toggles, credits badge, score chips |

Today `--vs-radius-md` (10px) is on 37 rules and `--vs-radius-xl` (20px) is on dialogs. Both are too soft for a pro tool.

### 2.5 Surface layering (5 levels)

| Level | Token | Hex | Use |
|---|---|---|---|
| L0 app | `--ui-bg-app` | `#0B0B0F` | window, top bar, rail, timeline track area, preview stage |
| L1 panel | `--ui-bg-panel` | `#111116` | left panel, inspector, timeline track headers |
| L2 surface | `--ui-bg-surface` | `#16161C` | cards, inputs, segmented container, ruler |
| L3 raised | `--ui-bg-raised` | `#1D1D24` | hover rows, selected list rows, active rail item, segmented active |
| L4 overlay | `--ui-bg-overlay` | `#22222A` (new) | menus, tooltips, popovers, toasts, command palette, dialogs |

Borders:
- `--ui-border` `#2A2A33`: panel splits (1px), input borders.
- `--ui-border-subtle` `rgba(255,255,255,.06)`: separators **inside** panels (sections, list rows). Today full-strength `#2A2A33` is used inside panels too, which makes everything look boxed.
- `--ui-border-strong` `#3A3A45`: overlay outlines, hovered inputs.
- Raised and overlay surfaces get a top highlight: `inset 0 1px 0 rgba(255,255,255,.04)`. That is the subtle "machined" edge Adobe apps use.

### 2.6 Elevation

| Token | Value | Use |
|---|---|---|
| `--ui-e0` | none | panels (separation by borders only) |
| `--ui-e1` | `inset 0 1px 0 rgba(255,255,255,.04), 0 1px 2px rgba(0,0,0,.35)` | buttons (secondary), cards |
| `--ui-e2` | `0 0 0 1px #3A3A45, 0 8px 24px rgba(0,0,0,.5)` | menus, tooltips, popovers |
| `--ui-e3` | `0 0 0 1px #2A2A33, 0 24px 64px rgba(0,0,0,.6)` | dialogs, command palette |
| Primary | `0 1px 0 rgba(255,255,255,.18) inset, 0 4px 14px rgba(255,74,43,.28)` | Export button only (replaces `--vs-shadow-glow` at rest) |

Remove the shadows from `.play-btn` (`--vs-shadow-md`) and `.playhead__head` (`0 2px 8px rgba(255,74,43,.45)`). Glows on small elements look cheap.

### 2.7 Interaction states (one table, all controls)

| State | Visual | Timing |
|---|---|---|
| Rest | text `#B9B7BF` (icons `#8E8C96`), bg transparent or L2 | |
| Hover | bg L3 `#1D1D24`, text/icon `#F5F4F0` | 100ms in, 150ms out |
| Pressed | bg `#2A2A33`, **no scale** on controls under 40px; `translateY(0.5px)` allowed | instant |
| Selected / on | bg L3 + Paper text + a 2px indicator where position matters (rail left edge, tab bottom) | 120ms |
| Focus-visible | `outline: 2px solid #FF9466; outline-offset: 2px` (see below) | instant |
| Disabled | text/icon `#5C5B66`, bg unchanged, no hover, `cursor: default`, `aria-disabled` when it should stay focusable for a tooltip explaining why | |
| Drag-over (drop target) | `outline: 1px dashed rgba(245,244,240,.4)`, then solid Paper at 60% on hover | 120ms |

Replace the global focus rule at `app.css` L48:
```css
:focus-visible { outline: 2px solid var(--vs-color-role-focus-ring); outline-offset: 2px; }
```
Why: the current `box-shadow` focus is **overwritten** by any component that sets its own `box-shadow` (`.segmented__item.is-active`, `.clip.is-selected`, `.play-btn`). It is **clipped** by `overflow: hidden` parents. It also **forces `border-radius: 6px`** on whatever is focused. Outline has none of these problems.

Disabled today is inconsistent: `.btn:disabled { opacity: .55 }`, `.icon-btn:disabled { opacity: .4 }`. Opacity also fades borders and badges unevenly. Use the colour rule above.

### 2.8 Icons
- Sizes: **16** timeline, track headers, menus, inline meta · **20** toolbars, rail, inspector section heads · **24** play/pause only. Already supported by `Icon` (`size` prop).
- Alignment: icons in buttons sit in a square box equal to the line height. Apply `.vs-icon { display: inline-flex; }` (present) plus `vertical-align: -0.2em` for inline text use. Optical rule: play triangle nudged +1px right.
- **Missing icons** (draw in the brand hand: 24 grid, 1.75 stroke, round caps). Today `undo`/`redo` stand in for skip, `−` and `×` are text glyphs, and there is no eye or lock:
  `chevron-down`, `chevron-right`, `step-back` (frame), `step-forward`, `skip-start`, `skip-end`, `skip-back-5`, `skip-forward-5`, `fullscreen`, `fullscreen-exit`, `eye`, `eye-off`, `lock`, `unlock`, `volume-off`, `headphones` (solo), `magnet`, `zoom-out`, `zoom-fit`, `close`, `check`, `search`, `more-horizontal`, `reset`, `keyframe`, `history`, `command`, `safe-zone`, `grip`.
  Add them to `src/assets/icons/` and to the `IconName` union in `components/Icon.tsx`.

### 2.9 Menus
`ctx-menu` spec, also used for the Help menu, overflow menus and selects:
- Container: L4 `#22222A`, `--ui-e2`, radius 8px (menus are tighter than dialogs), items radius 4px, padding 4px, min-width 200px, max-height 60vh with scroll.
- Item: 28px tall, 0 8px padding, 13/500, icon slot 16px (aligned column even when empty), shortcut right-aligned 12/500 `#8E8C96` `.tc`.
- Hover/active item: bg `#2A2A33`. Danger item: text `#F87171`.
- Separator: 1px `rgba(255,255,255,.06)`, 4px vertical margin.
- Keyboard: open focuses the first enabled item; ↑/↓ wrap; Home/End; typeahead; Enter/Space activates; Esc closes and **returns focus** to the invoker.
- Positioning: measure with `getBoundingClientRect` after first paint and flip, instead of the `items.length * 32` guess.
- Motion: opacity 0→1 + translateY(-2px)→0, 120ms enter, 80ms exit.

### 2.10 Tooltips
Replace the CSS `[data-tip]::after` (L3649) with a small `<Tooltip>` rendered into a portal. Reasons: pseudo tooltips are clipped by `.panel`/`.inspector` (`overflow-y: auto`), can't flip at screen edges, and can't render a shortcut chip.
- 12/500 Paper text on L4, `--ui-e2`, radius 6px, padding 4px 8px, max-width 240px (wraps).
- Shortcut chip on the right: kbd style (section 3.6).
- Delay 500ms for the first tooltip, **0ms while moving between tooltipped controls** within 400ms ("skip delay").
- Placement: below in the top bar, above in the timeline and transport (as today), auto-flip.
- Keep `data-tip` as the data source so `IconButton` callers don't change.

### 2.11 Toasts, modals, progress, empty and loading states

**Toasts** (`ui.tsx` `Toast`, `.toast*`):
- Position: **bottom-right of the preview area, 16px above the timeline's top edge**. Today it is bottom-centre at 24px, which covers timeline clips.
- 360px wide, L4, `--ui-e2`, radius 12px, padding 12px 12px 12px 14px. A tone **icon** (16px check / alert / info), not an 8px dot.
- **Action slot**: every smart action toast gets "Undo" ("Removed 12 pauses · Undo"). It reuses the existing `applySmart` message and history. This is the brand's *"Undo everything"* made visible.
- Stack up to 3, newest on top, 8px gap. Pause the timer on hover. Danger stays until dismissed.

**Modals**: one `<Modal>` component (rewrite of `account/Dialog.tsx`) used by Export, About, account, credits, publish and the shortcut sheet:
- Sizes: `sm` 400, `md` 520, `lg` 720. Radius 12px. `--ui-e3`. L4 background.
- Header 56px: title 16/700, close `IconButton` (new `close` icon, 32px).
- Footer: actions right-aligned, primary right-most. Dismiss (Cancel/Done) is a ghost on the far left when there are 3 or more buttons.
- Behaviour: focus trap, autofocus the first field or the primary, Esc closes, backdrop click closes (except while an export is running), return focus on close, `aria-modal` + `aria-labelledby`.
- Backdrop `rgba(5,5,8,.6)`. **Drop `backdrop-filter: blur(6px)`**: it is expensive over a playing `<video>` and smears the preview.
- Motion: opacity + scale .98→1, 180ms `--vs-motion-easing-enter`; exit 120ms.

**Progress** (one component, `<Progress value? label step eta onCancel>`), replacing `.export__bar`, `.smart-progress__bar` and `.progress-bar`:
- Bar 4px, radius 2px, track `#2A2A33`, **fill Paper `#F5F4F0`**. Not purple, not Ember.
- Indeterminate only for the first 1.5s (or when the engine gives no %): a 30%-wide segment sliding at 1.2s linear. Then switch to determinate.
- Label row above the bar: step text 13/500 ("Finding hooks…") + percent `.tc` right-aligned + ETA 12/500 muted ("About 40 s left"). Cancel as a ghost button.
- Matches brand rule 06: *"never a frozen spinner"*.

**Skeletons**:
- `--ui-bg-surface` blocks with a shimmer gradient (`rgba(255,255,255,.04)` band, 1.4s), radius equal to the real element.
- Use them for media thumbnails, template tiles, moment cards and the filmstrip (`.filmstrip.is-loading` exists; align it to this).
- Respect reduced motion: static block.

**Empty states**:
- One pattern: 32px icon in `#5C5B66`, 14/600 title, 13/500 muted one-liner, one secondary button.
- Drop the dashed box (`.empty { border: 1px dashed }`) except on real drop targets. Dashed means "drop here".

### 2.12 Colour use
- **Ember `#FF4A2B` is for: the one primary button per view (Export), the playhead, and the logo.** That's it.
  - The brand guide (*"Selected tool: Ember icon on a raised surface"*) and the mockup (Ember toggles, Ember 9:16 chip, Ember "Make all 4 reels") conflict with this. The code already chose correctly: toggles are Paper (`.toggle.is-on`), chips are Paper. **Update the guideline** to match the code. Keep the rail's selected icon Paper.
  - Current leaks to remove: `ProBadge` (make it 11/600 caps, `#2A2A33` bg, Paper text, or Glow text on neutral if Pro needs warmth), the "Most popular" tag, `.smart-progress__bar` fill (purple), and Auto-cut's "Make all reels" when Export is also visible.
- **Glow `#FF9466`** only for the focus ring. Fine, because focus is transient.
- **Track colours**: keep the hues, change how they are applied (pro look, still colour-coded):
  ```css
  .clip { background: color-mix(in srgb, var(--track) 22%, #16161C);
          box-shadow: inset 0 2px 0 var(--track);        /* vivid top edge */
          color: #F5F4F0; border-radius: 4px; }
  .clip:hover { background: color-mix(in srgb, var(--track) 30%, #16161C); }
  .clip.is-selected { background: color-mix(in srgb, var(--track) 34%, #16161C);
                      outline: 1.5px solid #F5F4F0; outline-offset: -1.5px; }
  .clip .waveform { fill: color-mix(in srgb, var(--track) 75%, transparent); }
  .clip.has-filmstrip .filmstrip { opacity: .9; }
  ```
  Set `--track` per `clip--{kind}` instead of separate background rules. Labels become 12/600 Paper over a `rgba(11,11,15,.55)` chip on filmstrips, which replaces the solid blue pill.
- **Semantic**: success `#34D399` (saved, done, high hook score 80+), warning `#FBBF24` (low credits, score 60–79), danger `#F87171` (errors, destructive menu items), info `#60A5FA` (tips). Never use semantic colours for decoration. Never put semantic colour on large fills: dot, icon or 1px edge only.
- **Contrast check** (on `#111116`): Paper 17.8:1 ✓, `#B9B7BF` 10.3:1 ✓, `#8E8C96` ≈5.7:1 ✓ (body OK), `#5C5B66` ≈2.8:1 ✗ (disabled and decorative only; never for information). Ink on Ember ≈6.3:1 ✓. Never white on Ember.

### 2.13 Motion

| What | Duration | Easing |
|---|---|---|
| Hover colour/bg | 100ms | standard `cubic-bezier(.2,.8,.2,1)` |
| Tooltip in | 120ms (after delay) | enter `cubic-bezier(0,0,.2,1)` |
| Menu / popover in · out | 120ms · 80ms | enter · exit |
| Panel collapse / resize snap | 200ms | standard |
| Accordion | 180ms height + 120ms opacity | standard |
| Modal in · out | 180ms · 120ms | enter · exit |
| Toast in · out | 240ms slide-up 8px · 160ms fade | enter · exit |
| Coach mark | 240ms | enter |

**Never animate**: the playhead, clip drag/trim, scrubbing, timeline zoom, preview frame changes, slider values, list re-renders on tab switch (remove `toast-in` from `.media-item`). `prefers-reduced-motion` is handled (L1621). Keep it, and also stop the template preview loops under it (already at L3085/L4537).

### 2.14 Scrollbars
```css
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: #3A3A45; border: 3px solid transparent; background-clip: padding-box; border-radius: 999px; min-height: 32px; }
::-webkit-scrollbar-thumb:hover { background-color: #5C5B66; border-width: 2px; }
.panel, .inspector { scrollbar-gutter: stable; }   /* no layout jump when content grows */
.timeline__scroll::-webkit-scrollbar { height: 12px; }  /* horizontal scroll is a primary control here */
```
Rail: hide the scrollbar (no overflow after the 56px items).

---

## 3. Layout and interaction

### 3.1 Resizable, collapsible panels with remembered sizes
Today `.editor` is a fixed grid: `76px 320px 1fr 300px` × `52px 1fr 248px`, and `286px` from the duplicate at L3190.

- Grid driven by CSS vars: `grid-template-columns: 64px var(--left-w) minmax(0,1fr) var(--insp-w); grid-template-rows: 48px minmax(0,1fr) var(--tl-h);`
- Splitters: a 1px visible line (`--ui-border`) with a **6px invisible hit area**. On hover after 150ms, the line becomes 2px `#5C5B66` and the cursor `col-resize`/`row-resize`. While dragging, the line is Paper. Double-click resets to the default.
- Limits: left 260–440 (default 320) · inspector 260–400 (default 300) · timeline 180–55% of window height (default 260).
- Collapse: click the active rail item to collapse the left panel to 0 (the rail stays). The inspector collapses via a chevron in its header. **`Ctrl+\`** toggles both ("focus on preview").
- Persist to `localStorage` key `verso.layout.v1` (`{left, insp, tl, leftOpen, inspOpen}`) on pointer-up, not per move.
- Implementation: a ~60-line `useLayout()` hook in `src/lib/layout.ts` plus a `<Splitter>` in `components/ui.tsx`. **No new dependency.**
- Small-window rule: below 1280px wide, the inspector auto-collapses into an overlay drawer when a clip is selected.

### 3.2 A proper timeline
**Structure.** One scroll container for both headers and lanes, with headers `position: sticky; left: 0`. That fixes the vertical desync. The ruler is `position: sticky; top: 0`.

**Track headers** (168px wide, L1 bg, `--ui-border` right edge):
- 3px track-colour strip on the left edge, icon 16, name 12/600 (double-click to rename).
- Toggles on the right at 24px visual / 32px hit: video and text get **eye** (hide in preview/export); audio and music get **mute** and **solo** (headphones); every track gets **lock**.
- Locked tracks: lanes get a diagonal-hatch overlay at 4% Paper and clips ignore pointer events.
- Hidden or muted tracks: clips at 40% opacity.
- Show the toggles only when "Show advanced tools" is on **or** on header hover. The default view stays calm for beginners.

**Heights**:
- Video 56, Audio/Music 40, Text 32, Captions 32.
- Global S/M/L segmented in the toolbar (×0.75 / ×1 / ×1.5). Alt+wheel over a header resizes that track. Drag the header's bottom edge for a per-track height.
- An empty track collapses to 28px with a ghost "+ Add text" / "+ Add captions" button inside the lane.

**Ruler** (28px, L2):
- Labels 11/600 `.tc` `#8E8C96`, major ticks 8px `#5C5B66`, minor 4px `#3A3A45`.
- Format **HH:MM:SS:FF**, with leading zero groups dimmed: `<span class="tc-dim">00:00:</span>12:15`, where dim is `#5C5B66` and the significant part is `#B9B7BF`. Pro-grade and still readable for beginners.
- With Settings → "Show time as: Seconds" the format is `0:12.5`. Frames only appear in labels when one frame is 6px or wider at the current zoom.
- Click or drag on the ruler scrubs (as today). Shift+drag on the ruler sets an I/O range.

**Zoom and scroll**:
- Ctrl+wheel zooms **anchored at the cursor's time**: keep `t_under_cursor` fixed by adjusting `scrollLeft`.
- Shift+wheel or a horizontal trackpad scrolls horizontally. A plain wheel scrolls vertically if the tracks overflow, otherwise horizontally.
- `=` / `-` zoom in/out around the playhead. **`\` zoom to fit.**
- Toolbar: `zoom-out` icon, slider (120px), `zoom-in` icon, `zoom-fit` icon button. Replace the `−` text glyph.
- Zoom range 0.5–8 today. Extend to frame level: `MAX_PX_PER_SEC` × zoom should reach about 30px per frame.

**Selection**:
- Change `selectedClip: string` to `selectedIds: Set<string>` (Editor state and history), with Shift/Ctrl-click to add.
- **Marquee**: drag on an empty lane draws a 1px Paper 60% rectangle with a 6% fill and selects intersecting clips. Ctrl+A selects all. Esc clears.
- Inspector: a mixed selection shows shared properties (volume, speed) or "3 clips selected".

**Snapping**:
- Magnet toggle (new `magnet` icon) in the toolbar, shortcut **`N`** (S is already split). Hold Alt while dragging to bypass temporarily.
- While snapped, draw a **1px Paper vertical line** across the full lane height at the snap time, plus a small flag on the ruler showing the snapped timecode (11/600 on L4).
- Light up the target clip edge with a 2px Paper bracket. `snapper()` already knows the point: return `{t, snapped: boolean, at}` and render it.

**Playhead**:
- Line 1px Ember (2px at zoom < 1).
- Head: a 12×16 pentagon (flat top, point down) in Ember with no shadow, **draggable** (`pointer-events: auto` on the head only), cursor `ew-resize`.
- While the head is being dragged, show a timecode flag above it.
- Auto-scroll the timeline to follow during playback (page-flip when it reaches 90% of the viewport width). Turn this off while the user scrolls manually and turn it back on at the next Play.

**Keyboard** (keep the existing Space, S, Delete, arrows, Home/End, Ctrl+Z/Y/S):
- **J / K / L**: J = play backwards (if reverse decode isn't feasible yet, J steps back 1s per press, held = repeat), K = pause, L = play; L again = 2×, 4×. K+J / K+L = frame step.
- **I / O** set In/Out (shaded `rgba(245,244,240,.08)` region on the ruler and lanes, with 2px Paper brackets). **Alt+X** clears. Export and Auto-cut can use the range ("Export just this part").
- **↑ / ↓** jump to the previous/next edit point (clip edges). **, / .** nudge the selected clip by 1 frame (Shift = 10 frames).
- **Q / W** ripple-trim the start/end to the playhead (Premiere muscle memory; harmless for beginners).
- **C** toggles a razor tool (optional, P2). S at the playhead already covers most needs.

**Clips**:
- Trim handles: on hover, a 4px Paper 70% bracket on the hovered edge. Cursor `col-resize` near edges (`EDGE_PX` 8, which is fine).
- While trimming, show a tooltip with the new duration and the delta (`+0:00:01:12`).
- Transitions (`.clip__transition`): render as a 12px bow-tie on the cut point, centred across the two clips, clickable to edit the length.

### 3.3 Preview
**Preview toolbar** (40px, under the frame, 3 zones):
- **Left: timecode** `00:00:12:15` 15/600 `.tc` Paper, with `/ 00:01:55:00` in 12/500 muted. **Click to type**: accepts `1:23`, `83` (seconds), `1:23:10` (with frames), `+2s` / `-10f` (relative). Enter jumps, Esc cancels. Shows a 1px Glow focus outline when editing.
- **Centre: transport**: go to start · prev frame · **play** (40px, neutral-800, Paper icon) · next frame · go to end. 32px buttons, 4px gaps, with the 5s skips moved to J/L or a long-press. Use the new icons; never the undo/redo glyphs.
- **Right: view**:
  - Zoom dropdown "Fit ▾" (Fit / 50% / 100% / 200%), with Ctrl+wheel over the preview to zoom and drag to pan when zoomed.
  - **Safe zones** toggle (new `safe-zone` icon) with a menu: Title safe (10% inset dashed `rgba(245,244,240,.35)`) · **Reels UI** · **TikTok UI** · **Shorts UI**. The platform overlays are semi-transparent PNG/SVG masks of each app's caption and action-rail zones, so creators keep text out of the danger area.
  - **Full screen** (`F`, Esc exits): black background, the frame centred, a transport overlay that auto-hides after 2s idle.
  - Reel shape chips (9:16 · 1:1 · 4:5 · 16:9), moved here from the top bar. "1080p" shows as a muted spec next to the chips.

**Frame**: radius 4px, 1px `#2A2A33` hairline, flat `#0B0B0F` stage. Drop the radial gradient.

### 3.4 Inspector
- **Header** (44px): kind icon in track colour, clip name 13/600, duration `.tc` right. Overflow `more` menu: Rename, Duplicate, Reset all, Delete.
- **Sections as accordions**: 32px header, chevron 16 (rotates 90° in 180ms), title 12/600 sentence case `#B9B7BF`, a section reset icon (`reset`, 16) visible on hover when any value differs from its default. Open state persists per section in `localStorage` (`verso.inspector.open.v1`).
- Section order for video: **Reel shape & framing** (Reframe) · **Look** (colour, filters) · **Size & position** (zoom, pan) · **Speed** · **Sound** · **Advanced** (closed by default).
- **Numeric scrub field** (`<ScrubNumber>` in `components/ui.tsx`):
  - Row 28px: label 12/500 on the left (**drag on the label to scrub**: cursor `ew-resize`, 1 unit per 2px; Shift ×10, Alt ×0.1).
  - On the right, a 64px input `.tc` right-aligned on L2 with a 1px `#2A2A33` border and radius 4. Unit suffix (`%`, `s`, `dB`) in muted. Arrow keys ±1 (Shift ±10). Enter commits, Esc reverts.
  - An optional slider under the label row for beginner-friendly fields (Zoom, Volume), as today.
  - **Reset to default**: double-click the label, or the hover `reset` icon at the row end. Non-default values show the label in Paper; default values show it in `#B9B7BF`. That gives an instant "what did I change" read.
- **Keyframe diamonds** (P2, behind Settings → "Show advanced tools"; brand rule: *no keyframes on the surface*):
  - A 12px diamond button to the left of each animatable property. Hollow = not animated; filled Paper = keyframe at the playhead; half = animated, no key here.
  - Prev/next key arrows appear when animated.
  - Diamonds also show on the clip in the timeline (8px, Paper 80%) when the clip is selected.
  - Plain-language label in the tooltip: "Animate this. Set a value here, move the playhead, set another."
- **Nothing selected**: show **project settings** (Reel shape, Captions on/off + style, Brand kit, Music volume) instead of an empty panel.

### 3.5 Command palette (Ctrl+K)
- Single source of truth: `src/lib/commands.ts` exports `{ id, label, keywords, shortcut, group, run, enabled(ctx) }[]`. **The Editor keyboard handler (`Editor.tsx` L230–266), the tooltips, the context menus and the shortcut sheet all read from it.** That removes the duplicated shortcut strings ("Undo (Ctrl+Z)" in `TopBar.tsx`, "Split at playhead (S)" in `Timeline.tsx`, `shortcut: "S"` in the `ContextMenu` items).
- UI: 560px wide, top at 18vh, L4, `--ui-e3`, radius 12. Input 44px, 15/500, `search` icon, placeholder "Search actions, tools and clips". Results are 36px rows: icon 16, label 13/500, matched characters in Paper/600 and the rest in `#B9B7BF`, group heading 11/600 caps muted, shortcut kbd on the right. Max 8 visible rows, ↑/↓, Enter, Esc.
- Groups: Recent · Actions (Split, Remove pauses, Export…) · Tools (open rail tabs) · Clips (jump to clip by name) · Settings.
- Fuzzy match: simple subsequence scoring. No dependency.
- Empty query shows Recent plus 5 suggested actions for this context ("Add captions", "Find the best moments").

### 3.6 Keyboard shortcut sheet
- Opens with **`?`** (Shift+/) or Help → Keyboard shortcuts. `lg` Modal (720px), 3 columns: Playback · Editing · Timeline & view.
- A search field filters live.
- Rows: label 13/500 left, kbd right. Generated from `commands.ts`.
- **kbd style**: `min-width: 20px; height: 20px; padding: 0 5px; border-radius: 3px; background: #1D1D24; border: 1px solid #3A3A45; border-bottom-width: 2px; font: 600 11px/18px Manrope; font-variant-numeric: tabular-nums; color: #B9B7BF;`
- Footer: "Tip: press Ctrl+K to search for any action."

### 3.7 Onboarding (first-run coach marks)
- 4 steps on the first editor open, stored as `verso.onboarded.v1`, replayable from Help → Take the tour:
  1. Rail: "Your tools live here. Start with Auto-cut to find the best moments."
  2. Preview: "This is your reel. Press Space to play."
  3. Timeline: "Drag a clip's edge to trim it. Press S to split."
  4. Export: "When it looks good, export your reel."
- Popover: 280px, L4, `--ui-e3`, radius 12, a 8px arrow pointing at the target, and a 4px Paper 30% pulse ring on the target (no Ember). Title 14/700, body 13/500, footer "1 of 4" + "Skip tour" (ghost) + "Next" (secondary).
- The backdrop dims everything except the target with an SVG mask cut-out, at 50% black.
- Never block: click outside advances or closes. Esc skips.
- Contextual one-time hints replace the permanent `.timeline__hint` (shown until the first trim).

### 3.8 Undo history panel
- A small chevron next to the undo button opens a 280px popover listing the last 50 steps, newest on top: icon by type + label 13/500 + time 12/500 muted ("Removed 12 pauses · 2 min ago").
- Click a row to go back to that state. Later steps grey out (still redoable) until a new edit is made.
- Labels: history entries need a `label`. **`applySmart(next, message)` already produces the right sentence**, so store it. Timeline edits get generated labels ("Trimmed Studio session", "Moved B-roll city").
- Also reachable from the command palette ("History").

---

## 4. Prioritised implementation plan

Voice rule for every new string: short, warm, sentence case, verbs on buttons, digits for numbers, no jargon, no exclamation marks in errors (brand guide §07).

### P0: biggest perceived-quality jump, each ≤ 1 day

| # | Item | Files | Acceptance criteria |
|---|---|---|---|
| P0-1 | **UI token alias layer + density pass** | `styles/app.css` (top: `--ui-*` aliases from section 2; replace `--vs-radius-md/lg/xl` usage in editor rules), `styles/account.css`, `styles/credits.css` | Editor default text 13px, controls 32px, panel padding 16px, panel header 36px bar with a 13/600 title, radii per section 2.4, no `font-size` < 11px anywhere (`grep "font-size: 10px"` returns 0). The `frameless-editor.png` retake shows ≥30% more vertical room in the left panel and inspector. |
| P0-2 | **Focus and disabled states** | `styles/app.css` L48 `:focus-visible`, `.btn:disabled`, `.icon-btn:disabled` (L1778) | Focus uses `outline 2px #FF9466 offset 2px`. It is visible on segmented items, selected clips and the play button, and is not clipped in the panel/inspector. Disabled = `#5C5B66` text with no opacity. Tab through the editor and every control shows a ring. |
| P0-3 | **Fix frameless Settings** | `screens/Settings.tsx` (`.settings__bar` gets `data-tauri-drag-region` + `<WindowControls />`), `styles/app.css` `.settings__bar` | With Settings open the window can be dragged, minimised, maximised and closed. Double-click on the bar maximises. |
| P0-4 | **Windows-standard window controls** | `components/WindowControls.tsx`, `styles/app.css` `.winctl*` (L3546) | Buttons 46px wide × full bar height, flush to the top-right corner (no right padding on `.topbar`). Close hover `#C42B1C` with a white glyph. The top-right pixel is clickable for Close. |
| P0-5 | **Transport icons + timecode** | new icons in `src/assets/icons/` (`step-back`, `step-forward`, `skip-start`, `skip-end`), `components/Icon.tsx` union, `editor/Preview.tsx`, `lib/media.ts` (add `formatTimecode(t, fps)`), `styles/app.css` `.transport*`, `.play-btn` | The transport shows start · −1 frame · play · +1 frame · end. No undo/redo glyphs in the transport. Timecode `00:00:12:15` with dimmed leading zeros, `.tc` tabular. Play button 40px neutral, no shadow or scale. Arrow keys still step frames. |
| P0-6 | **Timeline track heights + clip look** | `editor/Timeline.tsx` (`rows` → fixed per-kind heights; `--track` var per clip), `styles/app.css` `.clip*`, `.track*`, remove the duplicate `.clip` block at L2039 by merging | Video 56 / audio 40 / text and captions 32, and empty tracks 28 with "+ Add text". Clips use the tinted body + 2px vivid top edge + Paper label. Selection is a 1.5px inset Paper outline. The Studio-session clip has no solid blue pill. Same screenshot frame shows all 5 tracks with no empty band. |
| P0-7 | **Ctrl+wheel zoom, zoom-to-fit, draggable playhead** | `editor/Timeline.tsx`, `screens/Editor.tsx` keyboard handler (`\`, `=`, `-`), `styles/app.css` `.playhead*` | Ctrl+wheel zooms around the cursor (the time under the cursor stays put within 1px). `\` fits the whole project in view. Dragging the playhead head scrubs, with a timecode flag. Zoom toolbar uses icons only (no `−` glyph). |
| P0-8 | **Visible snapping** | `editor/Timeline.tsx` (`snapper` returns the snap point; render `.snap-line`), `styles/app.css` | When a drag or trim snaps, a 1px Paper line spans the lanes and a ruler flag shows the timecode. `N` toggles the magnet (toolbar button with `aria-pressed`). Alt-drag bypasses. |
| P0-9 | **Rail fits and groups** | `editor/LeftPanel.tsx` (`TABS` order + group separator), `styles/app.css` `.rail*` (64px wide, 56px items, Paper 2px left indicator), `.editor` columns | At a 1280×768 window all 9 tools are visible with no rail scrollbar. Active tool = raised fill + Paper icon + left indicator. Clicking the active tool collapses the panel. |
| P0-10 | **Shared Modal + Progress + Toast-with-Undo** | `components/account/Dialog.tsx` → `components/Modal.tsx` (focus trap, return focus, `close` icon), `components/ui.tsx` (`Progress`, `Toast` action slot), `editor/ExportDialog.tsx`, `About.tsx`, `smart/parts.tsx`, `screens/Batch.tsx`, `screens/Editor.tsx` (`applySmart` passes an undo action), `styles/app.css` (delete `.export__bar`, `.smart-progress__bar`, `.progress-bar` in favour of `.progress`) | One modal shell (radius 12, no backdrop blur). Tab never leaves an open modal and focus returns to the opener. One Paper progress bar with a step label + %. A smart action toast shows "Undo" and clicking it reverts. Toasts sit above the timeline, never over clips. |
| P0-11 | **Media list plain language** | `editor/LeftPanel.tsx` media item, `styles/app.css` `.media-item*` | Meta is one line, `HD · 30 fps · 364 MB`, with no codecs (the codec is in the tooltip). No wrapping at 320px. Rows drag onto the timeline. The mount animation is removed. |
| P0-12 | **Top bar declutter** | `editor/TopBar.tsx`, `styles/app.css` `.topbar*` | Aspect `Segmented` moved to the preview toolbar. The Save button is replaced by "Saved · just now" status (Ctrl+S kept). The help icon opens a Help menu (Shortcuts · Tour · About). The right cluster has ≤ 6 interactive items before the window controls. Bar height 48. |

(12 items listed. If only 10 fit the first sprint, P0-11 and P0-12 slip to week 2.)

### P1: the "pro" layer (1–3 days each)

| # | Item | Files | Acceptance criteria |
|---|---|---|---|
| P1-1 | Resizable, collapsible panels with memory | `src/lib/layout.ts` (new `useLayout`), `components/ui.tsx` `Splitter`, `screens/Editor.tsx`, `.editor` grid (remove the duplicate at L3189) | Drag to resize within limits (3.1). Double-click resets. Sizes survive restart (`verso.layout.v1`). `Ctrl+\` toggles focus mode. Below 1280px the inspector becomes a drawer. |
| P1-2 | Track headers (eye / mute / solo / lock) + S/M/L height | `editor/Timeline.tsx`, `lib/project.ts` (track flags), `VideoLayer.tsx` / export pipeline respects hide/mute, `.track-header*` | Toggling eye hides the track in preview and export. Lock blocks edits and shows the hatch. Toggles have 32px hit areas and `aria-pressed`. Headers stay aligned while scrolling vertically (single scroll container, sticky headers). |
| P1-3 | Ruler HH:MM:SS:FF + "Show time as" setting | `Timeline.tsx`, `lib/media.ts`, `screens/Settings.tsx`, settings store | Frames appear only when a frame is ≥ 6px wide. The Seconds setting switches all timecodes (ruler, transport, inspector) at once. |
| P1-4 | Preview toolbar: timecode entry, zoom, full screen, safe zones incl. Reels/TikTok/Shorts UI overlays | `editor/Preview.tsx`, new overlay SVGs in `src/assets/overlays/`, `.preview-toolbar*` | Typing `1:23` jumps to 00:01:23:00. `+2s` works. Fit/100% zoom with pan. `F` full screen with an auto-hiding transport. Platform overlays align to 1080×1920 and are off by default; the toggle state is remembered. |
| P1-5 | Inspector accordions + ScrubNumber + reset | `editor/Inspector.tsx`, `ReframePanel.tsx` (remove inner padding), `components/ui.tsx` `ScrubNumber`, `.inspector*` | Drag on a label to scrub (Shift/Alt modifiers). Values are typeable. Double-click a label to reset. Changed values show the label in Paper. Section open state persists. No double indent in Reframe. |
| P1-6 | Command registry + Ctrl+K palette + `?` shortcut sheet | `src/lib/commands.ts` (new), `components/CommandPalette.tsx`, `components/ShortcutSheet.tsx`, `screens/Editor.tsx` (keyboard handler reads the registry), `TopBar.tsx`/`Timeline.tsx`/`ContextMenu` labels from the registry | Every shortcut string in the UI comes from one place. Ctrl+K finds "split", "captions" and clip names. `?` opens the sheet with search. No shortcut is defined twice. |
| P1-7 | Portal tooltips with shortcut chips | `components/Tooltip.tsx`, `components/ui.tsx` (`IconButton`), remove the `[data-tip]` CSS at L3649 | Tooltips never clip inside the panel/inspector, flip at edges, show kbd chips, and use the 500ms / skip-delay behaviour. |
| P1-8 | Multi-select + marquee + I/O range | `screens/Editor.tsx` (selection Set, history), `Timeline.tsx`, `Inspector.tsx` (mixed selection), `ExportDialog.tsx` ("Export just this part") | Shift/Ctrl-click and marquee select. Delete removes all selected clips. I/O shading is visible. Export offers the range when one is set. |
| P1-9 | Context menu keyboard support | `components/ContextMenu.tsx`, `.ctx-menu*` | Opens with focus on the first item. ↑/↓/Home/End/typeahead. Esc returns focus. Measured flip positioning. Icon column. Danger styling on Delete. |
| P1-10 | Settings with left nav + advanced switch | `screens/Settings.tsx`, `.settings*` | 200px nav with 6 sections and 640px content. "Show advanced tools" reveals track header toggles, keyframes (when built) and J/K/L hints. Off by default. |
| P1-11 | Smart panels as accordion rows | `smart/parts.tsx` (`SmartCard` → collapsible), `SmartToolsPanel.tsx`, `BoostPanel.tsx`, `VoicePanel.tsx` | Collapsed rows are 44px with a one-line result. Only one row is open at a time. Progress uses the shared `<Progress>`. The cost shows on the button ("Find speakers · 2 credits"). |
| P1-12 | Templates: animate on hover only, 3-column at ≥ 380px | `smart/TemplatesPanel.tsx`, `.tpl-*` | At rest no template preview animates (verify with the DevTools Animations panel: 0 running). Hover or focus plays the preview. Badges are ≥ 11px. |

### P2: delight and depth

| # | Item | Files | Acceptance criteria |
|---|---|---|---|
| P2-1 | First-run coach marks | `components/CoachMarks.tsx`, `screens/Editor.tsx`, Help menu | 4 steps (3.7). Skippable, replayable, never shown again after done or skip. Respects reduced motion. Copy in the brand voice. |
| P2-2 | Undo history popover | `lib/history` (labels), `TopBar.tsx`, `components/HistoryPopover.tsx` | Last 50 labelled steps. Click to jump. Smart actions use their existing toast sentences as labels. |
| P2-3 | J/K/L shuttle incl. 2×/4× and K+J/L frame step | `screens/Editor.tsx`, `VideoLayer.tsx` | L, L, L gives 1×, 2×, 4×. K pauses. J reverses or steps back as described in 3.2. A rate badge shows in the preview corner ("2×"). |
| P2-4 | Keyframes behind the advanced switch | `Inspector.tsx`, `lib/project.ts` (keyframe tracks), `Timeline.tsx` diamonds, renderer | Diamonds per property. Interpolation is linear with an ease toggle. Hidden entirely when advanced tools are off. |
| P2-5 | Welcome polish: real thumbnails, drop-anywhere, recent-card menu | `screens/Welcome.tsx`, autosave writes a poster frame | Recent cards show real frames. Dropping a video on the window starts Auto-cut. Right-click gives Open / Show in folder / Duplicate / Remove. |
| P2-6 | Export: thumbnail + size estimate + step-by-step progress | `ExportDialog.tsx`, export engine progress events | Shows "About 48 MB" before export, and the current step text while running. |
| P2-7 | Transcript list in Captions | `editor/CaptionsPanel.tsx` | Lines are editable inline. Click a line to seek. The active line follows playback. |
| P2-8 | Brand guideline update | brand kit `05-Guidelines`, `04-Design-Tokens` | The guide reflects: Ember only for primary + playhead + logo (rail and toggles use Paper), 32px minimum target, 48px top bar, the editor type scale. Tokens regenerated so the `--ui-*` aliases can map 1:1. |

---

## 5. Accessibility findings

| # | Issue | Where | Fix |
|---|---|---|---|
| A1 | Focus ring overwritten or clipped, and forces `border-radius: 6px` | `app.css` L48 `:focus-visible` uses `box-shadow` | Outline-based ring (P0-2) |
| A2 | Modals don't trap or return focus | `account/Dialog.tsx`, `ExportDialog.tsx`, `About.tsx`, `Settings.tsx` | Shared `Modal` (P0-10) |
| A3 | Settings overlay removes window controls (keyboard and mouse users can't close or move the window) | `screens/Settings.tsx` | P0-3 |
| A4 | Context menu not keyboard-operable after opening (no initial focus, no arrows) | `ContextMenu.tsx` | P1-9 |
| A5 | Timeline clips: selection via `aria-pressed`; no keyboard move/trim; playhead not focusable | `Timeline.tsx` `ClipView` | Lanes as `role="listbox"` + `aria-selected`; `,` `.` nudge, `Q`/`W` trim; the playhead as a `role="slider"` with `aria-valuetext="00:00:12:15"` and arrow keys |
| A6 | Targets below 32px | `.segmented__item` 28px, `.zoom-step` 28px, `.topbar__name` 28px, `.toggle` 26px tall, `.winctl__btn` 30px tall, media-item `+` (20px icon, no padding), track header toggles (to come) | 32px hit areas (pad with `::before` where the visual must stay small) |
| A7 | `#5C5B66` (≈2.8:1 on `#111116`) must never carry information | ruler major ticks (decorative, OK), any hint text | Hints use `#8E8C96` (≈5.7:1) or brighter |
| A8 | The reframe options look disabled but may be enabled, so state is not perceivable | `ReframePanel.tsx` | Real `disabled` + a reason line, or normal contrast |
| A9 | Disabled via opacity (.4/.55) makes text unreadable and fades borders inconsistently | `.btn:disabled`, `.icon-btn:disabled`, `.play-btn:disabled` | Colour-based disabled (P0-2). Use `aria-disabled` + a tooltip saying why when the user needs to know |
| A10 | Close buttons use the `×` text glyph (read as "times" by some screen readers despite `aria-label`; inconsistent size) | `ui.tsx` `Toast`, `account/Dialog.tsx` | `close` icon + `aria-label="Close"` |
| A11 | Tooltip only on hover/focus via CSS; not announced | `[data-tip]` | Portal tooltip with `aria-describedby` (P1-7) |
| A12 | Live progress not announced | `.smart-progress`, export | `<Progress>` with `role="progressbar"` + `aria-valuetext="Finding hooks, 62%"`, plus a polite live region for step changes |
| A13 | Focus order: the top bar puts the window controls after Export, and Tab enters the preview before the panel content you just opened | `TopBar.tsx`, `Editor.tsx` DOM order | DOM order: top bar → rail → panel → preview → inspector → timeline (matches today). Add an F6 cycle between regions (Premiere/Windows convention) and a "Skip to timeline" target |
| A14 | Reduced motion: handled globally (L1621), but template loops and the indeterminate shimmer must stop, not just speed up to 1ms (a 1ms infinite loop flickers) | `.tpl-*`, `.filmstrip.is-loading` | `animation: none` under `prefers-reduced-motion` for infinite animations |

---

## 6. Housekeeping found during the audit (low effort, high hygiene)
- `app.css` is 4,674 lines of append-only phases ("Phase 2: real media" overrides earlier rules). It has duplicate `.editor` (L605, L3189) and `.clip` (L1520, L2039) blocks. As part of P0-1, merge the overrides into their first definitions so future changes don't fight the cascade. Splitting by component (`timeline.css`, `preview.css`, `inspector.css`, `dialogs.css`) is optional and only worth it if it helps the team.
- Z-index values are scattered (1, 2, 3, 50, 55, 60, 70, 80, 90, 100, 1000). Define a scale: `--ui-z-timeline-overlay: 5; --ui-z-popover: 40; --ui-z-toast: 50; --ui-z-modal: 60; --ui-z-tooltip: 70; --ui-z-coach: 80`.
- Hard-coded colours still exist (`rgba(0,0,0,.6)` in `.media-item__dur`, `rgba(91,140,255,.18)`, `rgba(140,170,255,.55)`, `rgba(5,5,8,.66)`). Route them through tokens.
- The Fraunces variable font is a dependency (`package.json`). Make sure it loads only for caption and template styles, never in the shell UI.

---

*Not verified at runtime: Batch, Settings, the account/credits dialogs and the individual smart panels were reviewed from code only, without screenshots. Effort estimates assume one engineer familiar with the codebase.*
