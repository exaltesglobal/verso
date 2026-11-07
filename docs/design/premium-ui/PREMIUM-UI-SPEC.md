# Verso premium shell: implementation spec

Reference mock: `verso-premium-shell.html` (same folder), rendered at 1600×1000 (`verso-premium-shell-1600.png`), 1280×800 (`verso-premium-shell-1280.png`) and the inspector close-up (`verso-premium-inspector.png`). Every value below is copied from the mock's CSS so the React app can match it pixel for pixel. Tokens are the brand tokens in `branding/Verso-Brand-Kit/04-Design-Tokens/verso-tokens.css`; the `--ui-*` names are the alias layer to add at the top of `src/styles/app.css`.

The two tests the mock passes, and the app must keep passing:

1. **Premiere test**: 48px title bar, 36px panel headers, 28px controls, 12px UI text, 1px hairlines, 4–6px radii, tinted clips with a stronger 1px border, HH:MM:SS:FF ruler, track headers with eye/lock/mute, visible snapping, Ember only on Export and the playhead.
2. **Teen test**: the inspector for a selected video clip is four big icon-led groups (Fit to 9:16 · Look · Speed · Voice) that are each one tap, with pictures instead of jargon, plus one quiet "More settings" row. No wall of collapsed chevron sections. Nothing needs to be read to be used.

---

## 0. Alias layer (top of `app.css`)

```css
:root{
  /* colour: three text colours only */
  --ui-t1:#F5F4F0;            /* primary: titles, values, selected labels */
  --ui-t2:#B9B7BF;            /* secondary: default UI text, icons in buttons */
  --ui-t3:#8E8C96;            /* muted: meta, labels, helper lines, ruler labels */
  --ui-t-disabled:#5C5B66;    /* disabled text/icons; never for information */
  --ui-bg-app:#0B0B0F;        /* window, title bar, rail, preview stage, timeline lanes */
  --ui-bg-panel:#111116;      /* left panel, inspector, track headers */
  --ui-bg-surface:#16161C;    /* inputs, tiles, chips, ruler, segmented container */
  --ui-bg-raised:#1D1D24;     /* hover rows, active rail item, segmented active, play button */
  --ui-bg-overlay:#22222A;    /* menus, tooltips, toasts, popovers, dialogs */
  --ui-border:#2A2A33;        /* panel splits, input borders */
  --ui-border-strong:#3A3A45; /* hovered inputs, overlay outlines, slider track */
  --ui-hair:rgba(255,255,255,.06); /* separators inside panels */
  --ui-ember:#FF4A2B; --ui-ember-hover:#FF5F43; --ui-ember-pressed:#E23A1D; /* Export + playhead ONLY */
  --ui-glow:#FF9466;          /* focus ring + selection ring ONLY */
  --ui-tr-video:#5B8CFF; --ui-tr-audio:#2FD4A3; --ui-tr-text:#FFB547; --ui-tr-effects:#C084FC; --ui-tr-captions:#F472B6;
  /* radii */
  --ui-r-xs:3px; --ui-r-sm:4px; --ui-r-md:6px; --ui-r-lg:8px; --ui-r-xl:12px;
  /* elevation */
  --ui-e1:inset 0 1px 0 rgba(255,255,255,.04),0 1px 2px rgba(0,0,0,.35);
  --ui-e2:0 0 0 1px #3A3A45,0 8px 24px rgba(0,0,0,.5);
  --ui-ease:cubic-bezier(.2,.8,.2,1);
  /* layout */
  --ui-rail-w:64px; --ui-left-w:296px; --ui-insp-w:384px; --ui-tl-h:224px; --ui-rail-item:56px;
  --ui-ipad:16px;   /* inspector/panel horizontal padding */
  --ui-swatch:64px; --ui-tile-h:56px; --ui-grp-pt:10px; --ui-grp-pb:12px; --ui-grp-title:20px; --ui-grp-gap:8px;
  --ui-h-text:24px; --ui-h-cap:24px; --ui-h-video:52px; --ui-h-audio:34px;
  --ui-thumb-w:64px; --ui-thumb-h:36px;
}
/* compact window (the mock's 1280×800 state) */
@media (max-width:1400px){:root{
  --ui-left-w:256px; --ui-insp-w:336px; --ui-tl-h:216px; --ui-rail-item:56px;
  --ui-ipad:12px; --ui-swatch:56px; --ui-tile-h:48px; --ui-grp-pt:8px; --ui-grp-pb:10px; --ui-grp-title:18px; --ui-grp-gap:6px;
  --ui-h-text:24px; --ui-h-cap:24px; --ui-h-video:48px; --ui-h-audio:32px;
  --ui-thumb-w:56px; --ui-thumb-h:32px;
}}
html,body{background:var(--ui-bg-app);color:var(--ui-t2);
  font:500 12px/16px Manrope,"Manrope Local","Segoe UI Variable","Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.tc{font-variant-numeric:tabular-nums slashed-zero;font-feature-settings:"tnum" 1} /* every timecode, %, px, dB, credits */
```

Type scale used in the mock (Manrope only, weights 500/600/700): 11/14 600 (rail labels, badges, ruler labels, clip labels, kbd), 11/14 500 (meta, helper lines, toast foot), 12/16 500 (default), 12/16 600 (group titles, chip labels, names), 13/18 600 (panel titles, inspector clip name, current timecode), 13 700 (Export reel). Nothing under 11px.

