# Verso Template Pack: Business and Promo

Eight original templates for small businesses, D2C brands, founders and service creators in India. Every template is built from Verso engine primitives only (video slots, text layers with animation presets, LUT, grain, vignette, letterbox, procedural light leak/flare, transitions, speed ramps, freeze frames, beat-synced cuts, music mood tags, stickers). All designs are original; formats are described generically from engine primitives, never copied from another editor.

## Engine primitives used, and what this pack does NOT assume

Everything below is built from the stated engine list. Where an earlier draft leaned on features the engine does not list, the template has been rewritten to a primitive. The handful of items that would still make the pack better are collected at the end under **Engine requests (not required to ship)** so the pack ships against the engine as it is.

Rewrites made for engine fit:

- No text stroke / outline / drop shadow. Legibility comes from a rounded plate (solid colour at 50-70% opacity) behind the text, which is a text-layer background property. Plates are the house look of the pack.
- No true small caps (none of the shipped fonts carry an OpenType smcp face). "Small caps" everywhere means **uppercase + tracking** at a smaller size.
- No progress bar layer, no strike-through text style, no shape layers. Where a graphic element is needed it is a sticker from **Verso's own vector sticker set** (required assets listed per template).
- No keyframed scale "beat" on text. The accent moment on a beat is a **re-triggered pop preset** (pop has a built-in overshoot).
- No automatic ducking, no silence detection, no SFX library. Music sits at a fixed level under voice; SFX are optional cue markers the creator can fill from CC0 or own recordings (see audio defaults).
- No cross-canvas reframe. A 16:9 or 1:1 version is a **separate canvas variant file** with its own layout, shipped alongside the 9:16 file, not a second export from one timeline.
- No Devanagari digit toggle or auto-translation. Every placeholder ships three sample strings (English / Hindi / Hinglish) in the placeholder panel; the creator taps the one they want and edits it. Hindi strings render in Hind or Noto Sans Devanagari, which handle matras and conjuncts.

## Pack-wide defaults (baked into every template)

- Canvas 1080x1920 (9:16) unless noted. Export preset: 1080x1920, 30 fps, H.264.
- Safe-zone guide visible in the editor: bottom 20% (below y = 1536 px) and right 12% reserved for platform UI. Text layers snap inside it. Every text anchor in this pack is given as a numeric % of frame height, measured to the layer's bottom edge, and none exceeds 78%.
- Three distinct text styles per template: **Headline** (largest, bold), **Point** (medium, regular), **CTA** (medium, accent colour on a plate). Text size floor: 56 px for Latin, **64 px for Devanagari** (matras need the extra height). Plates around Devanagari text use line-height 1.35 and vertical padding of 28 px (versus 20 px for Latin) so a two-line Hind headline never clips.
- Hook slot auto-capped at 3 s. Every template opens with motion (slow push 1.00 -> 1.08 on slot 1) so the first frame is never static. Loop-safe templates return the push to 1.00 over the final 0.5 s so first and last frames match.
- Fonts: SIL OFL only. Shipped: Poppins, Inter, Montserrat, Cormorant Garamond, Space Mono, Anton, Oswald (Latin); Hind, Noto Sans Devanagari, Yatra One (Devanagari). Default Latin pairing Poppins (display) + Inter (body). Default Devanagari: Hind for headlines and CTAs, Noto Sans Devanagari for captions, Yatra One for display titles only.
- Music: CC0 or the creator's own only. **Slowing, pitching or reverbing a track does not change its licence**: the slowed / half-time looks in this pack apply only to CC0 or original tracks. Music auto-fades over the final 20%. Master peak -1 to -3 dBFS.
- Looks rule: **a LUT plus at most two of grain / vignette / letterbox** per clip. Procedural light leak and flare are transition effects, not looks, and do not count.
- Light leak: procedural, warm amber, 400-600 ms, used on at most two transitions per template.
- Captions: karaoke preset where speech is present, placed 50-78% frame height on a plate, never on the bottom edge.
- Stickers: only Verso's own vector sticker set (number badges, bookmark, check mark, strike line, arrow). No platform emoji sets are redistributed. If the creator wants an emoji look, they pick one from the Noto Emoji (OFL) set bundled in the sticker panel.
- Audio defaults: VO peak -6 dBFS; music -18 to -20 dBFS with VO present, -12 dBFS in no-VO cinematic templates; optional SFX cue markers (riser / impact / whoosh) at -22 dBFS, under 300 ms, at most two per template, CC0 or own only. No automatic ducking: the fixed music level plus the end fade is the whole mix.

