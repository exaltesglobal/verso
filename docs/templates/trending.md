# Verso — "Trending" pack (8 original templates)

Original designs by Agape Labs for Verso. Every template here is described generically by format and technique; none reproduces a third-party template or references another editor's asset names. Built for India-first creators and YouTubers who are not technical: drop footage into slots, swap the placeholder text, export.

Revision 2. Changes from the first draft: timing math fixed in Twenty Seconds, Wide Frame and Word Storm; letterbox redesigned for 9:16; engine dependencies made explicit with fallbacks; loudness spec moved to LUFS; safe zone gains a top margin; thin templates strengthened with trending variants (chat-bubble POV, photo dump, shaadi highlight, 16:9 cold open and end screen) without changing the template count.

## Pack-wide scaffold (applies to all 8)

- Canvas default 9:16, 1080x1920, export H.264 30fps. Variants noted per template.
- Safe-zone guide always visible in the editor, expressed as % of canvas: top 10% (platform header, notch overlap), bottom 20% and right 12% (platform UI). Text layers snap out of these areas unless the user drags them in deliberately. "Top safe zone" in this document means the band from 10% to 22% of canvas height.
- Three text styles with distinct size/colour so a viewer can tell them apart: Headline (largest, bold), Point (medium), CTA (smallest, accent colour). Text size floor 56px at 1080 width.
- Hook slot auto-capped at 3s. Duration presets per family: Micro 6-15s, Standard 21-34s, Educational 30-60s.
- All timing in this document is given two ways: as a beat index on the mood tag's grid (authoritative; survives BPM changes) and as seconds at the stated default BPM (for reading). Fixed-length templates with no beat grid use % of template length so the layout survives duration changes.
- Hinglish placeholder copy ships by default on India-targeted templates with a one-click English / Hindi / Hinglish swap. Devanagari-capable OFL fonts (Noto Sans Devanagari, Hind, Mukta, Baloo 2, Yatra One) are paired with the Latin display font wherever Hindi/Hinglish text may appear.
- Fonts: OFL only, all bundled from the Google Fonts OFL releases. Bebas Neue is pinned to the Google Fonts OFL release of "Bebas Neue"; the foundry's commercial "Pro" family is never substituted. Emoji in stickers render with Noto Color Emoji (OFL), never platform glyph images, so baked exports look the same everywhere.
- Effects discipline: no more than two stacked looks per clip (LUT + grain, or LUT + letterbox; never all at once). LUT 60-80%, grain 10-20%, vignette 15-25%, light leak 400-600ms on at most 1-2 transitions.
- Look assets: every .cube LUT, grain plate and light-leak/flare element in this pack is authored in-house or generated procedurally by the engine. No third-party LUTs, stock grain scans or stock leak footage are shipped. Look names ("Clean Punch", "Soft Face", "Flat Grey", "Moody Night", "Silver", "Gritty", "Warm Filmic", "Muted Green", "Indoor Warm Film", "Teal-Orange") are Verso's own and describe the result, not a source.
- Speed-ramp floor: 0.5x minimum on media at 30fps or below; 0.25x permitted only when the source is 60fps or higher. The engine reads source fps and clamps the curve automatically, and the template shows the clamp in the inspector so the creator knows why.
- Audio bus defaults: VO peaks -6 dBFS; music -24 dBFS under VO with 6-10 dB auto-duck (50-100ms attack/release), -12 dBFS in no-VO templates; SFX -22 dBFS, under 300ms, no more than three SFX in any Micro template; music auto-fades over the final 20%; master loudness target -14 LUFS integrated with a -1 dBTP true-peak ceiling.
- Loop-safe flag on short templates: first and last frame share crop state and no outro card.
- Music: CC0 or the creator's own only. Mood tags drive the beat grid. The bundled mood library is sourced strictly CC0 or produced in-house, with licence metadata per track; the mood tags "slowed-reverb" and "cinematic-trap" describe tempo and texture of in-house tracks only. There is no "trending sound" or platform-audio import path in Verso; the only media inputs are the creator's own files and the bundled library.

### Engine dependencies beyond the base capability list

The base engine offers 9:16/1:1/16:9 canvases, video slots with one-drag swap, text animation presets (pop, typewriter, slide, blur-in, karaoke), .cube LUTs, grain, vignette, letterbox bars, procedural light leak/flare, transitions (cut, crossfade, dip to black, slide, zoom), speed ramps, freeze frames, beat-synced cuts, music mood tags and stickers/emoji. This pack additionally requires the following small additions, each with a fallback if it ships later:

