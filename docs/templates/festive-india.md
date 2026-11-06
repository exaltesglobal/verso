# Verso Template Pack: Festive India (rev 2)

Eight original templates for India-first creators, small brands and YouTubers covering Diwali week (Dhanteras to Bhai Dooj), Navratri/garba season and the general "festive" mood. All designs are Verso originals: formats are described generically, no third-party template, editor, sticker pack, LUT product or artwork is reproduced or referenced.

Diwali 2026 falls on Sunday 8 Nov; Dhanteras 6 Nov; Bhai Dooj 10 Nov. Every date in placeholder copy below is checked against that calendar.

## What changed in rev 2

- Diya Night (old T1) and Festive Film (old T6) overlapped (same night-gold palette, same LUT+grain+vignette stack, same fade-in/flare/dip arc). They are merged: the slow-motion diya hero shot now lives in Festive Film. The freed slot becomes **Shubh Bolo**, a karaoke-captioned talking-head greeting, the highest-volume festive format the old pack did not cover.
- Din Baaki (old T4, a plain numeral countdown) is replaced by **Diwali Dump**, a beat-synced photo-dump / stop-motion slideshow. A countdown end-card preset inside Diwali Dump keeps the "N din baaki" use case.
- Gift Sweep (old T3) is rebuilt as **Sahi Gift**: wrong-gift vs right-gift contrast with a strikethrough-price reveal.
- Shubh Title (old T8) is now **Shubh Title + Outro**: 16:9-native YouTube intro and end-screen outro for the YouTuber audience, with a 9:16 intro variant.
- Every timeline is rebuilt on a beat grid at the mood tag's tempo, every end-of-reel text holds at least 1.8s, every slot states a minimum clip length, and every text layer is at least 56px. No template breaks a pack-wide rule.
- Beats that needed unlisted engine features (Ken Burns push-ins, tracking/scale text animation, position jitter, count-up numerals, split-screen, procedural gold texture) are rewritten with listed primitives. Features the pack still needs from the engine or product are collected in the **Engine and product dependencies** section at the end; templates reference them as `[dep: name]`.

## Pack-wide defaults (baked into every template)