Editor shell grid:
```css
.editor{display:grid;grid-template-columns:var(--ui-rail-w) var(--ui-left-w) minmax(0,1fr) var(--ui-insp-w);
  grid-template-rows:48px minmax(0,1fr) var(--ui-tl-h);width:100vw;height:100vh;overflow:hidden}
```

---

## 1. Component CSS (exact)

### 1.1 Panel system
```css
.panel{background:var(--ui-bg-panel);border-right:1px solid var(--ui-border);display:flex;flex-direction:column;min-height:0}
.inspector{background:var(--ui-bg-panel);border-left:1px solid var(--ui-border);display:flex;flex-direction:column;min-height:0;position:relative}
.panel__head{display:flex;align-items:center;gap:8px;height:36px;padding:0 8px 0 var(--ui-ipad);border-bottom:1px solid var(--ui-hair);flex:none}
.panel__title{font-weight:600;font-size:13px;color:var(--ui-t1);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.panel__body{padding:8px;overflow:auto;min-height:0;scrollbar-gutter:stable}             /* left panel */
.inspector__body{overflow-y:auto;min-height:0;padding:0 var(--ui-ipad) 6px;scrollbar-gutter:stable}
/* scroll-edge fade: only when the body actually scrolls (toggle .can-scroll from scrollHeight > clientHeight) */
.inspector::after{content:"";position:absolute;left:0;right:10px;bottom:0;height:40px;
  background:linear-gradient(to bottom,rgba(17,17,22,0),var(--ui-bg-panel));pointer-events:none;opacity:0}
.inspector.can-scroll::after{opacity:1}
.panel__foot{margin-top:auto;padding:12px 16px;border-top:1px solid var(--ui-hair);color:var(--ui-t3);font-size:11px;line-height:14px;display:flex;align-items:center;gap:6px}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:#3A3A45;border:3px solid transparent;background-clip:padding-box;border-radius:999px;min-height:32px}
::-webkit-scrollbar-thumb:hover{background-color:#5C5B66;border-width:2px}
```

### 1.2 Section header (inspector group) + hairline divider
```css
.grp{padding:var(--ui-grp-pt) 0 var(--ui-grp-pb);border-bottom:1px solid var(--ui-hair)}   /* the divider IS the group's bottom edge */
.grp__t{display:flex;align-items:center;gap:8px;height:var(--ui-grp-title);margin-bottom:var(--ui-grp-gap);color:var(--ui-t1);font-weight:600} /* 12px/600, 20px icon */
.grp__t .ic{color:var(--ui-t2)}
.help{color:var(--ui-t3);margin-top:var(--ui-grp-gap)}   /* one muted helper line, 12/16 500 */
.hair{height:1px;background:var(--ui-hair)}              /* generic hairline */
```
A section header is **never** a chevron plus text. Groups do not collapse.

### 1.3 Property rows (Advanced) and the scrubbable numeric field
```css
.adv{display:flex;align-items:center;gap:8px;height:28px;margin:0 -8px;padding:0 8px;border-radius:var(--ui-r-sm)}
.adv:hover{background:var(--ui-bg-surface)}
.adv__label{width:88px;flex:none;text-align:right;color:var(--ui-t3);cursor:ew-resize;white-space:nowrap}   /* drag = scrub, dblclick = reset */
.adv:hover .adv__label{color:var(--ui-t2)}
.adv.is-changed .adv__label{color:var(--ui-t1)}             /* value differs from default */
.adv__field{display:inline-flex;align-items:center;justify-content:flex-end;gap:3px;width:72px;height:28px;padding:0 8px;
  border-radius:var(--ui-r-sm);background:var(--ui-bg-surface);border:1px solid var(--ui-border);color:var(--ui-t1);flex:none}
.adv:hover .adv__field{border-color:var(--ui-border-strong)}
.adv__field:focus-within{border-color:var(--ui-glow)}
.adv__unit{color:var(--ui-t3)}                              /* unit inside the field: %, px, °, dB */
.adv__slider{flex:1;position:relative;height:28px;min-width:40px}
.adv__slider::before{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:var(--ui-border-strong)}
.adv__slider::after{content:"";position:absolute;left:0;width:var(--p);top:50%;height:1px;background:var(--ui-t2)}
.adv__slider i{position:absolute;left:var(--p);top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;
  background:var(--ui-t1);border:1px solid #0B0B0F;box-shadow:0 0 0 1px var(--ui-border-strong);z-index:1}
.adv__reset{width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;color:var(--ui-t3);visibility:hidden;flex:none;border-radius:3px}
.adv:hover .adv__reset,.adv.is-changed .adv__reset{visibility:visible}
.adv__reset:hover{color:var(--ui-t1)}
/* "Advanced" divider: left-aligned caption + hairline (never centred) */
.advhead{display:flex;align-items:center;gap:8px;height:16px;margin:4px 0 4px;color:var(--ui-t3);font:600 11px/14px Manrope;letter-spacing:.04em;text-transform:uppercase}
.advhead::after{content:"";flex:1;height:1px;background:var(--ui-hair)}
```
`ScrubNumber` behaviour: drag on the label 1 unit per 2px (Shift ×10, Alt ×0.1); arrows ±1 (Shift ±10); Enter commits, Esc reverts; double-click the label resets; reset icon shows on hover and always when changed.