---

## 1. Price Drop

**Purpose.** One product, one price, one reason to tap. The 7-second promo for a sale, a new SKU or a festive price. Built to loop so the price is seen twice.

**Canvas / duration.** 9:16, 7 s, loop-safe.

**Placeholder guidance (shown on the slot).** Use a **slow orbit** (turntable or hand-walk around the product) or a **static tripod** shot. Hand-held product-in-use footage will not loop cleanly; the editor warns if the first and last frames differ strongly.

**Slots.**
1. Hero product clip, 0.0-2.8 s, speed 0.8x.
2. The **same media**, 2.8-7.0 s, speed 1.0x, continuing from the frame slot 1 left off (one-drag swap fills both slots at once; they are linked).

**Timing beats.**
- 0.0 s: slot 1 plays with slow push-in 1.00 -> 1.08 across 2.8 s.
- 0.2 s: **old price** Point text pops in, centred upper-third (bottom edge at 30% height): "₹899" (placeholder) on a 60% black rounded box. Below it the Headline plate is empty for now.
- 2.8 s: beat marker. Hard cut to slot 2 at 1.0x with a 1.05x punch. Strike-line sticker slides left-to-right across the old price (0.25 s), old price dims to 50%. Headline pops in underneath with overshoot: "Ab sirf ₹499". Optional procedural flare burst on the cut frame.
- 4.5 s: CTA plate slides up from below and settles with its bottom edge at 72% height: "DM 'PRICE' / Link in bio".
- 6.5 s: push returns 1.08 -> 1.00 over 0.5 s.
- 6.6 s: text layers **fade out** over 0.3 s; frame crop matches 0.0 s so the loop is clean.