- **Canvas / export:** 9:16, 1080x1920, 30fps default. Templates marked "+1:1" ship a square sibling; "+16:9" ships a YouTube variant; Shubh Title + Outro is 16:9-native (1920x1080). Export codec is an engine choice, not a template concern; see the H.264 note under pre-ship checks.
- **Safe zones:** bottom 20% and right 12% reserved for platform UI on 9:16. Every text layer in this pack is positioned inside the safe area by default; a visible guide overlay shows the zones. Hard-locking layers out of the zones is `[dep: safe-zone lock]`. Letterbox templates place text inside the visible window, never on the bars.
- **Three text styles per template:** Headline (biggest, display face), Point (supporting line, sans), CTA (pill/plate, accent colour). Distinct size and colour so a muted viewer reads hierarchy instantly.
- **Minimum text size:** 56px at 1080 width for every layer, including CTAs, lower-thirds, timestamps and subtitles. No exemptions in this pack.
- **Language:** every text layer ships three copy presets, Hinglish (default), English and Hindi; Devanagari-capable fonts are declared per layer. Switching all layers in one click is `[dep: language swap]`. Rupee formatting uses "₹" and Indian lakh style (1,00,000).
- **Hook rule:** first text layer lands by 0.3s and is fully readable within 1.0s, in every template including the cinematic ones. Hook slot auto-capped at 3s.
- **Read-time rule:** any text that appears in the final 3s of a timeline holds for at least 1.8s before the reel ends.
- **Beat grid:** cuts marked "beat-synced" snap to detected beats. Each template's timings are written at the mood tag's reference tempo and every slot duration is a whole number of beats, so the grid survives a music swap within the tag's range.
- **Speed ramps:** minimum 0.5x; templates soften to 0.75x on 30fps source and show a "use 60fps for smooth slow-mo" hint on the slot. Every ramped slot states its minimum clip length.
- **Min clip length:** every slot shows a "Min clip: Ns" hint computed from duration x speed, so a non-technical creator knows before dragging media in.
- **Audio:** mood tags only; CC0 or creator-owned music only, pack-wide. No named track, artist or library anywhere. The `slowed-reverb` tag may hold only original CC0 compositions written in that style, never slowed or reverbed versions of existing recordings. Any ducking, normalisation or SFX behaviour is `[dep: audio bus]` and specified only in the dependencies section.
- **Effect stacking:** max two heavy effects per slot (LUT + grain, or LUT + letterbox). Light leaks on 1-2 transitions per template, never every cut.
- **Stickers:** all stickers come from the Verso sticker set, vector, rendered from OFL sources (Noto Emoji, OFL, for any emoji-style glyph). Templates never place a raw emoji character in a text layer, so nothing depends on a platform emoji font.
- **Fonts (OFL only, Google Fonts builds):** Devanagari display: Yatra One, Modak, Rozha One, Khand, Teko, Baloo 2, Tiro Devanagari Hindi. Devanagari text: Hind, Mukta, Noto Sans Devanagari, Poppins (Latin pair). Latin display: Bebas Neue (the Dharma Type OFL build as distributed on Google Fonts, not the commercial Pro family), Oswald, Anton, Cormorant Garamond, Playfair Display. Latin text: Inter, Montserrat.
- **Palettes (tokens):** `maroon-gold` (#5A0F1E / #E8B04B / bone #F6EEDC), `navy-marigold` (#0B1F3A / #F5A623 / #FFFFFF), `saffron-white` (#E8671A / #FFFFFF / #1A1A1A), `night-gold` (#07060A / #D9A441 / #F2E3C6), `garba-pop` (#1E0A3C / #FF4D8D / #FFD23F / #00C2A8).
- **Preview thumbnails:** each template card autoplays a 2-3s loop in the template browser; described per template below.

---

## 1. Shubh Bolo

**Purpose:** Karaoke-captioned talking-head festive greeting. The creator speaks a 10-second wish or festive message to camera; every word lights up as it is spoken so the reel works muted, with two optional B-roll cutaways. For personal greetings, brand "team wishes you" posts, and festival-week announcements. Bright, warm, daylight look; the opposite of the cinematic templates.

**Canvas:** 9:16 (+1:1)
**Duration:** 12s (range 8-20s)
**Tier:** Free

**Slot list (3 slots):**
1. Talking head: creator to camera, full duration, 12.0s. Min clip: 12s (the template follows the clip length within range)
2. Optional cutaway A: diya, sweets, decor, product, 1.5s, inserted at the first "cutaway marker" (default 4.0s). Min clip: 1.5s
3. Optional cutaway B: 1.5s at the second marker (default 7.5s). Min clip: 1.5s

**Timing beats:**
- 0.0s: slot 1 starts, no fade; name/handle plate pops at 0.2s
- 0.4s: karaoke captions begin on the first spoken word (captions follow the VO; no beat grid in this template)
- 4.0-5.5s: hard cut to cutaway A and hard cut back; captions continue over it
- 7.5-9.0s: hard cut to cutaway B and back
- 9.5s: headline wish pops with a single procedural warm flare (400ms); captions drop below it
- 10.2s: CTA pill pops
- 12.0s: end (headline and CTA have held 2.5s and 1.8s)

**Text layers:**
- Name plate: "@aapkahandle" (editable) — Poppins SemiBold 56px, dark #1A1A1A on white 85% pill, top-left inside safe zone. Pop at 0.2s, hold to 9.5s, fade.
- Karaoke captions: Poppins Bold 64px (Hindi preset: Hind Bold 64px), white with 4px dark outline, active word saffron #E8671A, 2-4 words per line, band at 55-70% height. On by default.
- Headline wish: "Shubh Deepawali" (swap: "Happy Diwali" / "शुभ दीपावली") — Yatra One 128px, saffron with white 6px stroke, centered at 38% height. Pop at 9.5s, hold to end.
- CTA: "Aapki Diwali kaisi jaa rahi hai? Comment karo" (swap: "How is your Diwali going? Tell me below") — Inter Bold 56px, white on saffron pill, 62% height. Pop at 10.2s.
- Font pairing: Yatra One (display) + Poppins/Hind (captions) + Inter (CTA).

**Colour / LUT / overlays:** `saffron-white`. "Natural Warm" .cube LUT at 25%, skin-safe. No grain, no vignette, no letterbox. One flare on the headline only. Bright by design so it reads in daylight scrolling.

**Transitions:** hard cuts only (to and from cutaways). No light leaks.

**Music mood tag:** `warm-celebratory-low` (soft tabla + strings, 80-88 BPM, low bed under VO). VO present, so `[dep: audio bus]` for ducking; without it the music layer defaults to -18 dB gain in the template.

**Preview thumbnail animation:** A creator mid-sentence with words lighting up saffron one by one; a quick cut to a tray of sweets and back, then "Shubh Deepawali" pops with a warm flash.
Loop returns to the first word.

---

## 2. Rangoli Reveal

**Purpose:** Before-and-after transformation for rangoli, home decor, mandir setup, office Diwali decor or shop display. The reveal transition is the hook and lands at 2.4s; works for any festival decoration.

**Canvas:** 9:16 (+1:1)
**Duration:** 10.2s (range 7-15s)
**Tier:** Free

**Reference tempo:** 100 BPM (0.6s per beat).

**Slot list (4 slots):**
1. Before: bare floor / undecorated space, 2.4s (4 beats), held static. Min clip: 2.5s
2. After hero: finished rangoli or decor, overhead or wide, 3.6s (6 beats) at 0.85x. Min clip: 3.5s
3. After detail A: close-up (diyas on the rangoli edge, petals), 1.8s (3 beats). Min clip: 2s
4. After detail B: second angle or person admiring, 2.4s (4 beats). Min clip: 2.5s

**Timing beats:**
- 0.0s: slot 1 starts; "Pehle" label pops at 0.2s
- 1.9s: optional freeze frame 0.5s on slot 1 (the "world stop" feel)
- 2.4s: beat drop; action cue (clap / stomp / hand swipe recommended in footage) → hard cut to slot 2 with procedural light-leak flash (450ms) and a zoom transition (punch in and settle, 300ms)
- 2.6s: "Baad mein" label pops
- 6.0s: beat-synced hard cut to slot 3; point line slides in at 6.2s
- 7.8s: beat-synced hard cut to slot 4; elapsed-time sticker and CTA pop at 8.0s
- 10.2s: end; final frame colour-matched to first frame for a soft loop (texts have held 2.2s)

**Text layers:**
- Label 1 "Pehle" (swap: "Before" / "पहले") — Khand Bold 96px, white on 60% black rounded plate, top-left inside safe zone. Pop at 0.2s, exits on the cut.
- Label 2 "Baad mein" (swap: "After" / "बाद में") — Khand Bold 96px, gold #E8B04B on maroon plate, same position. Pop at 2.6s, hold to 6.0s then fade.
- Point line: "Kitne hours lage? 3 ghante, 4 rang" (swap: "How long? 3 hours, 4 colours") — Mukta Medium 60px, white with soft shadow, 55% height. Slide-in from bottom at 6.2s, hold to 7.8s.
- Sticker: Verso "stopwatch" vector sticker (OFL Noto Emoji-derived glyph, not a raw emoji character) with editable text "3h 10m" in Inter Bold 56px, upper-right inside safe zone. Pop at 8.0s, hold to end.
- CTA: "Save karo for Diwali" (swap: "Save this for Diwali") — Poppins SemiBold 56px on marigold pill, 62% height. Pop at 8.0s, hold to end.
- Font pairing: Khand (labels) + Mukta (points) + Poppins/Inter (CTA, sticker).

**Colour / LUT / overlays:** `maroon-gold`. Slot 1 carries a 40% desaturation LUT "Flat Before" so the reveal also reads as a colour reveal; slots 2-4 use "Festive Warm" LUT at 55%, grain off (keeps rangoli colours clean), vignette 12%. Light leak on the reveal cut only.

**Transitions:** hard cut + light-leak flash + zoom transition on the reveal; hard cuts after. (The split-screen before/after toggle from rev 1 is removed; it needs compositing the engine does not list.)

**Music mood tag:** `festive-dhol-upbeat` (dhol hit on the drop, 95-105 BPM).

**Preview thumbnail animation:** Grey, bare floor with a "Pehle" tag; a light-leak flash wipes it to a full-colour overhead rangoli with "Baad mein" popping in.
Loop snaps back to the bare floor.

---

## 3. Sahi Gift

**Purpose:** "Galat gift vs sahi gift" contrast reel for D2C brands, boutiques, home bakers and local shops. Three pairs: a tired default gift (soan papdi box, generic dry fruits, a plastic diya set) hard-cuts to the creator's product with an MRP struck through and the offer price popping. The contrast is the hook; the strikethrough is the save trigger. Built to be watched muted.

**Canvas:** 9:16 (+1:1)
**Duration:** 16.8s (range 12-20s)
**Tier:** Free

**Reference tempo:** 100 BPM (0.6s per beat).

**Slot list (8 slots):**
1. Hook card: both gifts side by side on a festive cloth, or the creator holding the product, 2.4s (4 beats). Min clip: 2.5s
2. Wrong gift 1: 1.2s (2 beats). Min clip: 1.5s
3. Right gift 1: product hero, 2.4s (4 beats). Min clip: 2.5s
4. Wrong gift 2: 1.2s. Min clip: 1.5s
5. Right gift 2: 2.4s. Min clip: 2.5s
6. Wrong gift 3: 1.2s. Min clip: 1.5s
7. Right gift 3: 2.4s. Min clip: 2.5s
8. Close card: boxed orders / packaging clip, 3.6s (6 beats). Min clip: 4s

All eight slots are fixed. Creators with fewer products reuse a product across pairs; automatic trimming of empty pairs is `[dep: slot trimming]`.

**Timing beats:**
- 0.0s: slot 1; headline pops at 0.1s ("Galat gift vs sahi gift")
- 2.4s: beat-synced cut to wrong gift 1; red "GALAT" tag pops at 2.5s with a dip-free hard cut
- 3.6s: beat-synced cut to right gift 1 with zoom transition; green "SAHI" tag pops at 3.7s; MRP line (strikethrough style) pops at 3.9s; offer price pill pops at 4.1s
- 6.0s / 7.2s: pair 2 (same offsets)
- 9.6s / 10.8s: pair 3 (same offsets)
- 13.2s: slide transition into close card
- 13.5s: CTA line 1 typewriter ("Order by 6 Nov for Diwali delivery")
- 14.8s: CTA line 2 pop ("DM 'GIFT' karo")
- 16.8s: end (CTA 2 has held 2.0s)

**Text layers:**
- Headline: "Galat gift vs sahi gift" (swap: "Wrong gift vs right gift" / "गलत गिफ्ट vs सही गिफ्ट") — Baloo 2 ExtraBold 104px, white on marigold rounded band, upper third. Pop at 0.1s, hold to 2.4s, exit on cut.
- "GALAT" tag — Oswald Bold 72px, white on #C8102E red plate, upper-left inside safe zone, rotated -4 degrees. Pop on each wrong-gift cut, exits on the next cut.
- "SAHI" tag — Oswald Bold 72px, navy on #2BB673 green plate, same position. Pop on each right-gift cut, hold through the slot.
- Product lower-third (anchored 62% height, left-aligned): product name — Poppins SemiBold 60px, white, pop; MRP "₹1,299" — Inter Bold 56px, white at 70% opacity with strikethrough text style, pop; offer price "₹649" — Inter Bold 72px, navy on marigold pill, pop 200ms after the MRP. The strikethrough is a text style, not an animation, so no new primitive is needed.
- CTA 1: "Order by 6 Nov for Diwali delivery" (swap: "6 Nov tak order karo, Diwali se pehle milega") — Hind SemiBold 56px, white; typewriter.
- CTA 2: "DM 'GIFT' karo" (swap: "DM 'GIFT' to order") — Poppins Bold 64px, navy on marigold pill; pop.
- Font pairing: Baloo 2 (headline) + Oswald (tags) + Poppins/Inter (names/prices) + Hind (Hindi CTA).

**Colour / LUT / overlays:** `navy-marigold`. Wrong-gift slots carry "Flat Before" at 50% (desaturated, slightly cool) so the right gift lands as a colour jump; right-gift slots carry "Product True" at 35% (gentle warmth, colour-accurate). Grain off. Vignette off. No light leaks. High contrast for mute viewing.

**Transitions:** hard cuts into wrong gifts, zoom transitions into right gifts, one slide into the close card.

**Music mood tag:** `festive-upbeat-low` (bright percussion, low bed so a VO can sit on top).

**Preview thumbnail animation:** A dull sweet box with a red "GALAT" tag snaps to a glowing gift hamper tagged "SAHI"; "₹1,299" gets struck through and "₹649" pops onto a marigold pill.
Loop runs pair 1 and rewinds.

---

## 4. Diwali Dump

**Purpose:** Beat-synced photo-dump / stop-motion slideshow, the highest-volume format during festival week: 16 phone photos flick by one per beat with every fourth held for two beats so the eye can rest. For "Diwali 2026 dump", Navratri nine-day recaps, Bhai Dooj family photos, shop "this week in orders". A countdown end-card preset turns the same template into a "N din baaki" teaser.

**Canvas:** 9:16 + 1:1 feed sibling
**Duration:** 14s (range 10-20s), loop-safe
**Tier:** Free

**Reference tempo:** 120 BPM (0.5s per beat).

**Slot list (18 slots, image or video):**
1. Hook card: the best photo of the set, 1.5s (3 beats). Min clip: still image or 1.5s video
2-17. Photo slots x16, 0.5s (1 beat) each; slots 5, 9, 13, 17 hold 1.0s (2 beats). Still images accepted directly `[dep: still-in-slot]`; videos play from their first frame. Min clip: still, or 1s video
18. End card: solid #0B1F3A navy with a marigold border (vector, no texture), 2.5s (5 beats)

**Timing beats:**
- 0.0s: hook card; headline pops at 0.2s
- 1.5s: beat drop; hard cuts begin, one photo per beat, no transitions (stop-motion feel comes from the hard cuts, not an effect)
- 3.0s, 5.0s, 7.0s, 9.0s: the two-beat holds; a short caption slides in on each hold (optional, 4 captions)
- 11.5s: hard cut to the end card; closing line pops at 11.6s; CTA pops at 12.0s
- 14.0s: end (closing line held 2.4s). First and last frames are both navy with marigold accents, so the loop is clean

**Text layers:**
- Headline: "Diwali 2026 dump" (swap: "Diwali 2026 ki photos" / "दिवाली 2026 डंप") — Modak 120px, marigold with 6px navy outline, upper third on the hook card. Pop at 0.2s, hold to 1.5s.
- Hold captions x4 (optional): "Dhanteras ki shopping", "Rangoli round 2", "Mithai overload", "Phuljhari time" — Baloo 2 Bold 60px, white on 55% navy plate, 58% height. Slide-in from left on each hold, exit on the next cut.
- Closing line: "Kaisi rahi aapki Diwali?" (swap: "How was your Diwali?" / "कैसी रही आपकी दिवाली?") — Baloo 2 ExtraBold 96px, white, centered 40% height on the end card. Pop at 11.6s.
- CTA: "Apni dump tag karo" (swap: "Tag your dump") — Inter Bold 56px, navy on marigold pill, 55% height. Pop at 12.0s.
- Countdown end-card preset (toggle): replaces the closing line with a numeral "3" in Teko Bold 400px marigold + "DIN BAAKI" (swap: "DAYS LEFT" / "दिन बाकी") in Teko SemiBold 120px white beneath it; both pop at 11.6s. Creator edits the numeral daily.
- Font pairing: Modak (hook) + Baloo 2 (captions, closing) + Inter (CTA) + Teko (countdown preset).

**Colour / LUT / overlays:** `navy-marigold`. "Natural Warm" LUT at 20% on all photo slots to unify mixed phone photos. No grain, no vignette, no letterbox, no light leaks. Clean and fast.

**Transitions:** hard cuts only. No speed ramps, so any source works.

**Music mood tag:** `festive-pulse` (short percussive loop with a clear downbeat, 115-125 BPM, loop-safe).

**Preview thumbnail animation:** A marigold "Diwali 2026 dump" pops over a sweets photo, then eight photos flick past one per beat and stop on a navy card asking "Kaisi rahi aapki Diwali?".
Loop restarts from the hook photo.

---

## 5. Garba Drop

**Purpose:** Casual-to-festive outfit transition for Diwali, Navratri garba/dandiya nights, weddings and festive GRWM. Movement lands exactly on the beat drop; slow-mo twirl sells the outfit. Also fits product "unboxing to styled" and mehendi reveals.

**Canvas:** 9:16
**Duration:** 13s (range 10-15s)
**Tier:** Free

**Reference tempo:** 125 BPM (0.48s per beat). Cuts below are at beat boundaries; the engine snaps them to the detected grid on a music swap.

**Slot list (6 slots):**
1. Casual: everyday outfit, same framing as slot 2, 1.92s (4 beats). Min clip: 2s
2. Festive hero: twirl / dupatta flick / jump landing, 2.88s (6 beats), speed ramp 1.0x → 0.5x → 1.0x centred on the slot midpoint (full speed 0-0.72s, 0.5x 0.72-2.16s, full speed 2.16-2.88s). Min clip: 3s at 60fps (2.2s of source is consumed; softened to 0.75x on 30fps)
3. Detail A: jewellery / bangles / jhumka, 1.44s (3 beats). Min clip: 1.5s
4. Detail B: footwear or hands with dandiya sticks, 1.44s. Min clip: 1.5s
5. Movement: garba step or walk toward camera, 1.92s at 0.8x. Min clip: 2s
6. Pose freeze: final pose, 3.36s (7 beats) with freeze frame on the last 2.4s. Min clip: 1.5s

**Timing beats:**
- 0.0s: slot 1; small label "Pehle" typewriters at 0.2s
- 1.4s: optional freeze 0.5s (the breath before the drop)
- 1.92s: first drum hit → match-cut on the spin/jump into slot 2 with slide transition (left) and light-leak flash 400ms
- 2.64-4.08s: ramp holds 0.5x on the twirl; 4.80s: beat-synced hard cut to slot 3
- 6.24s / 7.68s: beat-synced hard cuts (slots 4, 5)
- 9.60s: zoom transition into slot 6; freeze at 10.56s with a procedural flare (500ms)
- 10.56s: headline pops; 10.80s: point slides in
- 12.96s: end (headline held 2.4s, point 2.16s)

**Text layers:**
- Label "Pehle" — Khand Medium 64px, white, top-left. Typewriter 0.2s, exits on the cut.
- Headline on freeze: "Garba night ready" (swap: "Navratri look done" / "गरबा नाइट रेडी") — Rozha One 108px, marigold #FFD23F with pink #FF4D8D 4px offset shadow, centered at 45% height. Pop at 10.56s.
- Point: "Outfit: @brand | ₹2,499" — Poppins Medium 56px, white on 50% plum plate, 60% height. Slide-in at 10.80s.
- Karaoke captions off by default (no VO expected).
- Font pairing: Rozha One (display) + Khand (labels) + Poppins (details).

**Colour / LUT / overlays:** `garba-pop`. "Night Pop" LUT at 60% (lifted saturation in pinks/yellows, cool shadows). Grain 8%. Vignette 15%. Light leak on the 1.92s match-cut and a procedural flare on the final freeze.

**Transitions:** slide (left) with light leak on the drop; hard cuts on beats; zoom into the final slot; freeze frame.

**Music mood tag:** `garba-bass-drop` (dandiya rhythm with a clear drop at bar 2, 120-130 BPM); alt `slowed-reverb` (original CC0 compositions written in the slowed, reverb-heavy style only; never slowed or reverbed versions of existing recordings).

**Preview thumbnail animation:** Casual outfit mid-spin smash-cuts through a light leak into a slow-motion lehenga twirl.
Loop freezes on the final pose with a flare, then resets.

---

## 6. Festive Film

**Purpose:** The pack's single cinematic montage, now carrying the slow-motion diya hero shot that was the old Diya Night. For creators who want Diwali, Navratri, Chhath or Christmas footage to look like a short film: letterbox, print-style grade, grain, two light leaks, slow build to a beat drop, a diya lit in slow motion at the heart of it. Also the "Diwali recap" and "ghar wapsi" (going home for the festival) reel. Optional brand end card.

**Canvas:** 9:16 with 2.39 letterbox (other ratios `[dep: letterbox ratio picker]`) + 16:9 full-bleed export of the same timeline without bars
**Duration:** 21.5s (range 18-30s)
**Tier:** Pro

**Reference tempo:** 75 BPM (0.8s per beat).

**Slot list (8 slots):**
1. Establishing: static or slow push shot in camera (train window, terrace at dusk, street lights), 3.2s (4 beats). Min clip: 3.5s
2. Arrival / faces: 2.4s (3 beats). Min clip: 2.5s
3. Preparation: hands with diyas, rangoli, sweets, 1.6s (2 beats). Min clip: 2s
4. Hero: lighting the first diya, a flame close-up, or the family moment, 3.2s (4 beats), speed ramp 1.0x → 0.5x → 1.0x centred on the midpoint (0.5x from 0.8s to 2.4s of the slot). Min clip: 4s at 60fps (2.4s consumed; softened to 0.75x on 30fps)
5. Lights wide: lit balcony / lane, 2.4s. Min clip: 2.5s
6. Movement: sparkler or pooja aarti, 2.4s. Min clip: 2.5s
7. Quiet: a face lit by diya light, 2.4s. Min clip: 2.5s
8. Closer: wide night shot, 3.2s, freeze frame on the last 1.6s. Min clip: 2s

**Timing beats:**
- 0.0s: fade from black 0.5s onto slot 1; title blur-in starts at 0.3s and is fully resolved by 1.0s
- 3.2s: beat drop; hard cut to slot 2 with light-leak flash (500ms); title exits on the cut
- 5.6s: hard cut slot 3
- 7.2s: hard cut slot 4 (hero); ramp dips to 0.5x at 8.0s, back to full at 9.6s
- 10.4s: 16-frame crossfade into slot 5 (chapter breath)
- 12.8s: hard cut slot 6 (second light leak)
- 15.2s: dip to black 12 frames into slot 7 (chapter break)
- 17.6s: hard cut slot 8; lower-third typewriters at 18.0s; freeze at 19.2s
- 20.8s: dip to black 0.7s; 21.5s end on black (lower-third held 2.8s; loop-safe with the opening)

Slot sum check: 3.2 + 2.4 + 1.6 + 3.2 + 2.4 + 2.4 + 2.4 + 3.2 = 20.8s, plus 0.7s dip = 21.5s.

**Text layers:**
- Title: "Ghar. Diwali. 2026." (swap: "Home for Diwali" / "घर। दिवाली। 2026") — Cormorant Garamond SemiBold 96px, uppercase, static tracking +18%, bone white, centered in the letterbox window. Blur-in at 0.3s, hold to 3.2s. (No animated tracking or scale; blur-in only.)
- Lower-third: "Varanasi | 8 Nov 2026" — Montserrat Medium 56px small-caps, bone, left-aligned at the bottom edge of the visible window, never on the bars. Typewriter at 18.0s, hold to 20.8s.
- Captions: off by default. Toggle "Minimal plate" (Inter 56px sentence case on 45% black pill, fade per line) if a VO is added.
- Optional brand end card: during the final dip, a logo/handle image slot fades in over black for the last 1.2s (toggle; for brand greetings).
- Font pairing: Cormorant Garamond (title) + Montserrat (lower-third) + Inter (optional captions); Hindi title uses Tiro Devanagari Hindi.

**Colour / LUT / overlays:** `night-gold` tokens. "Print Stock Warm" .cube LUT at 65% (crushed-but-open shadows, amber highlights, blues toward cyan; skin protected). Grain 15% screen blend, scaled to canvas. Vignette 20%. Letterbox bars #000 with 5% soft edge. Light leaks on exactly two cuts (3.2s, 12.8s). Letterbox + LUT are the two stacked effects; grain is treated as the second effect on the 16:9 (no-bars) export, so no extra overlays per slot.

**Transitions:** fade from black, hard cuts on beat, one crossfade, two dips to black, two light-leak flashes, one freeze frame. Slides and zooms disabled in this template (they cheapen the bars).

**Music mood tag:** `cinematic-slowed` (still intro, drop at ~3s, 70-85 BPM); alt `warm-celebratory`.

**Preview thumbnail animation:** Letterboxed dusk shot with a wide-tracked serif title blurring in; a light leak flashes and cuts to a slow-motion diya being lit.
Loop dips to black and fades back to the opening.

---

## 7. Ghar Ki Taiyaari

**Purpose:** Lo-fi behind-the-scenes "festival prep" process reel: cleaning, mithai making, decor, shop packing, pandal setup. Raw phone footage, timestamps per clip, no heavy grade. Built for home food creators, small businesses and family vlogs; trust over polish.

**Canvas:** 9:16
**Duration:** 19.5s (range 15-30s)
**Tier:** Free

**Reference tempo:** 80 BPM (0.75s per beat).

**Slot list (6 slots):**
1. Morning start: 3.0s (4 beats) ("6:40 AM"). Min clip: 3s
2. Process A: 3.0s ("Safai"). Min clip: 3s
3. Process B: 3.0s ("Mithai batch 1"). Min clip: 3s
4. Process C: 3.0s at 3x time-lapse ("Rangoli"). Min clip: 9s (any frame rate; time-lapse needs no 60fps)
5. Process D: 3.0s ("Lights up"). Min clip: 3s
6. Payoff: finished room / tray of sweets / lit home, 4.5s (6 beats) with freeze frame on the last 1.0s. Min clip: 3.5s

**Timing beats:**
- 0.0s: slot 1; hook label pops at 0.1s ("Diwali prep: Day 1")
- 0.6s: timestamp typewriters in the corner
- 3.0s / 6.0s / 9.0s / 12.0s: beat-synced hard cuts; each new corner timestamp typewriters in within 0.4s
- 9.0-12.0s: slot 4 runs at 3x with the Verso "3x" speed sticker
- 15.0s: cut to payoff; closing line slides in at 16.8s; freeze at 18.5s
- 19.5s: end (closing line held 2.7s)

**Text layers:**
- Hook label: "Diwali prep: Day 1" (swap: "Diwali ki taiyaari: Din 1" / "दिवाली की तैयारी: दिन 1") — Baloo 2 Bold 84px, white on 55% maroon plate, upper third. Pop at 0.1s, hold 3s, fade.
- Corner timestamp per slot: "6:40 AM", "9:15 AM", "1:30 PM", "4:00 PM", "7:10 PM", "Final" — Mukta SemiBold 56px small caps, bone, top-left inside safe zone, soft shadow. Typewriter on each cut.
- "3x" speed sticker (Verso sticker set) on slot 4, bottom-left inside safe zone.
- Closing line: "Thak gaye, par ghar chamak gaya" (swap: "Tired, but the house is glowing" / "थक गए, पर घर चमक गया") — Hind Medium 60px, white on 50% black plate, 58% height. Slide-in from bottom at 16.8s, hold to end.
- Karaoke captions: toggle on if a VO is recorded; Poppins 56px white with 4px dark outline, active word marigold, 2-4 words per line, 50-75% height band.
- Font pairing: Baloo 2 (hook) + Mukta (timestamps) + Hind/Poppins (closing/captions).

**Colour / LUT / overlays:** `maroon-gold` accents only. "Natural Warm" LUT at 25%. No grain, no vignette, no light leaks. Honest footage is the point.

**Transitions:** hard cuts only, one speed ramp, one freeze frame.

**Music mood tag:** `lo-fi-acoustic` (gentle guitar/tabla loop, 75-85 BPM; low bed if VO).

**Preview thumbnail animation:** A hook plate pops over a dim morning kitchen while "6:40 AM" types into the corner; a hard cut jumps to hands rolling laddoos with a new timestamp.
Loop cuts back to the morning frame.

---

## 8. Shubh Title + Outro

**Purpose:** YouTube-first bookends for the stated YouTuber audience. The intro is a 6-second movie-title open (black, flare, wide-tracked serif or condensed title, hero shot with faded film texture, dip out) that prefixes any festive video or reel. The outro is a 10-second end screen with the hero footage looping behind reserved zones for YouTube's end-screen elements and a spoken-or-silent "agla video" nudge. Both ship 16:9-native; the intro also ships in 9:16 to chain in front of Festive Film or any reel.

**Canvas:** 16:9 (1920x1080) native for intro and outro; intro also in 9:16
**Duration:** Intro 6s (range 5-10s); Outro 10s (range 8-20s)
**Tier:** Pro

### Intro

**Slot list (2 slots):**
1. Black card (solid #07060A, no media) with optional small logo/handle image slot, 2.6s
2. Hero shot: lit diya lane, temple bells, sparkler, or the creator's face in warm light, 3.4s. Min clip: 3.5s

**Timing beats:**
- 0.0s: pure black
- 0.2s: procedural warm flare sweeps left to right (700ms) across black
- 0.3s: title blur-in (900ms), static tracking
- 1.6s: subtitle typewriter
- 2.6s: light-leak flash (500ms) into slot 2; title and subtitle hold over footage until 4.4s then fade
- 5.4s: dip to black 18 frames; 6.0s end on black (clean handoff to the main video)

**Text layers:**
- Title: "DIWALI '26" (swap: "दीपावली '26" / "Diwali 2026") — Bebas Neue 160px, uppercase, static tracking +18%, bone white #F6EEDC; alt "Epic" preset uses Playfair Display SemiBold 128px for weddings/romantic subjects. Preset: blur-in at 0.3s; exit fade at 4.4s. (No animated tracking or scale.)
- Subtitle: "A family film" (swap: "Ek ghar ki kahani" / "एक घर की कहानी") — Montserrat Regular 56px, small caps, static tracking +12%, bone, centered under the title. Typewriter at 1.6s, exit with the title.
- Optional leader-style countdown sticker "3 · 2 · 1" (Verso sticker set) in a corner over the black card (toggle, retro feel).
- Font pairing: Bebas Neue or Playfair Display (title) + Montserrat (subtitle); Hindi title uses Rozha One.

**Colour / LUT / overlays:** `night-gold`. Slot 2: "Faded Print" LUT at 70% (lifted blacks, warm faded highlights), grain 20% (vintage setting, replaces the rev 1 position-jitter idea), vignette 25%, optional letterbox 2.39 matching Festive Film on the 9:16 variant. Procedural flare on the black card and light leak on the cut. Two stacked effects respected: LUT + grain on footage; flare on the black card only.

**Transitions:** flare sweep over black, light-leak flash into footage, dip to black out.

**Music mood tag:** `nostalgic-cinematic` (single sustained note or soft drone with a bell hit on the title; 60-75 BPM). Designed to butt against the main video's track.

### Outro (16:9 only)

**Slot list (1 slot):**
1. Loop clip: hero footage or a slow pan of the lit home/shop, 10.0s, loop-safe (first/last frame matched). Min clip: 10s

**Layout guides (not elements; YouTube adds the real end-screen elements):** two 16:9 placeholder windows stacked on the right 38% of the frame for "next video" and "playlist", one circular placeholder at bottom-left for "subscribe". All text in this template stays out of those three zones. The guides are visible in the editor and not rendered.

**Timing beats:**
- 0.0s: clip starts, no fade; headline pops at 0.2s
- 0.8s: pointer sticker (Verso arrow sticker) slides in toward the upper placeholder window
- 1.6s: CTA pill pops
- 9.4s: text layers fade (400ms) so the loop restarts clean; 10.0s end

**Text layers:**
- Headline: "Agla video yahan" (swap: "Next video here" / "अगला वीडियो यहाँ") — Bebas Neue 120px, bone, left-aligned in the upper-left 55% of frame. Pop at 0.2s.
- CTA: "Subscribe karo, Diwali ki saari videos miss na ho" (swap: "Subscribe so you don't miss the Diwali series") — Montserrat SemiBold 56px, bone on 45% black pill, lower-left above the subscribe placeholder. Pop at 1.6s.
- Font pairing: Bebas Neue (headline) + Montserrat (CTA); Hindi uses Rozha One + Hind.

**Colour / LUT / overlays:** `night-gold`. "Faded Print" LUT at 50%, grain 12%, no vignette (keeps the end-screen zones legible). No light leaks.

**Transitions:** none; hard loop.

**Music mood tag:** `nostalgic-cinematic` (loop-safe cut of the same tag, 60-75 BPM).

**Preview thumbnail animation:** On black, a warm flare sweeps across and a wide-tracked "DIWALI '26" blurs in and settles; a light leak snaps to a grainy, faded shot of diyas down a lane, then a quick jump to the outro frame with "Agla video yahan" beside two empty windows.
Loop dips to black and the flare sweeps again.

---

## Pack summary

| # | Template | Format family | Canvas | Duration | Tier |
|---|----------|---------------|--------|----------|------|
| 1 | Shubh Bolo | Karaoke-captioned talking-head greeting | 9:16 (+1:1) | 12s | Free |
| 2 | Rangoli Reveal | Before-after reveal transition | 9:16 (+1:1) | 10.2s | Free |
| 3 | Sahi Gift | Wrong-vs-right contrast with strikethrough price | 9:16 (+1:1) | 16.8s | Free |
| 4 | Diwali Dump | Beat-synced photo-dump / stop-motion slideshow | 9:16 + 1:1 | 14s | Free |
| 5 | Garba Drop | Beat-drop outfit transition | 9:16 | 13s | Free |
| 6 | Festive Film | Letterboxed cinematic montage with slow-mo diya hero | 9:16 letterbox (+16:9) | 21.5s | Pro |
| 7 | Ghar Ki Taiyaari | Lo-fi timestamped process reel | 9:16 | 19.5s | Free |
| 8 | Shubh Title + Outro | YouTube 16:9 cinematic intro + end-screen outro | 16:9 (+9:16 intro) | 6s + 10s | Pro |

**Why this mix:** six Free templates cover the highest-volume 2026 festive formats (talking-head greeting with karaoke captions, reveal, contrast sweep, photo dump, outfit drop, lo-fi process) so new creators get wins immediately; two Pro templates (Festive Film, Shubh Title + Outro) carry the cinematic grade-and-grain stack that is the pack's premium hook, and together they give a YouTuber a complete intro, film and outro without leaving the pack. Karaoke captions are now a default (T1) and a toggle (T6, T7); 16:9 is native in T8 and exported from T6.

**Rule compliance check (rev 2):**
- Hook rule (text by 0.3s): T1 0.2s, T2 0.2s, T3 0.1s, T4 0.2s, T5 0.2s, T6 0.3s, T7 0.1s, T8 intro 0.3s / outro 0.2s.
- Minimum 56px: smallest layers are T1 name plate 56px, T2 CTA 56px, T3 MRP 56px, T4 CTA 56px, T5 point 56px, T6 lower-third 56px, T7 timestamps 56px, T8 subtitle/CTA 56px.
- Read-time (final text holds at least 1.8s): T1 1.8s, T2 2.2s, T3 2.0s, T4 2.4s (2.0s CTA), T5 2.16s, T6 2.8s, T7 2.7s, T8 outro fades at 9.4s after 7.8s.
- Beat grid: every slot duration in T2-T7 is a whole number of beats at the stated tempo; T1 and T8 are VO/title-driven and do not claim beat sync.

---

## Engine and product dependencies (confirm before ship)

The engine list this pack was designed against: 9:16/1:1/16:9 canvases, video slots with one-drag media swap, text layers with animation presets (pop, typewriter, slide, blur-in, karaoke captions), .cube LUT grading, film grain, vignette, letterbox bars, procedural light leak/flare overlays, transitions (cut, crossfade, dip to black, slide, zoom), speed ramps, freeze frames, beat-synced cuts, music mood tags, stickers/emoji, OFL fonts, CC0/own music. Everything in the templates above uses only those primitives except the items below.

| Dependency | Used by | Priority | Notes |
|---|---|---|---|
| `language swap` (one-click Hinglish / English / Hindi across all layers) | all | P0 | Each layer ships three copy presets; without the one-click switch, creators edit per layer. |
| `still-in-slot` (drop a still image into a video slot; held for the slot duration) | T4 (16 slots), T1/T6/T8 logo slots | P0 | Photo dumps are impossible without it. |
| `safe-zone lock` (text cannot be dragged into reserved zones) | all | P1 | Templates default-position inside the safe area; lock prevents user error. |
| `audio bus` (VO auto-duck 6-10 dB with 80ms attack/release, music ease-out over final 20%, master -2 dB peak, optional CC0 SFX on transitions at -22 dBFS) | T1, T3, T7 (VO), all (ease-out) | P1 | Target spec lives here only; templates reference mood tags and beat sync. Without it, T1 sets music gain -18 dB statically. |
| `letterbox ratio picker` (2.39 / 2.35 / 1.85 / 1080x1350 window) | T6, T8 9:16 | P2 | 2.39 is the fixed default; others are a picker. |
| `slot trimming` (empty slots collapse and later layers re-time) | T3 | P2 | Not required; T3 ships fixed. |
| Removed from the pack (not needed in rev 2) | - | - | Per-slot scale keyframes / Ken Burns, animated tracking or scale on text, position jitter, numeric count-up, split-screen compositing, procedural gold texture, day-wise palette swap. |

**Pre-ship checks (not template issues, flagged for engineering/legal):**
- Export codec: if the engine exports H.264, confirm the encoder in use is already licensed (OS or hardware encoder) because H.264 carries patent-pool licensing terms.
- LUT names (Festive Warm, Flat Before, Product True, Night Pop, Print Stock Warm, Natural Warm, Faded Print) are generic descriptors; run a quick trademark check on "Night Pop" and "Faded Print" before they appear in the UI and rename if needed.
- Bebas Neue must be the Google Fonts (Dharma Type, OFL) build; do not bundle the commercial Pro family.
- Stickers used (stopwatch, 3x, arrow, 3 · 2 · 1 leader) must exist in the Verso sticker set as vectors rendered from OFL sources; no raw emoji characters anywhere in the pack.

**Engine notes for implementation:**
- All LUTs are .cube, exposed with an intensity slider.
- Speed ramps (T2, T5, T6, T7) warn or soften when source media is under 60fps, except the 3x time-lapse in T7 which needs no high frame rate.
- Loop-safe templates: T4, T6, T8 outro (matching first/last frames); T2 and T7 are near-loop via colour match; T1, T3, T5 and T8 intro are not loops by design.
- Every slot carries a "Min clip: Ns" hint derived from duration x speed, surfaced in the slot's empty state.