### 1.4 Segmented control (preview ratio) and chips (speed, louder/normal)
```css
.seg{display:inline-flex;height:28px;padding:2px;border-radius:var(--ui-r-md);background:var(--ui-bg-surface);border:1px solid var(--ui-border)}
.seg button{height:22px;padding:0 10px;border-radius:var(--ui-r-sm);font-weight:600;color:var(--ui-t3);white-space:nowrap}
.seg button:hover{color:var(--ui-t1)}
.seg button.is-active{background:var(--ui-bg-raised);color:var(--ui-t1);box-shadow:inset 0 0 0 1px var(--ui-border-strong)}

.chips{display:flex;gap:8px}
.chip{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:28px;border-radius:var(--ui-r-md);
  background:var(--ui-bg-surface);border:1px solid var(--ui-border);color:var(--ui-t2);font-weight:600;white-space:nowrap}
.chip .ic{color:var(--ui-t3)}
.chip:hover{border-color:var(--ui-border-strong);color:var(--ui-t1)}
.chip.is-selected{border-color:var(--ui-glow);box-shadow:inset 0 0 0 1px var(--ui-glow);color:var(--ui-t1)}
.chip.is-selected .ic{color:var(--ui-t1)}
```

### 1.5 Tiles (Fit to 9:16), Look swatches, toggle
```css
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:var(--ui-grp-gap)}
.tile{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;height:var(--ui-tile-h);
  border-radius:var(--ui-r-md);background:var(--ui-bg-surface);border:1px solid var(--ui-border);color:var(--ui-t3)}
.tile:hover{border-color:var(--ui-border-strong);color:var(--ui-t2)}
.tile .d-strong{color:var(--ui-t1);stroke:var(--ui-t1)}   /* the 9:16 frame + person in the pictogram are Paper; the source frame is muted */
.tile.is-selected{border-color:var(--ui-glow);box-shadow:inset 0 0 0 1px var(--ui-glow);color:var(--ui-t1)}
.tile__d{width:48px;height:32px}                           /* pictogram: 48×32 viewBox, 1.4 stroke, round caps */
.tile__l{font-weight:600;color:var(--ui-t2)} .tile.is-selected .tile__l{color:var(--ui-t1)}
.pro{position:absolute;top:5px;right:5px;height:16px;padding:0 5px;border-radius:var(--ui-r-xs);background:#2A2A33;color:var(--ui-t2);font:600 11px/16px Manrope} /* neutral, never Ember */

.looks{display:flex;gap:8px;justify-content:space-between}
.look{display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--ui-t3);font-size:11px;line-height:14px;flex:none}
.look__sw{display:block;width:var(--ui-swatch);height:var(--ui-swatch);border-radius:var(--ui-r-md);border:1px solid var(--ui-border);overflow:hidden;background:#000}
.look:hover{color:var(--ui-t1)} .look:hover .look__sw{border-color:var(--ui-border-strong)}
.look.is-selected{color:var(--ui-t1);font-weight:600}
.look.is-selected .look__sw{border-color:var(--ui-glow);box-shadow:inset 0 0 0 1px var(--ui-glow)}

.trow{display:flex;align-items:center;gap:10px;height:28px;margin-bottom:var(--ui-grp-gap)}
.toggle{width:32px;height:18px;border-radius:999px;background:var(--ui-t1);position:relative;flex:none;border:1px solid var(--ui-t1)}
.toggle::after{content:"";position:absolute;top:1px;right:1px;width:14px;height:14px;border-radius:50%;background:#0B0B0F}
.toggle[aria-checked="false"]{background:#2A2A33;border-color:var(--ui-border-strong)}
.toggle[aria-checked="false"]::after{right:auto;left:1px;background:var(--ui-t2)}
.trow__l{color:var(--ui-t1);font-weight:600}
.trow__h{color:var(--ui-t3);margin-left:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} /* outcome text: "Noise and echo removed" */
```
Look swatches are the clip's own frame (crop of the current frame, `preserveAspectRatio: slice`) with the grade applied, never flat colour blocks. Mock grades: Warm = `#FF9A3C` 30% soft-light + `#FFB547` 12%; Film = `#1E6F74` 48% multiply + `#F2C9A3` 14% screen + 7px letterbox bars; Clean = `#F5F4F0` 16%; Night = `#2E4CB8` 58% multiply + `#7FA6FF` 12% screen.

### 1.6 "More settings" disclosure
```css
.more{display:flex;align-items:center;gap:8px;height:28px;width:100%;margin:2px 0 0;padding:0 4px 0 2px;border-radius:var(--ui-r-md);color:var(--ui-t2);font-weight:500;text-align:left}
.more:hover{background:var(--ui-bg-raised);color:var(--ui-t1)}
.more .chev{transition:transform 180ms var(--ui-ease)}      /* chevron-down at rest; rotate(180deg) when open; shortcut Alt+M only in the tooltip */
.advwrap{display:none;padding-bottom:12px} .is-open .advwrap{display:block} .is-open .more .chev{transform:rotate(180deg)}
```
Closed by default. State persists in `localStorage` (`verso.inspector.more.v1`).