**Text layers.**
- Headline (new price): Poppins ExtraBold, 112 px, white on 70% black rounded box; preset **pop**. Uses the rupee glyph U+20B9 (present in Poppins, Inter and Hind). Hindi / Hinglish variant: Hind Bold.
- Point (old price): Inter Medium, 64 px, white on 60% black rounded box, dims to 50% on the beat; preset **pop**.
- CTA: Inter SemiBold, 60 px, charcoal on brand-accent plate (default saffron #F5A524); preset **slide** (from bottom).

**Required stickers.** Strike line (Verso vector set).

**Colour / overlays.** Product-safe grade: warm neutral LUT at 40% (skin and product colours protected). No grain, light vignette 10%. Optional procedural flare burst on the 2.8 s punch.

**Transitions.** One hard cut on the beat at 2.8 s. Nothing else.

**Music mood tag.** upbeat / festive-pop, 95-110 BPM, low bed if voiceover is present.

**Tier.** Free.

**Preview thumbnail animation.** Product drifts in slowly with the old price sitting above it.
On the beat a line strikes the old price, the new price punches in below, the CTA plate rises, and the frame loops back seamlessly.

---

## 2. Five Reasons

**Purpose.** The save-worthy listicle for a service or product: a numbered promise up top, 3-5 fast points, a save CTA. Default 5 points. Works for "5 reasons to switch", "3 mistakes customers make", "4 things our kit includes".

**Canvas / duration.** 9:16. Point length is set by **beat markers: two bars per point** (4.0 s at 120 BPM, 4.36 s at 110, 4.8 s at 100). With a 3 s hook and 3 s outro the runtime is 18 s (3 points at 120 BPM) to 30 s (5 points at 100 BPM). Default: 5 points at 120 BPM = 26 s.

**Slots.**
1. Hook slot, 3 s (talking head or hero B-roll).
2-6. Point slots, one per point, length snapped to the nearest two-bar marker (B-roll per point; one-drag swap).
7. Outro slot, 3 s (product or face, held).

**Timing beats.**
- 0.0 s: slow push on slot 1; Headline pops at 0.1 s, bottom edge at 28% height: "5 reasons log hamara X chunte hain" (placeholder). Curiosity tag Point text pops at 1.6 s under it: "#4 sabse important hai".
- 3.0 s (first downbeat after the hook): **hard cut** to slot 2 with an optional 1.05x punch on the new clip. Number badge sticker "1" pops top-left inside the safe zone with overshoot; Point line pops at +0.2 s, bottom edge at 66% height.
- Each subsequent two-bar marker: hard cut, optional punch, badge increments with a pop, new Point line. Badge for #4 uses the accent colour to pay off the curiosity tag.
- Outro marker: hard cut to slot 7. CTA pops with the bookmark sticker beside it: "Save karo, baad mein kaam aayega".
- End after 3 s outro.

**Text layers.**
- Headline: Poppins Bold, 96 px, white on 65% black rounded box, 2 lines max; preset **pop**.
- Point: Inter SemiBold, 64 px, white on 55% black rounded plate, left-aligned; preset **pop**.
- CTA: Poppins SemiBold, 60 px, charcoal on accent plate; preset **pop**.
- Devanagari: Hind for all three styles (64 px floor, taller plate padding).

**Required stickers.** Number badges 1-5 (rounded square, accent fill, white numeral) and bookmark (Verso vector set).

**Colour / overlays.** Clean neutral LUT 35%, no grain, no vignette, no progress bar.

**Transitions.** Hard cut on the beat throughout. No slides.

**Music mood tag.** upbeat / mid-tempo, 100-120 BPM; beat markers drive the cut points; karaoke captions enabled if voice present.

**Tier.** Free.

**Preview thumbnail animation.** Headline pops over the hook shot, then a hard cut lands badge "1" and its point line with a snap.
Badges 2, 3, 4 pop in on the beat (4 flashes accent) and the save CTA lands with a bookmark.

---

## 3. Before and After Snap

**Purpose.** The one-cut reveal for any transformation a business sells: renovation, cleaning, salon, detailing, packaging, website redesign. The cut is the hook.

**Canvas / duration.** 9:16. Default 10 s (before 4 s / after 6 s). **Short variant 8.5 s** (before 2.5 s / after 6 s), selectable at load; recommended for retention.

**Slots.**
1. Before, 4 s (2.5 s short). Desaturated via LUT, framed inset at 90% width to feel "smaller".
2. After, 6 s, full-bleed, full colour, speed ramp 0.85x for the first 2 s then 1.0x.

**Timing beats (default / short).**
- 0.0 s: slot 1 with slow push 1.00 -> 1.06. Headline pops at 0.1 s, bottom edge at 26% height: "Pehle" with a one-line result promise under it: "3 din mein" (Point).
- 3.6-4.0 s / 2.1-2.5 s: freeze frame on slot 1 for 0.4 s (world-stop feel). The optional riser cue runs 2.0-4.0 s / 0.5-2.5 s and **ends on the drop frame**; the freeze sits inside its last 400 ms.
- 4.0 s / 2.5 s: beat drop. Zoom-punch transition plus 450 ms procedural light-leak flash into slot 2. Optional impact SFX cue on this frame.
- +0.2 s: "Baad mein" Headline pops in accent colour at the same position as "Pehle".
- End -2.5 s: CTA slides up to a bottom edge at 72% height: "Apna quote lo: DM 'BEFORE'".
- End: hold on After.

**Text layers.**
- Headline (Before / After labels): Poppins ExtraBold, 104 px, white (Before) and accent (After) on 60% black rounded box; preset **pop**.
- Point (result promise): Inter Medium, 60 px, white on 50% black rounded plate; preset **blur-in**.
- CTA: Inter SemiBold, 58 px, charcoal on accent plate; preset **slide**.
- Devanagari: Hind.

**Colour / overlays.** Slot 1: desaturated cool LUT 70%, vignette 20%. Slot 2: warm commercial LUT 55%, no grain (detail matters in a reveal). Light leak on the single transition only.

**Transitions.** Zoom punch with light-leak flash on the drop. Nothing else. Alternatives selectable: hard cut, dip to black.

**Music mood tag.** build-up / drop, 90-100 BPM; the template places a riser cue marker ending on the drop frame and one impact cue (CC0 or own).

**Tier.** Free.

**Preview thumbnail animation.** Grey, boxed "before" shot creeps in, freezes for a beat with the promise line under it.
A flash of amber light and a zoom punch slam into the full-colour "after" with the accent label.

---

## 4. Founder Note

**Purpose.** The trust-builder: a 30-second talking-head "why we started" or "here's what went wrong this week" with a headline hook and karaoke captions. Rough is fine; the template supplies the polish.

**Canvas / duration.** 9:16, 30 s default (20-45 s).

**Slots.**
1. Talking-head slot, full length, subject centred. The creator trims their own jump cuts; **a zoom punch (1.00x <-> 1.15x, alternating in / out) is applied automatically on every jump cut the creator makes**. Suggested rhythm shown as a guide: a cut every 3-5 s.
2-3. Optional B-roll cutaway slots, 2 s each, anchored at **33% and 66% of runtime** (10 s and 20 s at the default 30 s; 6.6 s and 13.2 s at 20 s). Hard cut in, hard cut out.

**Timing beats.**
- 0.0 s: cold open mid-sentence. Headline pops at 0.0 s, bottom edge at 24% height: "Maine 5 lakh ads pe barbaad kiye" (placeholder, vulnerability archetype). Holds to 4.0 s then fades.
- 0.0 s to end: karaoke captions, 3-5 word chunks, bottom edge at 64% height.
- Every creator jump cut: zoom punch, alternating in / out.
- 6.0 s: compact name lower-third slides in from the left, out at 9.0 s. Two text layers (Name / Role) sharing one 60% black rounded plate, left-anchored, bottom edge at 74% height.
- 33% and 66% of runtime: 2 s B-roll cutaway, hard cuts.
- End -3 s: CTA on a plate under the captions, bottom edge at 76% height: "Save this if you're building too".
- End: finish on a question line so the loop reads.

**Text layers.**
- Headline: Poppins ExtraBold, 92 px, white on 65% black rounded box, 2 lines max; preset **pop**.
- Karaoke captions: Montserrat Bold, 58 px, white on 55% black rounded plate, active word in accent colour; preset **karaoke**.
- Lower-third: Inter Bold 48 px / Inter Regular 40 px on a shared plate; preset **slide**.
- CTA: Inter SemiBold, 56 px, charcoal on accent plate; preset **pop**.
- Devanagari: Noto Sans Devanagari 64 px for captions, Hind for headline.

**Colour / overlays.** Soft neutral skin-safe LUT 45%, vignette 12%, no grain. No letterbox.

**Transitions.** Zoom punch on jump cuts; hard cuts around B-roll.

**Music mood tag.** none / very low lo-fi bed at -18 to -20 dBFS. Original audio prioritised.

**Tier.** Free.

**Preview thumbnail animation.** Headline pops over a centred face that punches in a step closer on a cut.
Karaoke captions light up word by word in the accent colour while a small name tag slides in and out.

---

## 5. Studio Cut (Cinematic)

**Purpose.** The premium brand film in 15 seconds: letterboxed, graded, grainy, slow build to a beat drop. For cafes, studios, boutiques, real estate, cars, gyms, anyone who wants the "we are a serious brand" feel without an agency.

**Canvas / duration.** 9:16, 15 s. **Letterbox bars are set as a share of frame height: default 10% top and 10% bottom** (192 px each, visible window 1080x1536, roughly 7:10, between 9:13 and 4:5). Picker: 8% / 10% / 12%. A separate **16:9 canvas variant file** (1920x1080, same slot order and timing, relaid-out text) ships alongside, and only that variant offers the 1.85 / 2.35 / 2.39 ratio picker.

**Slots.**
1. Establishing shot, 3 s, static or slow push (speed ramp 0.6x).
2. Detail shot, 2 s.
3. Human / product-in-use shot, 2.5 s.
4. Hero slot, 3.5 s, speed curve 100% -> 25% -> 100% centred on the slot midpoint marker; freeze frame 0.6 s at the slow point.
5. Second detail, 2 s.
6. Closing wide, 2 s.

**Timing beats.**
- 0.0 s: fade in from black 0.5 s onto slot 1 with slow push. Title blur-in at 0.6 s, letter-spaced, centred inside the visible window with its bottom edge at 46% height: "BRAND NAME" above a smaller "EST. 2021, JAIPUR" line. Hold to 2.8 s, fade.
- 3.0 s: beat drop. Hard cut to slot 2 with a 500 ms light-leak flash. Cuts on downbeats from here.
- 5.0 s: cut to slot 3.
- 7.5 s: crossfade (16 frames) into hero slot 4; ramp dips to 25% at 9.25 s with 0.6 s freeze; optional riser cue 7.25-9.25 s ends on the freeze; optional impact cue on exit.
- 11.0 s: cut to slot 5.
- 13.0 s: dip to black (12 frames) into slot 6.
- 14.0 s: CTA line blur-in, centred, bottom edge at **70% height** (inside the visible window, above the bottom bar which starts at 90%): "Visit us. Link in bio." plus handle.
- 15.0 s: dip to black.

**Text layers.**
- Headline (title): Cormorant Garamond SemiBold uppercase, 88 px, tracking +20%, bone white (#F2EDE4); preset **blur-in**.
- Point (sub line): Inter Light **uppercase, 40 px, tracking +10%** (small-caps look); preset **typewriter**.
- CTA: Inter Regular sentence case, 46 px, bone white on 50% black pill; preset **blur-in**.
- Hindi variant: title in **Yatra One** (OFL Devanagari display) at 96 px, sub line in Hind Light 64 px. Hinglish variant keeps the Latin title and uses Hind Light for the sub line.

**Colour / overlays.** Choose one bundle at template load. Each bundle obeys the looks rule (LUT plus at most two of grain / vignette / letterbox):
- **Warm Print Film (default):** warm print-stock LUT 60% with lifted blacks, grain 12%, soft procedural light leak at low opacity on the two flagged cuts, letterbox on. No vignette.
- **Muted Film Print:** low-saturation LUT 65% (greens pulled down, gentle highlight roll-off, lifted blacks), grain 15%, letterbox on. No vignette.
- **Moody Night:** cool LUT 75%, grain 20%, vignette strong, letterbox off, dip-to-black transitions everywhere.
Grain blend: overlay. Bars pure black with optional 5% feather. Light leak on exactly two cuts (3.0 s and the hero exit).

**Transitions.** Cut, crossfade, dip to black only. Slides and zooms are disabled in this template because they look cheap against bars.

**Music mood tag.** cinematic / ambient build to drop, 70-90 BPM; music at -12 dBFS (no VO). CC0 or own only.

**Tier.** Pro.

**Preview thumbnail animation.** Black fades up to a slow, grainy, warm letterboxed wide as a tracked serif title breathes in.
A soft flash cuts to detail shots on the beat, then the hero move slows and freezes before dipping to black.

---

## 6. Behind the Counter

**Purpose.** The lo-fi process reel: raw phone footage of the work getting made, labelled with time or day markers, ending on the finished thing. Builds trust for food, craft, tailoring, printing, D2C packing.

**Canvas / duration.** 9:16, 20 s.

**Slots.**
1. Opening raw clip, 3 s ("6:40 AM" style).
2-5. Process clips, 3.5 s each; slot 3 runs at 3x speed (time-lapse feel), the rest 1.0x. **Slot 3 needs at least 10.5 s of source at 3x.** On one-drag swap the editor checks source length: shorter than 10.5 s falls back to 2x (needs 7 s) with a notice; shorter than 7 s shows a "clip too short for time-lapse" warning and runs at 1.0x.
6. Result shot, 3 s, freeze frame on the final 1 s.

**Timing beats.**
- 0.0 s: slot 1 with slow push; corner marker typewriters in at 0.2 s: "6:40 AM" (top-left, inside safe zone). Headline pops at 0.6 s, centred, bottom edge at 30% height: "Ek order, poora din" (placeholder). Fades at 3.0 s.
- 3.0 s: hard cut on beat. Marker updates: "STEP 1 / 8:15 AM".
- 6.5 s, 10.0 s, 13.5 s: hard cuts; marker updates each slot. Slot 3 time-lapse with marker "FAST FORWARD".
- 17.0 s: cut to result; freeze frame at 19.0 s; "Done" Headline pops with the check-mark sticker; CTA Point line underneath, bottom edge at 72% height: "DM to order" (neutral default; the creator types their own platform or number).
- 20.0 s: end.

**Text layers.**
- Marker: Space Mono Bold **uppercase, 44 px, tracking +6%** (small-caps look), white on 55% black pill, corner-anchored; preset **typewriter**.
- Headline: Poppins Bold, 88 px, white on 50% black rounded plate; preset **pop**.
- CTA: Inter SemiBold, 54 px, charcoal on accent plate; preset **slide**.
- Devanagari: Hind for Headline and CTA (64 px floor).
- Karaoke captions optional if the creator narrates.

**Required stickers.** Check mark (Verso vector set).

**Colour / overlays.** Very light natural LUT 25% or none. No grain, no vignette, no letterbox. Honest look.

**Transitions.** Cut only.

**Music mood tag.** lo-fi / acoustic, 80-95 BPM; sits at -18 to -20 dBFS under any voice.

**Tier.** Free.

**Preview thumbnail animation.** A timestamp types itself into the corner over shaky morning footage and the headline pops.
Quick cuts update the marker, one clip rushes by in time-lapse, and the finished product freezes with "Done".

---

## 7. Offer Countdown

**Purpose.** The scarcity teaser for a sale window or festive offer: one giant number, one offer line, one date. Day-wise variants swap the numeral and colour so a brand can post daily for five days.

**Canvas / duration.** 9:16, 8 s, loop-safe. A **1:1 canvas variant file** (1080x1080, relaid-out text) ships alongside for feed posts.

**Placeholder guidance.** Use a slow orbit or static tripod clip of the product or packed orders so the loop reads.

**Slots.**
1. Single looping product or packed-orders clip, 8 s. Slow push 1.00 -> 1.08 over the first 3.5 s, holds, returns to 1.00 over the final 0.5 s.

**Timing beats.**
- 0.0 s: Headline numeral **pops in with overshoot** (0.35 s), centred, bottom edge at 48% height: "3". Beside/under it the Point line **typewriters** in at 0.5 s: "DIN BAAKI".
- 1.0 s: offer line slides in from the right, bottom edge at 60% height: "Flat 30% off, sab kuch".
- 3.5 s: beat-synced zoom transition (1.0 -> 1.1x punch on the same slot) with a 400 ms flare flash; the numeral re-triggers its pop preset on the beat.
- 5.0 s: CTA plate slides up from below and settles with its bottom edge at 74% height: "Last date 10 Nov. Link in bio."
- 7.5 s: push returns to 1.00 over 0.5 s.
- 7.7 s: all text fades out 0.3 s; loop point.

**Text layers.**
- Headline (numeral): Anton, 420 px, accent colour on a 55% black rounded plate; preset **pop** (overshoot).
- Point ("days left" + offer line): Poppins Bold, 72 px, white on 60% black rounded box; presets **typewriter** (days left) and **slide** (offer line).
- CTA: Inter SemiBold, 56 px, charcoal on accent plate; preset **slide**.
- Devanagari: Hind Bold for Point and CTA. For a Devanagari numeral the creator types it in the Hindi placeholder (Hind carries Devanagari digits); no toggle.

**Colour / overlays.** High-contrast, no grain, no letterbox. Light vignette 15% to pull the eye to the numeral. Palette variants per day: maroon + gold, navy + yellow, saffron + white, forest + cream, black + accent.

**Transitions.** One zoom punch at 3.5 s. Loop-safe otherwise.

**Music mood tag.** festive-upbeat / energetic, 110-125 BPM. CC0 or own only.

**Tier.** Free.

**Preview thumbnail animation.** A huge numeral slams in with a bounce over slowly moving product footage while "DIN BAAKI" types beneath it.
The frame punches on the beat with a flare, the offer line slides across, and the date plate rises from below.

---

## 8. Signature Walk (Cinematic)

**Purpose.** The slowed-beat showcase for a product, an outfit, a space or a "calm founder" POV: still opening, movement exactly on the drop, moody grade, almost no text. For brands that sell on feel, not features. Ships in two modes: **Full (Pro)** and **Lite (Free)**, so every tier has a cinematic option.

**Canvas / duration.** 9:16. Full: 12 s. Lite: 9 s.

**Slots (Full).**
1. Opening, 3 s, near-static or slow push (speed ramp 0.6x).
2. Movement slot, 4 s at 1.0x (walk, orbit, product spin, door opening).
3. Second movement, 3 s at 0.8x.
4. Hold shot, 2 s, freeze frame on the final 0.8 s.

**Slots (Lite).**
1. Opening, 3 s, speed ramp 0.6x.
2. Movement slot, 4 s at 1.0x.
3. Hold shot, 2 s, freeze frame on the final 0.8 s.

**Timing beats (Full).**
- 0.0 s: slot 1 at 0.6x with slow push 1.00 -> 1.06. No text. "Breath" marker: music low or silent 0.0-2.4 s; optional riser cue 1.0-3.0 s ending on the drop frame.
- 3.0 s: beat drop. Hard cut (alternative: zoom punch) into slot 2 at full speed; optional impact cue on the frame.
- 3.4 s: uppercase tracked Point line slides up, centred, bottom edge at **70% height**: "MADE SLOW. WORN LOUD." (placeholder, 3-5 words). Holds to 6.5 s, fades.
- 7.0 s: cut on downbeat to slot 3 at 0.8x.
- 10.0 s: dip to black (10 frames) into slot 4; freeze at 11.2 s.
- 11.3 s: brand handle blur-in, tiny, centred, bottom edge at 70% height. No CTA (CTA lives in the post caption).
- 12.0 s: end.

**Timing beats (Lite).** Same 0.0-3.0 s breath and drop; Point line 3.4-6.5 s; cut to the hold shot at 7.0 s with freeze at 8.2 s; handle at 8.3 s; end at 9.0 s. One drop, one line, one hold.

**Text layers.**
- Point (the one line): Oswald Regular **uppercase, 52 px, tracking +12%** (small-caps look), bone white, no plate by default; a 45% black pill toggles on if the shot behind it is bright; preset **slide** (up).
- Handle: Inter Regular, 36 px, 80% white; preset **blur-in**.
- Headline style exists but is unused by default (template deliberately text-light); Hindi variant uses Hind Medium 64 px for the single line.

**Colour / overlays.**
- Full: moody cinematic LUT 60% (cool shadows, protected warm skin), grain 12% overlay blend, vignette 25% feathered. Letterbox off by default; toggling bars (10% top and bottom) switches the vignette off automatically to stay inside the looks rule. No light leak; one procedural soft flare allowed on the 3.0 s drop.
- Lite: same LUT at 50%, grain 10%. No vignette, no letterbox. One flare on the drop.

**Transitions.** Hard cut at the drop, cut on the downbeat, dip to black into the hold. Zoom punch optional at the drop.

**Music mood tag.** slowed / half-time, cinematic low-tempo, 65-80 BPM; music at -12 dBFS. **Licence note shown on the mood tag:** the slowed-and-reverb feel is applied to the music layer by the creator's own speed and reverb settings on a **CC0 or original track only**. Slowing a copyrighted song does not make it usable, and the template never prompts for trending audio.

**Tier.** Full: Pro. Lite: Free.

**Preview thumbnail animation.** A near-still, moody, grainy frame drifts for a long beat while the music holds its breath.
On the drop it snaps into motion, one tracked uppercase line slides up, and the piece dips to black on a freeze.

---

## Pack summary

| # | Template | Family | Duration | Tier | Signature move |
|---|----------|--------|----------|------|----------------|
| 1 | Price Drop | Micro promo | 7 s loop | Free | Old price anchored first, strike + new price punch on the beat, seamless loop |
| 2 | Five Reasons | Educational listicle | 18-30 s (beat-set) | Free | Hard cuts on two-bar markers, badge pops with overshoot, curiosity tag on #4, save CTA |
| 3 | Before and After Snap | Reveal | 10 s / 8.5 s short | Free | Desaturated inset before, freeze inside the riser, light-leak zoom punch to after |
| 4 | Founder Note | Talking head | 20-45 s | Free | Headline cold open, karaoke captions, auto punch on every jump cut |
| 5 | Studio Cut | Cinematic brand film | 15 s | Pro | 10% letterbox bars, warm print-film default, speed-ramp hero, two light leaks; 16:9 variant file |
| 6 | Behind the Counter | Lo-fi process | 20 s | Free | Typewriter time markers, time-lapse slot with source-length check, freeze on result |
| 7 | Offer Countdown | Scarcity teaser | 8 s loop | Free | Giant numeral pop, day-wise palette variants; 1:1 variant file |
| 8 | Signature Walk | Cinematic showcase | 12 s Full / 9 s Lite | Pro / Free | Still-to-motion on the drop, moody grade, one line of text |

**Required pack assets.** Verso vector sticker set (number badges 1-5, bookmark, check mark, strike line, arrow); Noto Emoji (OFL) bundle in the sticker panel; LUTs (.cube): warm neutral, clean neutral, desaturated cool, warm commercial, soft neutral skin-safe, warm print-stock, muted film print, cool moody, light natural; fonts listed in the pack defaults. Optional: a small set of Verso-made CC0 SFX (riser, impact, whoosh) for the cue markers; without it the markers are empty and the creator imports their own.

## Engine requests (not required to ship this pack)

These would improve the pack but every template above works without them:

1. Text stroke and drop shadow on text layers (would let captions and the Signature Walk line drop their plates).
2. Sidechain music ducking under voice (attack/release), replacing the fixed -18 to -20 dBFS music level.
3. A secondary audio track for SFX so the cue markers can hold clips directly instead of relying on a music-track edit.
4. Keyframable scale on text layers, for a true 100 -> 108 -> 100 beat instead of a re-triggered pop.
5. Reframe + relayout from one timeline to 1:1 and 16:9, replacing the separate canvas variant files for T5 and T7.
6. Loop-check overlay in the slot picker (first versus last frame difference) for the two loop-safe templates.

## Coverage notes for pack v2

The engine can already build three 2026-current business formats that are not in this eight-template pack and are proposed for the next one: a sound-led no-music packing / ASMR reel (freeze on the label, typewriter order number, original audio only); a word-per-beat kinetic text promo (pop preset on beat markers, one word per cut, 6-8 s); and a stacked review / testimonial reel (3-4 text plates sliding over a looping product clip). All three use only slots, text presets, beat markers and freeze frames.