| Addition | Used by | Fallback if absent |
|---|---|---|
| Clip scale/position keyframes (two-point "Ken Burns": start scale/offset, end scale/offset, linear or ease) | One-Liner drift, Twenty Seconds photo push, Wide Frame push-ins, Straight Talk punch-ins, Drop Walk push, Word Storm payoff drift | Static framing; punch-ins use the `zoom` transition at the cut instead |
| Shape primitive (rectangle with fill, radius, opacity) and a length-driven progress-bar mode | Five Things progress bar, chat bubbles in One-Liner, end-screen placeholders in Word Storm | Progress bar ships as a 60-frame prerendered sticker sequence; bubbles as 9-slice stickers |
| Per-layer rotation on text layers (static angle, -15 to +15 degrees) | Word Storm, One-Liner "Sign" variant, Photo Dump polaroid frames | Rotation fixed at 0 |
| Procedural backdrop generator (dark paper / concrete / gradient noise) | Word Storm default backdrop | Bundled 10s CC0 loop authored in-house |
| Sidechain auto-duck on the music bus | All VO templates | Fixed -24 dBFS music level under VO |
| Loudness normalisation (integrated LUFS + true-peak) on the master | All | Peak normalisation to -3 dBFS with a warning badge |

Explicitly NOT assumed: speech-to-text. Karaoke captions in this pack are typed by the user in the caption panel (2-5 words per line); the engine distributes word timings evenly across the line's duration by syllable count and the creator nudges them on the beat ruler. An optional Hinglish/code-switched ASR plugin can prefill words and timings later; it is a separate dependency and no template breaks without it. Likewise, jump cuts are user-placed markers (silence detection is optional and not assumed), and dialogue levelling is simple peak normalisation rather than a compressor.

Free/Pro split: 5 Free, 3 Pro. Pro templates are the ones that lean on the grading stack (LUT + grain + letterbox + light leak + speed ramps).

---

## 1. One-Liner

**Tier:** Free  |  **Family:** Micro  |  **Purpose:** The text-hook micro-reel. One honest, funny or spicy line over calm footage, built to loop. Three modes: "Line" (one line, optional punchline), "Sign" (line pinned to a point in frame), and "Chat" (a POV text-conversation that stacks bubbles one by one). The cheapest reel a creator can make.

- **Canvas:** 9:16 (1:1 variant available).
- **Duration:** 8s default (6-15s range). Loop-safe in Line and Sign modes; Chat mode is loop-safe when the bubbles clear on the final frame (toggle).
- **Slots:**
  1. `Calm B-roll` — full length. Low-motion footage: making chai, walking a street, static selfie, an over-the-shoulder phone shot for Chat mode. Fills the whole clip.
- **Timing beats (% of template length; no beat grid):**
  - 0% — footage starts; clip keyframes 1.00 -> 1.05 scale across the full clip for life (static if keyframes unavailable).
  - 0-4% — Headline pops in and holds (Line / Sign).
  - 60% — optional Punchline hard-cuts in below the headline (Line "Two-liner" variant).
  - Chat mode: bubbles enter at 10% / 30% / 50% / 70% (3-4 bubbles, alternating left grey "them" and right accent "me"), each with `pop` 220ms and a short typing-dots shape (three dots, 600ms) before the reply bubble. Final bubble is the punchline; optional 90% CTA.
  - 100% — ends on the same frame-state it opened on so the replay is seamless.
- **Text layers:**
  - Headline: 6-8 words, 2 lines max, centred, `pop` (280ms). Soft rounded semi-opaque box behind (shape primitive). Font: Poppins ExtraBold (Latin) / Hind Bold (Devanagari). Default colour warm yellow `#FFD84D` on the "Confession" preset, white on "Hot take". Placeholder: "Sach bolun? Main sun hi nahi raha tha."
  - Punchline (optional): 3-6 words, `pop` at 60%, white, slightly smaller. Placeholder: "...aur phir bhi haan bol diya."
  - Sign mode: Headline moves to the top safe zone with -3 degree rotation and a small arrow sticker pointing down-frame; CTA "Comment karo" in accent at 70% height.
  - Chat mode: bubble text Poppins Medium / Hind Medium 56px, max 12 words per bubble, "them" bubbles `#2B2B2B` at 85% opacity with white text, "me" bubbles accent `#1E90FF` with white text; name chip above the first bubble (Inter Medium, small). Placeholders: "Kal office aa raha hai?" / "Haan... (nahi)". Bubbles stack upward from 65% height so they never enter the bottom UI zone.
  - CTA (optional): small accent line at 90%.