### 1.7 Buttons, icon buttons, states
```css
button{font:inherit;color:inherit;background:none;border:0;cursor:default;transition:background-color 100ms var(--ui-ease),color 100ms var(--ui-ease),border-color 100ms var(--ui-ease)}
.ib{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:var(--ui-r-md);color:var(--ui-t3);position:relative}
.ib--32{width:32px;height:32px}
.ib:hover{background:var(--ui-bg-raised);color:var(--ui-t1)}
.ib:active{background:#2A2A33}                               /* pressed: no scale */
.ib.is-on,.ib.is-active{background:var(--ui-bg-raised);color:var(--ui-t1);box-shadow:inset 0 0 0 1px var(--ui-border-strong)}
.ib:disabled{color:var(--ui-t-disabled);background:none}     /* disabled: colour only, no opacity */
.btn-primary{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px 0 10px;border-radius:var(--ui-r-md);background:var(--ui-ember);color:#0B0B0F;font-weight:700;white-space:nowrap;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 4px 14px rgba(255,74,43,.22)}  /* the only Ember button in the editor */
.btn-primary:hover{background:var(--ui-ember-hover)} .btn-primary:active{background:var(--ui-ember-pressed)}
.divider{width:1px;height:16px;background:var(--ui-border);margin:0 4px;flex:none}
kbd{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:var(--ui-r-xs);background:var(--ui-bg-raised);border:1px solid var(--ui-border-strong);border-bottom-width:2px;font:600 11px/16px Manrope;color:var(--ui-t2);font-variant-numeric:tabular-nums}
```

### 1.8 Focus ring
```css
:focus-visible{outline:2px solid var(--ui-glow);outline-offset:2px}   /* replaces the box-shadow focus at app.css L48 */
```
Selection rings (tile, chip, look, timeline clip) are `border-color:#FF9466 + inset 0 0 0 1px #FF9466`. Glow appears nowhere else.

### 1.9 Toast (export progress) and Progress bar
```css
.toast{position:absolute;right:12px;bottom:8px;width:288px;padding:8px 12px 8px 14px;border-radius:var(--ui-r-lg);background:var(--ui-bg-overlay);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04),var(--ui-e2);z-index:5}         /* anchored to .preview (position:relative) */
.toast__row{display:flex;align-items:center;gap:8px} .toast__row .ic{color:var(--ui-t2)}
.toast__title{font-weight:600;color:var(--ui-t1);flex:1} .toast__pct{color:var(--ui-t2);font-weight:600}
.toast__bar{height:2px;border-radius:1px;background:#2A2A33;margin:8px 0 6px;overflow:hidden}
.toast__bar i{display:block;height:100%;width:var(--p);background:var(--ui-t1)}  /* Paper fill, never purple/Ember */
.toast__foot{display:flex;align-items:center;justify-content:space-between;color:var(--ui-t3);font-size:11px;line-height:14px}
.toast__cancel{height:24px;padding:0 8px;border-radius:var(--ui-r-sm);color:var(--ui-t2);font-weight:600;font-size:11px;margin-right:-6px}
.toast__cancel:hover{background:#2A2A33;color:var(--ui-t1)}
```
Placement rule: the toast never covers the frame or the transport. The stage reserves a bottom gutter: `.stage{padding:4px 16px var(--ui-stage-pb)}` with `--ui-stage-pb:36px` (toast sits beside the transport's empty right side) and, in the compact window, `--ui-stage-pb:84px; .toast{bottom:56px}` (toast moves up into the gutter above the transport). Toast motion 240ms slide-up 8px in, 160ms fade out. Stack max 3, 8px gap.

### 1.10 Tooltip
```css
.tip{position:absolute;top:calc(100% + 2px);left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;height:24px;padding:0 4px 0 8px;
  border-radius:var(--ui-r-md);background:var(--ui-bg-overlay);box-shadow:var(--ui-e2);color:var(--ui-t1);font-weight:500;white-space:nowrap;z-index:9}
.tip kbd{height:16px;min-width:16px;padding:0 4px;font-size:10px;line-height:14px;border-bottom-width:1px}
```
Render in a portal (never clipped by a scrolling panel). 500ms delay, 0ms when moving between tooltipped controls within 400ms. Below in the title bar and timeline toolbar, above in the transport. The shortcut chip lives here, not on the control.

### 1.11 Context menu
```css
.ctx{min-width:200px;padding:4px;border-radius:var(--ui-r-lg);background:var(--ui-bg-overlay);box-shadow:var(--ui-e2);max-height:60vh;overflow:auto}
.ctx__item{display:flex;align-items:center;gap:8px;height:28px;padding:0 8px;border-radius:var(--ui-r-sm);font:500 13px/18px Manrope;color:var(--ui-t2)}
.ctx__item .ic{width:16px;color:var(--ui-t3)}                 /* icon column always reserved */
.ctx__item:hover,.ctx__item.is-active{background:#2A2A33;color:var(--ui-t1)}
.ctx__item.is-danger{color:#F87171}
.ctx__kbd{margin-left:auto;font-size:12px;color:var(--ui-t3)}
.ctx__sep{height:1px;background:var(--ui-hair);margin:4px 0}
```
Enter 120ms (opacity + translateY(-2px)), exit 80ms. Arrow keys wrap, Esc returns focus to the invoker.

---

## 2. Inspector layout rules (selected video clip)

Header (36px): kind icon 16px in the track colour (`#5B8CFF` for video) · clip name 13/600 Paper (ellipsis) · duration `.tc` 12/500 muted right · 28px `more` icon button. No eyebrow, no 18px title, no meta line.

Body, top to bottom, with the hairline divider as each group's bottom edge:

| # | Group | Icon (20px) | Control | Default | Notes |
|---|---|---|---|---|---|
| 1 | **Fit to 9:16** | `reframe` | 2×2 tiles 56px tall (48 compact): Auto · Centre · Follow me (Pro) · Both speakers (Pro) | Auto selected (Glow ring) | pictograms = a 9:16 frame with a person; Auto adds a sparkle, Centre adds centre ticks, Follow me moves the frame with a dashed ghost and an arrow, Both speakers splits the frame with a person in each half. Helper line under the grid: "Auto finds who is talking". Pro chip top-right of the tile, neutral. |
| 2 | **Look** | `filters` | 5 swatches 64px (56 compact) + 11px label under each: Original · Warm · Film · Clean · Night | Original | swatches render the clip's current frame with the grade applied |
| 3 | **Speed** | `speed` | 4 chips 28px: 0.5x · 1x · 1.5x · 2x, one gauge glyph whose needle turns further per step (rotate −95°, −45°, 5°, 50°) | 1x | |
| 4 | **Voice** | `voiceover` | row: 32×18 toggle + "Clean up voice" + outcome text right ("Noise and echo removed"); then 2 chips: Louder · Normal | on · Normal | the outcome text changes with the state ("Off" when off) |
| 5 | **More settings** | chevron | 28px disclosure row, closed by default | closed | expands to the "Advanced" caption + rows Scale · Position X · Position Y · Rotation · Opacity · Volume (1.3) |

Spacing: group padding 10px top / 12px bottom (8/10 compact), title 20px (18), gap 8px (6) between title and control and between control rows. Panel padding 16px (12). Never collapse groups 1–4. If the panel cannot fit groups 1–4 plus the More row, the body scrolls with the 40px edge fade; it never opens scrolled.

Compact rule: below 1400px window width the inspector is 336px wide and the mock's compact variables apply; everything in groups 1–4 and the More row fits a 1280×800 window without scrolling (491px of 495px).

Nothing selected: show project settings (Reel shape, Captions on/off, Brand kit, Music volume) in the same group style.

---

## 3. Timeline rules

Height 224px (216 compact) = toolbar 32 + ruler 24 + lanes. Track header column 160px, `--ui-bg-panel`, 1px `--ui-border` right edge.

```css
.timeline{display:grid;grid-template-rows:32px minmax(0,1fr);border-top:1px solid var(--ui-border);background:var(--ui-bg-app);position:relative;overflow:hidden}
.ttool{display:flex;align-items:center;gap:4px;padding:0 8px;border-bottom:1px solid var(--ui-border)}   /* select · razor · delete | snap … zoom-out · slider 120px · zoom-in · zoom-fit */
.tbody{display:grid;grid-template-columns:160px minmax(0,1fr);min-height:0;overflow:hidden}
.heads__ruler{height:24px;border-bottom:1px solid var(--ui-border);display:flex;align-items:center;justify-content:flex-end;padding:0 12px;color:var(--ui-t3);font-size:11px} /* "30 fps" */
.th{position:relative;display:flex;align-items:center;gap:8px;padding:0 8px 0 12px;border-bottom:1px solid var(--ui-hair);color:var(--ui-t2)}
.th::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--tr)}  /* track colour strip */
.th .ic{color:var(--ui-t3)} .th__name{font-weight:600;flex:1}
.th__tg button{width:20px;height:20px;border-radius:3px;color:var(--ui-t3)} .th__tg button:hover{background:var(--ui-bg-raised);color:var(--ui-t1)}
.th--text{height:var(--ui-h-text);--tr:var(--ui-tr-text)} .th--cap{height:var(--ui-h-cap);--tr:var(--ui-tr-captions)}
.th--video{height:var(--ui-h-video);--tr:var(--ui-tr-video)} .th--audio{height:var(--ui-h-audio);--tr:var(--ui-tr-audio)} .th--music{height:var(--ui-h-audio);--tr:var(--ui-tr-effects)}
```
Track header icons: Text `text`, Captions `captions`, Video `video`, Sound `voiceover` (mic), Music `music`. Toggles: eye + lock for Text/Captions/Video; speaker (unmuted glyph, `volume` without the outer arc) + lock for Sound/Music. The muted-speaker glyph appears only when a track is actually muted.

Ruler (24px, `--ui-bg-surface`, 1px `--ui-border` bottom):
```css
.ruler{background-image:
  repeating-linear-gradient(to right,#3A3A45 0 1px,transparent 1px var(--pps)),              /* every 1 s, 4px */
  repeating-linear-gradient(to right,#5C5B66 0 1px,transparent 1px calc(var(--pps) * 5)),    /* every 5 s, 6px */
  repeating-linear-gradient(to right,#8E8C96 0 1px,transparent 1px calc(var(--pps) * 10));   /* every 10 s, 9px */
  background-size:100% 4px,100% 6px,100% 9px;background-position:0 100%;background-repeat:no-repeat}
.ruler__lbl{position:absolute;top:3px;left:calc(var(--pps) * var(--t) + 4px);font:600 11px/14px Manrope;color:var(--ui-t3);font-variant-numeric:tabular-nums}
.ruler__lbl em{font-style:normal;color:#5C5B66}   /* dimmed leading "00:00:" */
```
Labels every 10 s as `00:00:10:00`; a label is suppressed when the playhead head or a snap flag would cover it. Lanes content width = duration × pps + 96px end padding so the last label never clips. Zoom-to-fit chooses pps = (lanes width − 96) / duration (mock: 14.5 at 1600, 11 at 1280).

Clips:
```css
.clip{position:absolute;top:3px;bottom:3px;left:calc(var(--pps) * var(--s));width:calc(var(--pps) * var(--d) - 1px);border-radius:var(--ui-r-sm);
  background:color-mix(in srgb,var(--tr) 20%,var(--ui-bg-surface));border:1px solid color-mix(in srgb,var(--tr) 55%,var(--ui-bg-surface));color:var(--ui-t1);overflow:hidden}
.clip:hover{background:color-mix(in srgb,var(--tr) 28%,var(--ui-bg-surface))}
.clip.is-selected{background:color-mix(in srgb,var(--tr) 30%,var(--ui-bg-surface));border-color:var(--ui-glow);box-shadow:inset 0 0 0 1px var(--ui-glow)}
.clip__label{font:600 11px/16px Manrope;padding:0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.clip--video .clip__label{position:absolute;top:4px;left:4px;height:18px;padding:0 6px;border-radius:var(--ui-r-xs);background:rgba(11,11,15,.62);max-width:calc(100% - 8px)}
.clip--video .filmstrip{opacity:.85;border-radius:3px}
.clip--audio .clip__label,.clip--music .clip__label{position:absolute;left:4px;top:50%;transform:translateY(-50%);background:rgba(11,11,15,.55);border-radius:var(--ui-r-xs);height:18px;line-height:18px}
.waveform{stroke:color-mix(in srgb,var(--tr) 60%,transparent);stroke-width:2;stroke-linecap:round}   /* bars every 3px, no fill */
.clip--text{--tr:var(--ui-tr-text)} .clip--cap{--tr:var(--ui-tr-captions)} .clip--video{--tr:var(--ui-tr-video)} .clip--audio{--tr:var(--ui-tr-audio)} .clip--music{--tr:var(--ui-tr-effects)}
```
Caption chips must stay readable: group words so that at zoom-to-fit a chip is at least ~80px; a chip that would truncate to under 4 characters drops its label instead.

Playhead and snap:
```css
.playhead{position:absolute;top:0;bottom:0;width:1px;background:var(--ui-ember);z-index:3}
.playhead::before{content:"";position:absolute;top:0;left:-6px;width:13px;height:16px;background:var(--ui-ember);clip-path:polygon(0 0,100% 0,100% 58%,50% 100%,0 58%)} /* no shadow; head is draggable */
.snap{position:absolute;top:24px;bottom:0;width:1px;background:rgba(245,244,240,.7);z-index:2}
.snap__flag{position:absolute;top:-21px;left:50%;transform:translateX(-50%);height:18px;padding:0 6px;border-radius:var(--ui-r-xs);background:var(--ui-bg-overlay);box-shadow:0 0 0 1px var(--ui-border-strong);color:var(--ui-t1);font:600 11px/18px Manrope;font-variant-numeric:tabular-nums}
```
The playhead is the only Ember element besides Export. Magnet toggle `is-on` in the toolbar (shortcut N). Zoom slider: 120px, 1px track `#3A3A45`, filled part `#B9B7BF`, 10px Paper knob with a 1px `#3A3A45` ring.

---

## 4. Preview toolbar and transport

```css
.ptool{display:flex;align-items:center;height:40px;padding:0 12px;gap:8px}      /* [9:16 | 1:1 | 4:5 | 16:9]  "1080p · 30 fps"  …  Fit ▾  [safe zones]  [full screen] */
.spec{color:var(--ui-t3)} .fitbtn{height:28px;padding:0 6px 0 10px;border-radius:var(--ui-r-md);color:var(--ui-t2);font-weight:600}
.stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:4px 16px var(--ui-stage-pb)}   /* flat #0B0B0F, no radial gradient */
.frame{position:relative;height:100%;max-width:100%;aspect-ratio:9/16;border-radius:var(--ui-r-sm);overflow:hidden;border:1px solid var(--ui-border);background:#000}
.transport{display:flex;align-items:center;height:48px;padding:0 16px;position:relative}
.timecode .cur{font-size:13px;font-weight:600;color:var(--ui-t1)} .timecode .tot{font-size:12px;color:var(--ui-t3)}   /* 00:00:12:00  / 00:01:31:29 */
.transport__mid{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:4px}        /* skip-start · step-back · play · step-fwd · skip-end, 32px buttons */
.play{width:40px;height:40px;border-radius:50%;background:var(--ui-bg-raised);border:1px solid var(--ui-border);color:var(--ui-t1);margin:0 4px} /* no shadow, no scale */
.play:hover{background:#2A2A33} .play .ic{margin-left:2px}
```
Overlays on the frame (toggle "Safe zones", on in the mock): thirds grid at `#F5F4F0` 10%, title-safe rectangle 10% inset dashed `4 4` at 32%, tracking brackets on the speaker 1.5px Paper 90% with a tag `Auto · Speaker 1` (9px/700 on `#0B0B0F` 72%). Caption preview text 27px/800 Paper with a 5px ink stroke; the emphasised word in `#FFB547`. Transport icons are `skipstart / stepback / play / stepfwd / skipend`; never undo/redo glyphs.

---

## 5. Title bar and rail

```css
.titlebar{display:flex;align-items:center;height:48px;background:var(--ui-bg-app);border-bottom:1px solid var(--ui-border);padding-left:12px;-webkit-app-region:drag} .titlebar>*{-webkit-app-region:no-drag}
.mark{width:20px;height:20px;color:var(--ui-t1)}                                  /* mark only, no wordmark */
.proj{display:flex;align-items:center;gap:6px;margin-left:10px;height:28px;padding:0 6px;border-radius:var(--ui-r-md)} /* "Podcast Ep. 42 › Reel 1 of 4" */
.proj__name{font-weight:600;color:var(--ui-t1)} .proj__reel{color:var(--ui-t2)}
.saved{display:flex;align-items:center;gap:4px;color:var(--ui-t3);margin-left:8px}   /* check icon + "Saved just now" replaces the Save button */
.titlebar__right{display:flex;align-items:center;gap:4px;height:100%}             /* undo · redo | help · credits · avatar · Export reel · window controls */
.credits{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px 0 8px;border-radius:999px;background:var(--ui-bg-surface);border:1px solid var(--ui-border);color:var(--ui-t2);font-weight:600}
.avatar{width:24px;height:24px;border-radius:50%;background:linear-gradient(180deg,#3A3A45,#2A2A33);border:1px solid var(--ui-border-strong);font:700 11px/1 Manrope;color:var(--ui-t1);margin:0 4px}
.winctl{display:flex;height:100%;margin-left:8px}
.winctl button{width:46px;height:100%;color:var(--ui-t2);border-radius:0}       /* flush to the top-right corner, no right padding on the bar */
.winctl button:hover{background:var(--ui-bg-raised)} .winctl button.close:hover{background:#C42B1C;color:#fff}

.rail{display:flex;flex-direction:column;padding:4px 0;background:var(--ui-bg-app);border-right:1px solid var(--ui-border);overflow:hidden}
.rail__item{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;height:var(--ui-rail-item);margin:0 4px;border-radius:var(--ui-r-md);color:var(--ui-t3);font:600 11px/14px Manrope;letter-spacing:.01em} /* 20px icon + label */
.rail__item:hover{color:var(--ui-t2);background:var(--ui-bg-raised)}
.rail__item.is-active{color:var(--ui-t1);background:var(--ui-bg-raised)}
.rail__item.is-active::before{content:"";position:absolute;left:-4px;top:50%;height:20px;width:2px;margin-top:-10px;background:var(--ui-t1);border-radius:1px}
.rail__sep{height:1px;background:var(--ui-border);margin:4px 16px}               /* between Make (Media…Voice) and Smart (Auto-cut, Magic, Boost) */
```
Rail order: Media, Templates, Text, Captions, Audio, Voice | Auto-cut, Magic, Boost. 9 × 56px + separator fits a 536px column (the 1280×800 case) with no scrollbar.

Media rows: `.mrow{height:52px;padding:0 8px;gap:10px (8 compact);border-radius:6px}` hover `--ui-bg-raised`; thumb 64×36 (56×32 compact) filmstrip with a 1px border; name 12/600 Paper **without the file extension** (extension in the tooltip); meta 11/500 muted `HD · 30 fps · 1:32` (no codecs); `+ Add` pill 24px (`.madd`) on hover only, 11/600 Paper on `--ui-bg-surface` with a `--ui-border-strong` border. Search field 28px with a `/` kbd. Panel foot: "Drop videos anywhere to add them".

---

## 6. Mock region → component mapping

| Mock region (class) | Component file | What changes |
|---|---|---|
| `.titlebar`, `.proj`, `.saved`, `.credits`, `.avatar`, `.btn-primary` | `src/components/editor/TopBar.tsx` (`.topbar*`), `src/components/credits/*` | 48px bar; breadcrumb + saved state in the left cluster; ratio segmented removed from the centre; Save button replaced by status; ≤6 items before the window controls |
| `.winctl` | `src/components/WindowControls.tsx` (`.winctl__btn`) | 46px × bar height, flush right, close hover `#C42B1C` |
| `.rail`, `.rail__item`, `.rail__sep` | `src/components/editor/LeftPanel.tsx` (`TABS`, `.rail`) | 64px wide, 56px items, grouping separator, Paper indicator |
| `.panel`, `.phead`, `.pbody`, `.search`, `.mrow`, `.mthumb`, `.madd`, `.pfoot` | `LeftPanel.tsx` (`.panel__head`, `.media-item*`, `.media-list`) | 36px header, one-line meta, hover Add, foot hint |
| `.ptool`, `.seg`, `.spec`, `.fitbtn` | `src/components/editor/Preview.tsx` (new preview toolbar above `.preview__stage`) | ratio segmented moved here, 1080p · 30 fps, Fit, safe zones, full screen |
| `.stage`, `.frame`, `.frame__ov` | `Preview.tsx` (`.preview__stage`, `.frame*`), `SafeZoneOverlay.tsx`, `Overlays.tsx`, `VideoLayer.tsx` | flat stage, 4px radius + hairline, tracking brackets + tag, thirds + title-safe |
| `.transport`, `.timecode`, `.play` | `Preview.tsx` (`.transport*`, `.play-btn`) | HH:MM:SS:FF, current/total weights, 40px neutral play, frame-step icons |
| `.toast` | `src/components/editor/ExportDialog.tsx` running state, `src/components/ui.tsx` `Toast`/`Progress` | running export becomes a toast; one Paper progress bar |
| `.ihead` | `src/components/editor/Inspector.tsx` (`.inspector__head`, `.eyebrow`, `.inspector__title`) | 36px header replaces the 140px head block |
| `.grp` Fit to 9:16 (`.tiles`, `.tile`, `.pro`, `.help`) | `src/components/editor/ReframePanel.tsx` (`.reframe__modes`, `.reframe__link`) | 2×2 pictogram tiles replace the greyed list + "Find speakers" + download link; Pro chip on the tile |
| `.grp` Look (`.looks`, `.look`) | `Inspector.tsx` (`.style-pick`, `.swatches`), `LookOverlay.tsx` | frame-based swatches |
| `.grp` Speed (`.chips`, `.chip`) | `Inspector.tsx` (`.chips`) | gauge chips |
| `.grp` Voice (`.trow`, `.toggle`, `.chips`) | `Inspector.tsx` + `src/components/smart/VoicePanel.tsx` clean-up toggle | toggle + outcome text + Louder/Normal |
| `.more`, `.advwrap`, `.advhead`, `.adv*` | `Inspector.tsx` (`.slider*`, `.field*`) → new `ScrubNumber` in `src/components/ui.tsx` | the six Premiere rows behind one disclosure |
| `.ttool`, `.zoom`, `.tip` | `src/components/editor/Timeline.tsx` (`.timeline__toolbar`, `.timeline__zoom`, `.zoom-step`), `src/components/Tooltip.tsx` (new) | icons only, magnet toggle, zoom-fit, portal tooltips |
| `.heads`, `.th*` | `Timeline.tsx` (`.timeline__labels`, `.track-label`) | 160px headers with strip, icon, name, eye/lock or speaker/lock |
| `.ruler`, `.ruler__lbl` | `Timeline.tsx` (`.ruler`, `.ruler__label`) | tick hierarchy, HH:MM:SS:FF with dimmed leading groups, label suppression |
| `.lane*`, `.clip*`, `.wave`, `.film` | `Timeline.tsx` (`.clip*`, `.filmstrip`, `.waveform`) | fixed per-kind heights, tinted clips, label chips, Glow selection |
| `.playhead`, `.snap`, `.snap__flag` | `Timeline.tsx` (`.playhead`, `.playhead__head`, new snap line) | 1px Ember line + pentagon head, Paper snap line + flag |
| `.ctx*` (spec only) | `src/components/ContextMenu.tsx` (`.ctx-menu*`) | overlay surface, 28px items, shortcut column |

Icons: all brand-kit SVGs are used as-is (`folder, templates, text, captions, music, voiceover, auto-cut, one-click (Magic), undo, redo, help, export, import, add, play, split, speed, volume, reframe, filters, effects (sparkle on credits), zoom-in, delete`). Drawn in the same hand for the mock and to add to `src/assets/icons/` + `IconName`: `boost, more, chevdown, chevright, check, reset, search, eye, unlock, speaker, magnet, cursor, stepback, stepfwd, skipstart, skipend, fullscreen, safezone, video, close, zoomout, zoomfit` (paths are in the mock's `<defs>`).

---

## 7. Do-not list (from the rejected screenshots)

1. **No wall of collapsed sections.** The rejected inspector (`anup-rejected-sections.png`) was six rows of chevron + text (Speed / Transition in / Speed ramp / Colour / Background / Clean up voice). A section is never a bare chevron plus a word; groups 1–4 are always open and have an icon, a control and (where useful) a one-line outcome or helper.
2. **No greyed-out choices that look broken** ("Follow the speaker", "Switch to whoever's talking", "Show both speakers" at low contrast). Locked options show a neutral Pro chip on the tile and stay at normal contrast; a disabled state uses `#5C5B66` text with no opacity.
3. **No centred underlined download link** ("Recognise people after camera cuts"). No blue or underlined links anywhere.
4. **No 140px inspector head** (eyebrow + 18px title + mixed-format meta). 36px header.
5. **No double indentation** (section padding plus panel padding). Sections own the padding; children have none.
6. **No bare sliders without a value field, unit or reset.** Every numeric property is a 28px scrub field with the unit inside and a slider beside it.
7. **No "Find speakers · Pro" button** standing in the middle of the choices. Pro is a chip on the choice itself.
8. **No Ember on anything but Export and the playhead.** Not on selection rings, Pro badges, progress bars, toggles, mic props or chips. Selection and focus are Glow; progress is Paper.
9. **No toast over the frame or over the transport.** The stage keeps a gutter; the toast sits bottom-right beside or above the transport.
10. **No codecs, bitrates or file extensions on the surface** ("H264 · AAC", ".mp4"). Meta is `HD · 30 fps · 1:32`; the rest lives in a tooltip.
11. **No 52px white play button with a shadow, no undo/redo glyphs for skip.** 40px neutral play; frame-step icons.
12. **No saturated clip fills with a solid colour label pill, no 4px Paper selection ring.** 20% tint + 55% border, dark label chip, 1px Glow ring.
13. **No empty 40px track rows** for Text/Captions; fixed per-kind heights (24/24/52/34/34).
14. **No ruler without frames, no "0:10" labels, no last label clipped at the right edge, no label under the playhead head** (suppress it).
15. **No muted-speaker glyph as the default audio track icon.** Speaker = audible; the crossed glyph means muted.
16. **No caption chips truncated to "T…" / "wron…".** Group words until a chip holds a readable phrase; drop the label before it becomes noise.
17. **No shortcut chips on controls a beginner sees first** ("Alt M" on More settings, "Razor C" in the toolbar). Shortcuts live in tooltips only.
18. **No centred "ADVANCED" caption over left-aligned rows.** Left-aligned caption with a trailing hairline.
19. **No inspector that opens pre-scrolled** so the first group is cut. It opens at the top; "More settings" is closed by default; a scrolling body gets the 40px edge fade.
20. **No 10–20px radii, 18px panel titles, 14px body text or 36px controls in the editor shell.** 4–6px radii, 13px titles, 12px text, 28px controls.