- **Colour / LUT / overlays:** Optional "Warm Filmic" LUT at 40% (off by default). No grain, no letterbox. Nothing competes with the text.
- **Transitions:** None (single slot). Punchline and bubbles enter by hard cut/pop.
- **Music mood tag:** `chill-lofi` (Confession, Chat) or `deadpan-dramatic` (Hot take). -12 dBFS, no VO expected. SFX: Chat mode only, one soft tick per bubble at -26 dBFS (max 4).
- **Thumbnail animation:** The yellow line pops onto a softly moving chai-pouring clip and holds; at 60% a second smaller line snaps in beneath it. Chat preset: three bubbles stack up the frame with typing dots between them.
  Loop-safe preview: the card repeats without a visible seam.

---

## 2. Twenty Seconds

**Tier:** Free  |  **Family:** Standard  |  **Purpose:** Beat-synced rapid-fire recap: a day, a trip, a week, a quarter of wins. One word per cut landing on the beat. The creator's camera roll supplies the content; the beat grid supplies the structure. Includes a "Photo Dump" mode for all-stills slideshows with per-photo captions.

- **Canvas:** 9:16 (1:1 variant).
- **Duration:** 20s default (15-30s range). Slot count recomputes from duration: one slot per bar.
- **Slots:** 10 slots, one per bar (4 beats each), snapped to downbeats. At 120 BPM a bar is 2.0s, so 10 slots fill 20.0s exactly. Slot 1 is the framing slot (hook), slot 7 is the designated Hero slot (lands on the drop; the engine moves the Hero to whichever bar the track's drop marker falls in, default bar 7), slot 10 is the closer. Mixed photo + video accepted; photos get an automatic 1.00 -> 1.06 clip-keyframe push (static if unavailable).
  - Photo Dump mode: same grid at half speed (one slot per 2 bars, 5 slots at 20s or 10 at 40s), photos sit inside a white 4% border "print" frame with alternating -2 / +2 degree rotation over a blurred copy of the same photo as backdrop; per-photo caption in a lower-middle label; music `chill-lofi` or `indie-acoustic`.
- **Timing beats (beat index on the mood tag's grid; seconds at 120 BPM default):**
  - Beat 0 (0.0s) — Hook line pops over slot 1 ("Yeh hafta 20 second mein").
  - Every bar downbeat (beats 4, 8, 12, ... ; 2.0, 4.0, 6.0s ...) — cut; one word pops with each cut.
  - Beat 24 (12.0s) — Hero slot 7: `zoom` transition in, speed ramp 0.7x for its first 2 beats then back to 1.0x.
  - Beat 36 (18.0s) — Closer slot 10; summary line pops.
  - Final 20% (beats 32-40, 16.0-20.0s) — music auto-fade; CTA exits by beat 39.
- **Text layers:**
  - Headline (hook, slot 1): `pop`, Montserrat Black / Mukta ExtraBold, white with 4px dark outline, top safe zone. Hold one bar.
  - Point (per-cut word): 1-3 words, `pop` on each downbeat, centred at 28% height, alternate white / accent yellow for rhythm.
  - CTA (closer): "Save karo, next week bhi" in accent, `slide` in from bottom on the closer's downbeat, exits one beat before the end.
  - Photo Dump caption: Inter Medium / Hind Medium 56px, lower-middle label on a semi-opaque pill, one per photo.
- **Colour / LUT / overlays:** Optional "Clean Punch" LUT at 50% (mild contrast lift, skin protected, baked into the .cube). No grain. Nothing that slows the eye.
- **Transitions:** `cut` on every bar; `zoom` only into the Hero slot. One short sharp whoosh straddling the zoom. Photo Dump: `crossfade` 6 frames.
- **Music mood tag:** `upbeat-energetic` (110-130 BPM). Two bass hits max: one on the hook, one on the Hero cut.
- **Thumbnail animation:** Six fast cuts flash by with a single word snapping in on each; the sixth cut zoom-punches into a hero shot.
  Reads as motion even at thumbnail scale because the words change colour on alternate beats.

---

## 3. Wide Frame

**Tier:** Pro  |  **Family:** Standard  |  **Purpose:** The cinematic travel / vlog / wedding edit. Thin letterbox bars, one film-style grade, grain, a slow build that lands on the drop, one speed ramp and one freeze frame. Signals production value for travel, lifestyle and shaadi creators. Includes a "Shaadi Cut" preset for wedding and engagement highlights.

- **Canvas:** 9:16 with letterbox bars expressed as % of canvas height. Default "Tall Cinema": 12% bars top and bottom (content 1080x1459, roughly 3:4, 76% of the screen stays picture). Options 10% / 12% / 15% / 20% (20% gives a near-1:1 window). Pure black bars with optional 5% feathered edge. True cinema ratios (1.85:1 / 2.39:1) are offered only on the 16:9 export, which is available for landscape source footage only; 9:16 source stays 9:16.
- **Duration:** 24s default (18-30s range). Slot durations scale proportionally with the duration slider; the end card is capped at 1.0s regardless.
- **Slots:** 7 slots, filling the timeline with no gaps.
  1. Establishing — 3.0s (0.0-3.0), static or slow clip-keyframe push 1.00 -> 1.03.
  2. 2.0s (3.0-5.0)   3. 2.5s (5.0-7.5)   4. Hero — 4.0s (7.5-11.5): speed ramp from the floor (0.5x on <=30fps media, 0.25x on 60fps+) to 1.0x over the first 2.0s, then freeze frame 0.6s ending at the slot's end marker   5. 3.0s (11.5-14.5)   6. 3.0s (14.5-17.5)   7. Closer — 5.7s (17.5-23.2), dip to black at its end.
  End card — 0.8s on black (23.2-24.0).
- **Timing beats (seconds at 24s default; music drop is detected and slot 1 stretches/trims to land the cut on it):**
  - 0.0s — fade in from black (600ms).
  - 1.2s — Title blur-in, held to 3.0s.
  - 3.0s — beat drop; cut to slot 2 with a light-leak flash (500ms).
  - 7.5s — slot 4 Hero enters at the speed floor, ramps to 1.0x by 9.5s; freeze frame 10.9-11.5s with location lower-third.
  - 11.5s — dip to black (chapter break, 400ms) into slot 5.
  - 17.5s — second light-leak flash into slot 7.
  - 23.2s — dip to black (300ms); date/location end card holds 0.8s to 24.0s. Creators who want zero black can toggle "no end card" and slot 7 runs to 24.0s.
- **Text layers:**
  - Title: wide-tracked uppercase, Cormorant Garamond SemiBold (Latin) / Yatra One for Devanagari variant, tracking +18%, `blur-in` 800ms, bone white `#F3EEE4`. Locked to the inner picture area and below the top safe zone.
  - Lower-third (location + date): Inter Medium small caps, `typewriter`, left-aligned at 62% height, exits after 2.5s.
  - End card: location + date centred on black, `blur-in`, 0.8s.
  - Shaadi Cut preset: title becomes "Names + date" in Cormorant Garamond with a thin gold rule (`#C9A961`) below, Devanagari variant in Yatra One; placeholders "Riya & Arjun" / "12.02.2026".
- **Colour / LUT / overlays:** Default bundle "Warm Filmic" (warm highlights, gentle lifted blacks, slightly muted greens; tuned for India daylight and skin tones): LUT 70%, grain 15% (screen blend, scaled to canvas), vignette light (18%). Alternates: "Muted Green" (cool-neutral mids, desaturated foliage, grain 12%), "Indoor Warm Film" (warm LUT 60%, grain 12%, letterbox off, soft light leak), "Moody Night" (cool LUT 75%, grain 20%, strong vignette, dip-to-black only), and "Teal-Orange" (classic contrast grade, offered but not default). Shaadi Cut uses "Warm Filmic" at 60% with grain 10% so reds and golds stay clean. Light leak warm amber, 2 instances max.
- **Transitions:** `crossfade` (14 frames) between most slots, `dip to black` at the two chapter breaks, hard `cut` on the drop. No slides or zooms — they look cheap inside bars.
- **Music mood tag:** `cinematic-slowed` (70-90 BPM, still intro, drop at ~3s); Shaadi Cut defaults to `cinematic-warm-strings`. Music -12 dBFS, no VO. Riser 1s before the Hero freeze; impact on the freeze frame.
- **Thumbnail animation:** Thin black bars slide in top and bottom, a wide-tracked title blurs into view over a slow push-in, then a warm light-leak flash cuts to a slow-motion hero shot.
  The warm filmic grade and grain are visible even in the small card.

---

## 4. Snap Reveal

**Tier:** Free  |  **Family:** Micro  |  **Purpose:** The dramatic before/after transition. The cut is the hook. Works for outfits, home decor, rangoli, fitness, food plating, product unboxing, GRWM. Includes "world stop" freeze, colour-reveal, inset-frame and "Triple Reveal" (three transformations in one reel) variants.

- **Canvas:** 9:16.
- **Duration:** 10s default (7-15s range).
- **Slots:**
  1. `Before` — 3.5s (35%). Optional desaturated LUT (colour-reveal variant) or shown in a horizontal 16:9 inset over a blurred fill (inset variant).
  2. `After` — 6.5s (65%) full colour, speed ramp 0.8x for the first 1.5s then 1.0x.
  - Triple Reveal variant: three Before/After pairs of 1.5s + 2.5s each (12s), reveals snapped to the track's three strongest beats; labels cycle "1 / 2 / 3".
- **Timing beats (% of template length; the reveal snaps to the nearest strong beat):**
  - 0% — the Before label pops (default), OR the optional "Wait for it..." headline pops instead. The two are mutually exclusive: enabling the headline hides the Before label so only one text element opens the reel.
  - 31% — optional freeze frame 0.4s ("world stop").
  - 35% — beat-drop marker: hard cut with light-leak flash (450ms) OR `zoom` punch OR `slide`, user picks. Impact SFX exactly on the cut frame.
  - 36% — After label pops in the accent colour.
  - 85% — optional CTA slides in.
  - 100% — end (loop-safe when CTA disabled).
- **Text layers:**
  - Before/After labels: Anton (Latin) / Baloo 2 ExtraBold (Devanagari), `pop`, top safe zone, white then accent. Hinglish placeholders: "PEHLE" / "BAAD MEIN".
  - Headline (optional, replaces the Before label): "Wait for it..." style line, 4-6 words, Poppins Bold, held 2.5s.
  - CTA: "Kaunsa better laga?" small accent line, `slide` in at 85%.
- **Colour / LUT / overlays:** Before slot: "Flat Grey" LUT at 100% (colour-reveal variant only). After slot: "Clean Punch" LUT 55%. Procedural light leak on the reveal cut. No grain.
- **Transitions:** One transition only, at the reveal (three in Triple Reveal). Options: `cut` + flare, `zoom`, `slide`. Everything else is static.
- **Music mood tag:** `beat-drop-hype`. The engine aligns the reveal to the first strong drop marker in the track.
- **Thumbnail animation:** A grey, still "before" frame freezes for a heartbeat, then a flash of amber light snaps to the full-colour "after" with the label popping in.
  Preview loops the 2 seconds around the cut so the payoff is always visible.

---

## 5. Straight Talk

**Tier:** Free  |  **Family:** Standard  |  **Purpose:** Talking-head storytime / explainer with a headline hook and word-by-word karaoke captions. For the unscripted selfie video, the "yap", the hot-take-to-camera, the Hinglish educational rant. Punch-in rhythm hides jump cuts and keeps the frame alive.

- **Canvas:** 9:16 (also a stacked 2-up variant for a reaction clip: top 60% source, bottom 40% creator).
- **Duration:** 30s default (20-45s range). All beats below are % of template length so they hold across the range.
- **Slots:**
  1. `Selfie` — single continuous talking-head slot, subject centred, framed close. Jump cuts are user-placed markers on the ruler (one click at each pause); the engine trims between paired markers.
  2-4. `Cutaway` — three optional 2s B-roll slots that overlay the selfie at user-placed markers (crossfade 8 frames in/out).
- **Timing beats (% of length; seconds at the 30s default in brackets):**
  - 0% — clip starts mid-sentence on the strongest line; Headline pops at frame 0.
  - 0-12% (0-3.5s) — Headline holds, then fades over 300ms.
  - Every ~3-4s — alternating punch-ins: clip keyframes 1.00x -> 1.15x over 6 frames at a jump-cut marker; back out at the next. Fallback without keyframes: `zoom` transition (6 frames) at the cut and static 1.0x framing.
  - 50% (15s) — one caption-position shift (lower-middle -> middle) as a pattern interrupt.
  - 90% (27s) — CTA "Save this" sticker pops; captions keep running.
  - 100% — ends on the last strong line (no outro card; loop-friendly).
- **Text layers:**
  - Headline: 6-8 words, Montserrat ExtraBold (Latin) / Noto Sans Devanagari Bold, in the top safe zone (top edge at 10% of canvas), white on 60% dark gradient band, `pop` at 0s. Formula: [exact claim] | [topic]. Placeholder: "Yeh 1 galti aapka reach kha rahi hai".
  - Karaoke captions: 2-5 words on screen, typed by the creator per line in the caption panel (or prefilled by the optional ASR plugin), Poppins Bold 56-60px, white fill with 4px dark outline, active word in one accent (default saffron `#FF8A3D`) with 6% scale-up. Word timings distributed by syllable count across the line and nudgeable on the ruler. Lower-middle zone (50-78% height). Key phrases only, never the full transcript.
  - CTA: "Save karo" + bookmark emoji sticker (Noto Color Emoji), accent, `pop` at 90%.
  - Lower-third (optional): name + handle, Inter Medium, `slide` in from left at the speaker's first line, auto-out after 3s, 62% height.
- **Colour / LUT / overlays:** Neutral skin-safe LUT at 35% ("Soft Face"). Optional light vignette 12% to lift the face. No grain, no letterbox — clarity wins.
- **Transitions:** `cut` at jump points, `zoom` (6 frames) on punch-ins when keyframes are unavailable, `crossfade` on B-roll overlays.
- **Music mood tag:** `none` by default; optional `lofi-bed` at -26 dBFS with 8 dB sidechain duck under speech. Dialogue peak-normalised to -6 dBFS; master to -14 LUFS / -1 dBTP.
- **Thumbnail animation:** A headline band pops above a centred face while two or three caption words light up one by one in saffron; the frame punches in 15% mid-sentence.
  The active-word highlight ticking along is the tell that this is the captions template.

---

## 6. Five Things

**Tier:** Free  |  **Family:** Educational  |  **Purpose:** The save-worthy numbered listicle, Hinglish-first. Problem hook -> 3-5 numbered points -> save CTA. Fixed count gives viewers a visible finish line; a thin top progress bar makes the finish line literal. Also drives "3-step framework" and "5 things worth the money" formats.

- **Canvas:** 9:16.
- **Duration:** 36s default (30-60s range); count picker 3 / 4 / 5 recomputes slot lengths.
- **Slots:**
  1. `Hook` — 3.0s (auto-capped). Talking head or B-roll.
  2-6. `Point 1-5` — 6.0s each (range 5-8s). B-roll or talking head; one-drag swap.
  7. `Outro` — 3.0s.
- **Timing beats (seconds at the 36s / 5-point default; the engine recomputes from count and slot length):**
  - 0.0s — progress bar appears (shape primitive in progress mode: 8px tall, accent fill over a 30% white track, placed at 10% of canvas height so it clears the platform header); Hook text typewrites in across 1.2s and holds.
  - 3.0s — `slide` to Point 1; numbered badge sticker drops into the top-left corner at 12% height (inside the top safe zone, outside the right-side UI zone), point text slides in from the right.
  - 9.0 / 15.0 / 21.0 / 27.0s — `slide` to each next point; badge increments, previous text exits left.
  - 20.0s — optional curiosity tease sticker: "#4 sabse best hai".
  - 33.0s — Outro: "Save karo" sticker + bookmark icon pop; progress bar completes.
  - 36.0s — end.
- **Text layers:**
  - Headline (Hook): 6-8 words, Poppins ExtraBold / Hind Bold, centred, white on semi-opaque rounded box, `typewriter` (or `pop` via toggle). Placeholder: "Yeh 5 galtiyan mat karo pehle saal mein".
  - Point: one line per point, Montserrat SemiBold / Hind Medium, `slide` in from right, left-aligned at 62% height beside a numbered badge sticker (1-5, accent fill, white numeral in Baloo 2).
  - CTA: "Save karo" small accent line + bookmark emoji sticker (Noto Color Emoji), `pop`.
  - Optional comment-bait (Outro alt): "Aap kya add karoge?"
  - Karaoke captions toggle for talking-head points, same style and same typed-word workflow as Straight Talk.
- **Colour / LUT / overlays:** "Soft Face" LUT 35% on talking-head slots, none on B-roll by default. No grain. Progress bar is the shape primitive's progress mode in the caption accent colour (prerendered sticker sequence as fallback).
- **Transitions:** `slide` between points (10 frames, sharp whoosh straddling each), `cut` from Hook, `crossfade` into Outro.
- **Music mood tag:** `calm-focus` (mid-tempo, 85-100 BPM), -24 dBFS under VO with sidechain duck; beat-synced cut option snaps point changes to the nearest downbeat.
- **Thumbnail animation:** A hook line types itself out while a thin bar starts filling along the top; the frame slides left as a "1" badge drops in with its point line.
  Badge counts to "2" before the preview loops so the numbered structure is obvious.

---

## 7. Drop Walk

**Tier:** Pro  |  **Family:** Micro  |  **Purpose:** The slowed-beat "main character" showcase: near-still opening, then movement exactly on the drop. For outfit walks, product spins, car and street reels, the no-face-reveal "calm founder" POV. Minimal text; the grade and timing do the work. Includes the single-shot hero speed-ramp curve.

- **Canvas:** 9:16.
- **Duration:** 12s default (10-15s range).
- **Slots:**
  1. `Still` — 3.0s near-static at 0.6x with a slow clip-keyframe push 1.00 -> 1.04 (static if unavailable).
  2. `Move` — 5.0s hero slot (walk / orbit / spin) with a 100% -> floor -> 100% speed curve centred on the slot's midpoint marker; the floor is 25% on 60fps+ media and 50% on 30fps or lower (engine reads source fps and clamps; the inspector shows which floor applied). Creator drags footage so the key instant sits on the marker.
  3. `Second move` — 4.0s at 0.8x (optional; drop to make a 2-slot 8s version).
- **Timing beats (seconds at the 12s default; slot 1 stretches/trims so the cut lands on the detected drop):**
  - 0.0s — slot 1 at 0.6x with the slow push.
  - 2.0s — riser begins (1s) and stops dead on the drop.
  - 3.0s — drop marker: hard `cut` (default) or `zoom` into slot 2 at 1.0x; impact on the cut frame.
  - 4.9-6.1s — speed dips to the floor around the midpoint marker; optional freeze-frame + title pop at the slowest point.
  - 8.0s — `crossfade` (10 frames) into slot 3 at 0.8x.
  - 9.5s — optional small-caps line slides in at bottom-third centre (above the UI zone).
  - 12.0s — ends; music fades over the final 2.4s.
- **Text layers:**
  - Point (only text, optional): 3-5 words, Oswald Medium small caps / Mukta Medium, tracking +8%, bone white, `slide` in from below, 65% height. Placeholder: "main character energy". No headline, no CTA — caption carries it.
  - Freeze title (optional): Bebas Neue (Google Fonts OFL release), `pop` with 104% -> 100% settle, on the frozen frame only.
- **Colour / LUT / overlays:** "Moody Night" bundle default: cool-shadow cinematic LUT 60%, grain 12%, vignette 22%. Alternates: "Silver" (a bleach-bypass look baked into its .cube — desaturated with skin tones held warmer; no runtime HSL controls) with grain 18%, vignette 20% for street / fitness / motorsport; "Warm Filmic" mid strength for daylight (default daylight choice); "Teal-Orange" mid strength as an optional alternate. No letterbox (keeps the frame full-bleed for the walk).
- **Transitions:** `cut` or `zoom` on the drop, `crossfade` into the third slot, nothing else. One whoosh, one impact, done.
- **Music mood tag:** `slowed-reverb` / `cinematic-trap` from the in-house library only (drop detected automatically; template realigns slot 1 length to hit it).
- **Thumbnail animation:** A dim, nearly still frame creeps forward, then on a visible beat flash cuts to a figure mid-stride that slows to a crawl and snaps back to speed.
  Grain shimmer and the cool-shadow grade make it read as "graded film" rather than "filtered clip".

---

## 8. Word Storm

**Tier:** Pro  |  **Family:** Micro  |  **Purpose:** Kinetic typography opener / standalone quote reel. Single words land on beats with scale and rotation variation, over a dark textured background or heavily vignetted B-roll, ending with the payoff line held under a flare. Carries the whole message for muted viewers. Use as an intro to prefix any reel, as a motivation / manifesto / finance-quote reel on its own, or in 16:9 as a YouTube cold open or end screen.

- **Canvas:** 9:16; 16:9 variants "Cold Open" (intro, 10s) and "End Screen" (20s; payoff line sits in the top 30% and two 16:9 shape placeholders at 20% opacity mark the regions where the platform's end-screen elements will be placed: a 1/3-width square at left for a channel element and a 1/3-width rectangle at right for a video element, both in the lower half; these placeholders are guides and are excluded from export).
- **Duration:** 10s default (8-15s range). Timing is on the beat grid; the engine rescales word count to the duration (one word per beat, stack clears every 5 beats, payoff on the first downbeat after the last word plus one beat of air).
- **Slots:**
  1. `Backdrop` — full-length single slot. Default is a procedural dark textured backdrop (dark paper / concrete / gradient noise; bundled in-house CC0 loop as fallback), no media needed; drop B-roll to replace it and the template adds a 30% vignette automatically.
- **Timing beats (beat index at 128 BPM, one beat = 0.469s; 10s = 21.3 beats):**
  - Beat 0 (0.0s) — fade in 300ms; grain visible from frame 0.
  - Beats 1-4 (0.47-1.88s) — words 1-4 enter on consecutive beats.
  - Beat 5 (2.34s) — hard cut with light-leak flash (450ms): stack clears.
  - Beats 5-9 (2.34-4.22s) — words 5-9 enter.
  - Beat 10 (4.69s) — second flash, stack clears.
  - Beats 10-14 (4.69-6.56s) — words 10-14 enter.
  - Beat 15 (7.03s) — one beat of air; riser runs under it.
  - Beat 16 (7.50s, bar 5 downbeat) — payoff line enters largest with `zoom` transition on the backdrop and a procedural flare overlay blooming from behind it; bass hit on its first visible frame.
  - Beats 16-21.3 (7.5-10.0s) — payoff holds; subtle 1.00 -> 1.03 clip-keyframe drift (static if unavailable); optional CTA at beat 19 (8.9s).
  - 10.0s — dip to black (Cold Open hands off to the next clip here; End Screen extends the hold to 20s with no dip).
  - Words alternate `pop` / `slide` / `blur-in` presets, each with scale 92-108% and rotation -4 to +4 degrees (per-layer rotation) drawn from a seed so the layout is repeatable; fallback without rotation uses scale variation only.
- **Text layers:**
  - Point (words 1-14): single words, Bebas Neue (Google Fonts OFL release) / Anton / Oswald selectable (Latin), Baloo 2 ExtraBold or Yatra One for Devanagari, white and one accent (default crimson `#D7263D`, alternates amber, teal). Hinglish placeholders: "KAAM / KARO / ROZ / BINA / BAHANE / RUKNA / NAHI / SOCHNA / KAM / KARNA / ZYADA / AAJ / ABHI / SHURU".
  - Headline (payoff): 3-6 words, 1.6x the word size, `pop` with 104% -> 100% settle, white, held to the end. Placeholder: "RESULT APNE AAP AAYEGA". End Screen placeholder: "AGLA VIDEO YAHAN" with a small arrow sticker toward the right placeholder.
  - CTA (optional): small accent line at beat 19, `slide`. End Screen CTA default: "Subscribe karo" above the left placeholder.
  - Karaoke captions disabled by default (toggle available, low-contrast style).
- **Colour / LUT / overlays:** Heavy grain 20% (overlay blend), vignette 30% when B-roll is present, "Gritty" grade (desaturated, contrast curve with open mids) at 65%. Light leak x2, flare x1 on the payoff. No letterbox.
- **Transitions:** `cut` with light-leak flash at the two stack clears, `zoom` on the payoff, `dip to black` out. SFX capped at three: one whoosh on each flash and one bass hit on the payoff; word entrances are silent so the track carries the rhythm.
- **Music mood tag:** `hype-electronic` (120-140 BPM; grid recomputes). Riser 1s before the payoff; impact on its first visible frame. End Screen: `calm-focus` at -14 dBFS.
- **Thumbnail animation:** Bold single words slam in one after another, tilting and scaling slightly, on a grainy dark field; a flash clears them and the payoff line lands big under a soft flare.
  Even frozen, the stacked stencil type and crimson accent word read instantly as the kinetic-text template.

---

## Quick index

| # | Name | Tier | Family | Canvas | Default length | Key engine features |
|---|------|------|--------|--------|----------------|---------------------|
| 1 | One-Liner | Free | Micro | 9:16 (1:1) | 8s | single slot, pop text, chat-bubble POV mode, loop-safe |
| 2 | Twenty Seconds | Free | Standard | 9:16 (1:1) | 20s | 10 bar-synced slots, pop words, zoom hero, photo-dump mode |
| 3 | Wide Frame | Pro | Standard | 9:16 thin letterbox (16:9 export for landscape source) | 24s | LUT bundles, grain, light leak, speed ramp, freeze, dip to black, shaadi preset |
| 4 | Snap Reveal | Free | Micro | 9:16 | 10s | two slots, beat-locked reveal cut, flare, freeze option, triple-reveal variant |
| 5 | Straight Talk | Free | Standard | 9:16 (2-up variant) | 30s | typed karaoke captions, headline band, punch-in rhythm, B-roll cutaways |
| 6 | Five Things | Free | Educational | 9:16 | 36s | numbered badge stickers, slide transitions, progress bar, Hinglish copy |
| 7 | Drop Walk | Pro | Micro | 9:16 | 12s | fps-aware speed curve hero, drop-aligned cut, moody/silver/warm-filmic bundles |
| 8 | Word Storm | Pro | Micro | 9:16 (16:9 cold open / end screen) | 10s | beat-per-word kinetic text, heavy grain, light leaks, flare payoff |
