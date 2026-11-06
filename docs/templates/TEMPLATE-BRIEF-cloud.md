# Verso Template Brief — six packs, 48 templates

Verso by Agape Labs. A reels-first desktop editor for India-first creators, YouTubers, small brands and podcasters who are not editors. This brief merges the six template packs (Trending, Cinematic, Podcast, Creator Basics, Festive India, Business and Promo) into one document for engineering, design and review. Each pack section below is reproduced verbatim from its rev-2 spec; nothing in a pack section has been edited. The intro, the master table and the closing engine checklist are the only new material.

## Design principles (apply to every template)

1. **Original.** Every template is a Verso design. Formats and techniques are described generically (a beat-synced photo dump, a letterboxed travel cut, a before/after reveal); no template reproduces or names a third-party editor's template, asset, LUT product or sticker pack. LUTs, grain plates, light leaks and flares are authored in-house or generated procedurally. Fonts are OFL builds from Google Fonts only (Bebas Neue is the OFL build, never the commercial Pro family). Music is CC0 or the creator's own; there is no trending-audio import path. Stickers are Verso's own vector set or Noto Emoji (OFL); no platform emoji glyphs are rasterised into exports.
2. **Premium.** Every pack carries the formats that are strong and trending in late 2026 and renders them with discipline: a hook that lands by frame 1 (cold open, text on frame 0, no black holds), one grade stack per clip (a LUT plus at most two of grain / vignette / letterbox), light leaks on one or two transitions rather than every cut, speed ramps that respect source frame rate, and cinematic templates that look like film rather than a filter. Pro tiers are reserved for looks a Free user visibly cannot build (centred speed curves with freeze-and-title, widescreen-inside-vertical with karaoke captions, film-burn and analog pipelines, word-per-cut trailer stacks). Three text styles per template (Headline / Point / CTA) with hard size floors (56px Latin, 64px Devanagari) so a muted viewer reads hierarchy instantly; Hinglish placeholder copy by default with English and Hindi presets on every layer.
3. **One-drag.** Drop footage into a slot, swap the placeholder text, export. Every slot is a one-drag media swap with a "Min clip: Ns" hint; linked slots fill together; hook slots auto-cap at 3s; cuts snap to the detected beat grid so a music swap keeps the structure; safe zones (top 10%, bottom 20%, right 12%) are visible and text snaps out of them; every template ships with a stated fallback for any engine feature that is not yet confirmed, so nothing breaks while the engine catches up.

## Master table — all 48 templates

Durations are the shipped default with the range in brackets where the pack states one. "Free (seasonal)" surfaces in the picker only in its season but is searchable year-round.

| Pack | # | Name | Canvas | Duration | Tier |
|---|---|---|---|---|---|
| Trending | 1 | One-Liner | 9:16 (1:1 variant) | 8s (6-15s) | Free |
| Trending | 2 | Twenty Seconds | 9:16 (1:1 variant) | 20s (15-30s) | Free |
| Trending | 3 | Wide Frame | 9:16 thin letterbox (16:9 export for landscape source) | 24s (18-30s) | Pro |
| Trending | 4 | Snap Reveal | 9:16 | 10s (7-15s; Triple Reveal 12s) | Free |
| Trending | 5 | Straight Talk | 9:16 (stacked 2-up variant) | 30s (20-45s) | Free |
| Trending | 6 | Five Things | 9:16 | 36s (30-60s) | Free |
| Trending | 7 | Drop Walk | 9:16 | 12s (10-15s) | Pro |
| Trending | 8 | Word Storm | 9:16 (16:9 Cold Open 10s / End Screen 20s) | 10s (8-15s) | Pro |
| Cinematic | 1 | Slow Burn | 9:16 letterbox (tall cinema), 16:9 twin | 18s (15-24s) | Free |
| Cinematic | 2 | Beat Drop Walk (Walk / Dump) | 9:16, 1:1 twin | 12s (10-15s) | Free |
| Cinematic | 3 | Hero Frame | 9:16, 16:9 twin | 14s (10-18s) | Pro |
| Cinematic | 4 | Print Stock | 9:16 (16:9 inset on blurred self), 16:9 twin | 28s (20-45s) | Pro |
| Cinematic | 5 | Faded Memory (Home Movie / Clean 35) | 9:16 letterbox (tall cinema), 1:1 twin | 20s (15-30s) | Pro |
| Cinematic | 6 | Title Card (Short / Long) | 9:16 letterbox (tall cinema), 16:9 twin | 3.5s Short / 6s Long (5-10s) | Free |
| Cinematic | 7 | Silver | 9:16, 16:9 twin | 15s (12-20s) | Pro |
| Cinematic | 8 | Night Lights | 9:16 letterbox (tall cinema), 1:1 twin, 9:16 story | 16s (12-20s) | Free (seasonal) |
| Podcast | 1 | Headline Clip | 9:16 (1:1 variant) | 25s (15-45s) | Free |
| Podcast | 2 | Two-Up Exchange | 9:16 (1:1 side-by-side variant) | 15-40s | Free (Layout States: Pro) |
| Podcast | 3 | Hot Take Montage | 9:16 | 20s (15-30s) | Pro |
| Podcast | 4 | Cinema Cut | 9:16 letterbox (tall cinema), 16:9 export | 25-45s | Pro |
| Podcast | 5 | Night Mood | 9:16 | 15-30s | Pro |
| Podcast | 6 | Clip Countdown | 9:16 | 20-45s | Free |
| Podcast | 7 | Wide Shot Fit | 9:16 (16:9 inset) | 15-45s | Free |
| Podcast | 8 | Chapter Card | 9:16 (16:9 variant) | 25-45s | Pro |
| Creator Basics | 1 | Photo Dump (Clean / Film Memory / Tyohaar) | 9:16 (1:1 layout preset) | 19.2s (15-24s) | Free |
| Creator Basics | 2 | Teaser | 9:16 letterbox (2.39 window) | 15s (12-15s) | Free |
| Creator Basics | 3 | Dhoop (Shaadi variant) | 9:16 letterbox (1.85 / 2.35 / 2.39 / tall cinema) | 24s (18-28s; Shaadi 40-48s) | Pro |
| Creator Basics | 4 | Snap Reveal | 9:16 (1:1 layout preset) | 10s (7-14s) | Free |
| Creator Basics | 5 | Just Talking (Match reaction variant) | 9:16 | 30s (20-40s) | Free |
| Creator Basics | 6 | Clip Frame (Face fill variant) | 9:16 (16:9 source window) | 40s (20-60s) | Free |
| Creator Basics | 7 | Galti Mat Karo | 9:16 | 38s with 4 points (30-55s) | Free |
| Creator Basics | 8 | Drop Walk | 9:16 (1:1 layout preset) | 13.6s (10-15s) | Pro |
| Festive India | 1 | Shubh Bolo | 9:16 (+1:1) | 12s (8-20s) | Free |
| Festive India | 2 | Rangoli Reveal | 9:16 (+1:1) | 10.2s (7-15s) | Free |
| Festive India | 3 | Sahi Gift | 9:16 (+1:1) | 16.8s (12-20s) | Free |
| Festive India | 4 | Diwali Dump (countdown end-card preset) | 9:16 + 1:1 sibling | 14s (10-20s) | Free |
| Festive India | 5 | Garba Drop | 9:16 | 13s (10-15s) | Free |
| Festive India | 6 | Festive Film | 9:16 letterbox 2.39 (+16:9 full-bleed export) | 21.5s (18-30s) | Pro |
| Festive India | 7 | Ghar Ki Taiyaari | 9:16 | 19.5s (15-30s) | Free |
| Festive India | 8 | Shubh Title + Outro | 16:9 native (intro also 9:16) | Intro 6s (5-10s) + Outro 10s (8-20s) | Pro |
| Business and Promo | 1 | Price Drop | 9:16 | 7s loop | Free |
| Business and Promo | 2 | Five Reasons | 9:16 | 26s (18-30s, beat-set) | Free |
| Business and Promo | 3 | Before and After Snap | 9:16 | 10s (8.5s short variant) | Free |
| Business and Promo | 4 | Founder Note | 9:16 | 30s (20-45s) | Free |
| Business and Promo | 5 | Studio Cut (Cinematic) | 9:16 letterbox 8/10/12% (+16:9 variant file) | 15s | Pro |
| Business and Promo | 6 | Behind the Counter | 9:16 | 20s | Free |
| Business and Promo | 7 | Offer Countdown | 9:16 (+1:1 variant file) | 8s loop | Free |
| Business and Promo | 8 | Signature Walk (Cinematic) | 9:16 | 12s Full / 9s Lite | Pro (Full) / Free (Lite) |

**Tier split:** Trending 5 Free / 3 Pro; Cinematic 4 / 4; Podcast 4 / 4 (Two-Up Exchange Free with a Pro unlock); Creator Basics 6 / 2; Festive India 6 / 2; Business and Promo 6 Free / 2 Pro (Signature Walk ships a Free Lite mode). Across the six packs: 31 templates have a Free tier, 17 are Pro-only.

**Overlap note for the reviewer.** Several formats recur across packs on purpose because each pack is sold to a different audience and tuned for it: the slowed-beat showcase (Trending Drop Walk, Cinematic Beat Drop Walk, Creator Basics Drop Walk, Business Signature Walk, Festive Garba Drop), the before/after reveal (Trending and Creator Basics Snap Reveal, Festive Rangoli Reveal, Business Before and After Snap), the letterboxed travel cut (Trending Wide Frame, Cinematic Slow Burn, Creator Basics Dhoop, Festive Film, Business Studio Cut), the talking-head karaoke clip (Trending Straight Talk, Creator Basics Just Talking, Podcast Headline Clip, Festive Shubh Bolo, Business Founder Note), the numbered listicle (Trending Five Things, Creator Basics Galti Mat Karo, Podcast Clip Countdown, Business Five Reasons), the photo dump (Trending Twenty Seconds, Creator Basics Photo Dump, Festive Diwali Dump) and the 16:9-to-vertical inset (Cinematic Print Stock, Podcast Wide Shot Fit, Creator Basics Clip Frame). If the catalogue is consolidated later, these are the merge candidates; each pack's version is kept here as specified.

---

# Pack sections (verbatim)

The six pack specs follow exactly as written. Their own headings, pack-wide rules, engine-dependency notes, tier summaries and revision notes are preserved; where two packs state a rule differently (for example the text-outline or audio-bus assumptions), both versions stand and the difference is called out in the engine checklist at the end.


---

<!-- Pack: Trending (source: trending.md, verbatim) -->

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

---

<!-- Pack: Cinematic (source: cinematic.md, verbatim) -->

# Verso — "Cinematic" Pack (8 original templates) — rev 2

Verso by Agape Labs. Reels-first desktop editor for India-first creators and YouTubers who do not want to learn colour science to look like a film.

Every template below is an original Verso design. Formats and techniques are described generically; nothing here reproduces or names another editor's template or asset.

Rev 2 changes: timing holes closed (#3, #5, #7), honest effect budget, beat-snap rule, source-fps rules for slow motion, feed-first hooks (#1, #6, #8), milder default letterbox, Print Stock rebuilt as the long-form-to-reel "widescreen inside vertical" talking segment with karaoke captions, Beat Drop Walk gains a whip photo-dump variant, every engine feature that is not in the confirmed capability list is tagged.

## Engine capability tags

Confirmed engine capabilities (used freely): 9:16 / 1:1 / 16:9 canvases, video slots with one-drag swap, text layers with pop / typewriter / slide / blur-in / karaoke presets, LUT (.cube) grading, film grain, vignette, letterbox bars, procedural light leak and flare overlays, transitions (cut, crossfade, dip to black, slide, zoom), speed ramps, freeze frames, beat-synced cuts, music mood tags, stickers / emoji, OFL fonts, CC0 / own music.

Anything else in this spec carries one of two tags:

- **[ENGINE REQUEST]** — needed for the look as designed; the template ships with the stated fallback until the engine has it. Requests raised by this pack: (a) per-clip scale keyframes for slow push-in / push-out; (b) source-fps metadata read, so a slot can warn when a slow-motion speed is too slow for the footage; (c) an inset / picture-in-picture video slot with a blurred, graded copy of the same clip as background (the "widescreen inside vertical" look); (d) user-uploaded image sticker (logo slot).
- **[IF AVAILABLE]** — a nicety the template renders cleanly without: the whole audio bus (ducking, planned silence, music fade curve, bundled CC0 riser / impact / whoosh set attached to transitions and text pops). Until it exists, music plays flat at the pack level, no SFX, and a creator-supplied music file simply ends or is trimmed at the template end.

Nothing in any template depends on an untagged feature.

## Pack-wide rules (baked into all 8)

- **Canvas / export:** 9:16, 1080x1920, 30 fps H.264. Templates marked "16:9 twin" also ship a 1920x1080 variant of the same timeline for YouTube.
- **Safe zones:** bottom 20% and right 12% reserved for platform UI. When letterbox bars are on, text locks to the visible window, not the canvas.
- **Letterbox picker:** tall cinema (1080x1350 window, bars 285 px top and bottom) / 2.0 (1080x540) / 2.39 (1080x452) / 2.76 (1080x391). **Default on 9:16 is tall cinema**; 2.0 is the "more cinematic" step; 2.39 and 2.76 are offered as options and warn that the window is under 30% of the screen. Bars pure black, optional 5% feathered edge. Letterbox is a canvas setting, not an effect, and never counts against the effect budget.
- **Effect budget (honest version):** the base grade, **LUT + grain + vignette, is always allowed on every clip** and is what a "Look" means. On top of the base grade a clip may carry **at most one overlay** (light leak or flare), and a template may use **at most 3 overlays in total**. Slow push-in / push-out is motion, not an effect. Templates list their overlay count.
- **Grain / LUT / vignette defaults:** grain 10-20% screen blend, scaled to canvas resolution; LUT 55-80% with a slider; vignette 15-25% feathered. Light leaks are procedural, warm amber / pink, 400-600 ms.
- **Three preset bundles** exposed as one-click "Looks" inside every template: **Outdoor Teal-Orange** (LUT 70%, grain 15%, light vignette, letterbox on), **Indoor Warm Film** (warm LUT 60%, grain 12%, no letterbox, soft light leak), **Moody Night** (cool LUT 75%, grain 20%, strong vignette, dip-to-black). Generic LUT names only, none shared with a template name: "Print Stock Warm", "Print Stock Neutral", "Silver", "Teal Amber", "Faded Print".
- **Beat sync vs listed times:** every cut time written in a template is a **default** that snaps to the nearest detected beat (or half-beat for cuts under 1 s) when the music has beat data; the snap window is +/-0.25 s. Slot lengths flex +/-15% to absorb the snap; the template's total length flexes with them, and the final fade / dip is re-anchored to the new end. Freeze frames and speed ramps keep their stated duration and move with their slot. Without beat data the listed times are used as written.
- **Slow motion and source fps:** any slot at 0.5x or slower says so in its slot hint ("best from 60 fps footage"). Default speeds are chosen for 30 fps phone footage: slowest default dip is 50%. 25% is offered as an upgrade when the source is 60 / 120 fps (manual toggle now; auto when [ENGINE REQUEST] (b) lands).
- **Audio bus [IF AVAILABLE]:** music -12 dBFS peak in no-VO templates, -24 dBFS when VO present (auto-duck 6-10 dB, 50-100 ms attack / release), VO -6 dBFS peak, SFX -22 dBFS and under 300 ms, master normalised to -1 to -3 dB. Music fades over the final 20%. One "breath" marker (0.5-0.8 s dip) before the hero slot where noted. SFX attachments (bundled CC0 set only): crossfade -> soft whoosh centred on midpoint; slide / zoom -> sharp whoosh straddling the cut; dip-to-black -> impact on the black-to-picture frame; title pop -> impact on first visible frame; hero reveal -> 1 s riser ending on the cut. Every SFX cue below is optional.
- **Captions in cinematic templates** are off by default except Print Stock. Toggle gives a low-contrast sentence-case line (Inter or Montserrat) on a semi-transparent dark pill, blur-in per line, no per-word highlight. Print Stock uses the karaoke preset instead.
- **Fonts:** OFL builds from Google Fonts only: Inter, Montserrat, Noto Sans Devanagari, Hind, Mukta, Baloo 2, Yatra One, Modak, Cormorant Garamond, Oswald, Bebas Neue, Playfair Display, Space Mono, Space Grotesk, Anton, Poppins. **Bebas Neue must be the Google Fonts / OFL build**; the commercial "Bebas Neue Pro" family from its original foundry is not licensed for Verso and must not be substituted. Devanagari / Indic coverage via Noto Sans Devanagari, Hind, Mukta, Baloo 2, Yatra One, Modak. Every Hinglish placeholder ships a Hindi-script variant; one-click English / Hindi / Hinglish swap on every template.
- **Tokens in placeholders:** `{YEAR}`, `{MONTH}`, `{DATE}`, `{PLACE}`, `{NAME}`, `{BRAND}` resolve at project creation from the system clock and the creator profile, so no placeholder ever ships a literal year or date.
- **Media:** one-drag swap on every slot. CC0 or creator-owned music only.
- **Preview loop:** every template has a 4-6 s silent looping preview video in the picker (not a still).

---

## 1. Slow Burn

**Purpose.** The travel / vlog cinematic edit: a first-frame hook, beat drop at 3 s, letterbox, film grade. The one most people mean when they say "make it cinematic".

**Canvas.** 9:16 with letterbox (default tall cinema; 2.0 / 2.39 in the picker). 16:9 twin.

**Duration.** 18 s default (range 15-24 s, flexes with beat snap).

**Slots (7).**
1. Establishing shot, 3.0 s. Slow push-in 100 -> 103% [ENGINE REQUEST (a); fallback: static].
2. Movement clip, 2.0 s.
3. Detail / texture, 1.5 s.
4. People or vehicle, 2.5 s.
5. Hero shot, 4.0 s, speed ramp 0.5x -> 1.0x across the slot, freeze frame last 0.6 s. Slot hint: "best from 60 fps footage; on 30 fps keep the ramp at 0.75x -> 1.0x" (0.75x is the 30 fps default).
6. Wide landscape, 2.5 s.
7. Closing shot, 2.5 s, matches the framing of slot 1 so it loops.

**Timing beats (defaults; snap to beat).**
- 0.0 **Cut in on the first frame of slot 1, no fade.** Hook line pops on frame 1 (see text). Music starts "still".
- 0.0-1.0 Hook line holds, hard cut out at 1.0.
- 1.0 Title lower-third blurs in.
- 3.0 Beat drop. Hard cut to slot 2 with light leak #1 (500 ms). Overlay 1 of 2.
- 5.0 / 6.5 / 9.0 Cuts, each snapping to the nearest beat.
- 9.0 Hero slot begins slow, ramps to 1.0x by 11.5, freeze 12.4-13.0.
- 13.0 Dip to black (8 frames) -> slot 6. Chapter break; impact SFX [IF AVAILABLE].
- 15.5 Crossfade (12 frames) to slot 7 with light leak #2. Overlay 2 of 2.
- 17.4 Music fade [IF AVAILABLE]; last frame aligns with first.
- Optional "soft open" toggle restores a 0.6 s fade from black and moves the hook to 0.6 s; off by default because it loses the first-second swipe.

**Text layers.**
- Hook line (0.0-1.0, on by default): Oswald Medium, uppercase, tracking +8%, 52 px, white, centred in the upper third of the window. Preset: pop. Placeholder: "WAIT FOR IT" / Hinglish "RUKO ZARA" / Hindi "रुको ज़रा".
- Title (location): Cormorant Garamond SemiBold, uppercase, tracking +18%, 64 px, bone white. Preset: blur-in at 1.0 s, hold to 3.0 s, blur-out. Placeholder: "{PLACE}".
- Date / sub-line: Inter Regular, small caps, 34 px, 70% white. Preset: typewriter from 1.4 s, exits with title. Placeholder: "{MONTH} {YEAR}".
- Optional closing line (slot 7): same pairing, blur-in at 15.8 s. Placeholders: "Pahadon mein ek shaam" / Hindi "पहाड़ों में एक शाम" (Yatra One alt) / "An evening in the hills".

**Colour / overlays.** Look: Outdoor Teal-Orange (LUT "Teal Amber" 70%, grain 15%, vignette 18%) as base grade. Overlays: 2 (light leaks on cuts 1 and 6).

**Transitions.** Cut on beats, one dip-to-black at the chapter break, one crossfade at the end. No slides or zooms (they look cheap inside bars).

**Music mood tag.** cinematic / ambient / slowed, 70-90 BPM, drop at ~3 s.

**Tier.** Free.

**Preview loop.** A wide shot is already playing on frame one with a short caps hook over it; the hook snaps out and a letterspaced location title blurs in inside tall bars.
On the beat the frame cuts to a moving clip with an amber leak, then settles on the frozen hero shot.

---

## 2. Beat Drop Walk

**Purpose.** The slowed-track "main character" reel: a near-still opening, then movement exactly on the drop. Two variants share the first 3 s: **Walk** (one long moving shot after the drop) and **Dump** (a whip photo / clip dump of 8 slots under 0.5 s each after the drop, the fast-montage format long-form creators use for recap reels). Outfit, product spin, calm founder POV, trip dumps. Almost no text.

**Canvas.** 9:16, no letterbox by default (toggle available). 1:1 twin for feed.

**Duration.** 12 s default (range 10-15 s).

**Slots — Walk variant (3).**
1. Opening, 3.0 s, speed ramp 0.6x. Slot hint: "0.6x reads fine from 30 fps". Slow push-in 100 -> 104% [ENGINE REQUEST (a); fallback: static].
2. Walk / orbit / spin, 5.5 s, 1.0x.
3. Second angle, 3.5 s, 0.8x.

**Slots — Dump variant (10).**
1. Opening, 3.0 s, as above.
2-9. Eight dump slots, 0.45 s each (3.6 s total), photo or video, each snapping to a half-beat. Photos get a 2-frame zoom transition in; videos a hard cut.
10. Landing shot, 5.4 s, 0.8x, holds to the end.

**Timing beats (defaults; snap to beat).**
- 0.0 Slot 1 at 0.6x. Music intro; "breath" dip 2.4-3.0 [IF AVAILABLE].
- 3.0 Beat marker. Zoom transition (104 -> 100%, 6 frames) into slot 2. Bass hit #1 [IF AVAILABLE].
- Walk: 8.5 hard cut to slot 3 on downbeat. 11.0 music fade begins [IF AVAILABLE]; slot 3 holds, no outro card.
- Dump: 3.0-6.6 eight cuts on half-beats (slide-left on odd cuts, hard cut on even, so it reads as a whip pan without shaking the frame). 6.6 crossfade (8 frames) to the landing shot. 11.0 music fade [IF AVAILABLE].

**Text layers.**
- Optional single line, bottom-third centre (above the 20% UI zone): Oswald Medium small caps, tracking +10%, 44 px, white at 85%. Preset: slide-in from below at 3.4 s (after the drop), hold 2.5 s, fade. Placeholders: "Aaj ka mood" / Hindi "आज का मूड" (Baloo 2 alt) / "Monday, 7 AM".
- No headline, no captions. Text layer is off by default; the look carries it.

**Colour / overlays.** Look: Moody Night (LUT "Print Stock Neutral" with cool shift, 60% here rather than 75%), grain 12%, vignette 22%. Overlays: 0.

**Transitions.** One zoom on the drop; Walk adds one hard cut, Dump adds slides / cuts on half-beats and one crossfade. Nothing else.

**Music mood tag.** slowed / reverb, cinematic trap, 60-80 BPM, drop at 3 s.

**Tier.** Free.

**Preview loop.** A slow push on a still figure while the music builds; the frame is dark and quiet.
On the drop the shot punches to a walking clip (Walk) or rips through eight half-second frames (Dump) and a small-caps line slides in under it.

---

## 3. Hero Frame

**Purpose.** One shot that matters: a 100 / 50 / 100 speed curve (100 / 25 / 100 on high-fps footage) landing on the key instant (the jump, the pour, the glance), riser before, impact and title on the frozen frame. Sport, food, cars, dance.

**Canvas.** 9:16. 16:9 twin.

**Duration.** 14 s default (range 10-18 s).

**Slots (4).**
1. Build-up A, 2.5 s.
2. Build-up B, 2.5 s.
3. **Hero slot**, 6.0 s, preset speed curve **100% -> 50% -> 100%** by default, with the slow dip centred on a visible midpoint marker. Creator drags footage so the key moment sits on the marker. A "Deep slow (25%)" toggle on the slot is for 60 / 120 fps footage; the slot hint reads "25% needs 60 fps or better; 30 fps footage stays at 50%". Auto-detection of source fps is [ENGINE REQUEST (b)]; until then the toggle is manual.
4. Aftermath, 3.0 s.

**Timing beats (defaults; snap to beat).**
- 0.0 Cut in on motion, no fade. Hard cuts at 2.5 and 5.0 on downbeats.
- 5.0 Hero slot starts at 100%.
- 7.0 Riser begins (1 s) [IF AVAILABLE].
- 8.0 Ramp enters slow (whoosh straddles 7.8-8.3 [IF AVAILABLE]). Beat drop here.
- 8.0-9.6 Slow section at 50% (25% with Deep slow on; the slow section covers the same 1.6 s of timeline, so Deep slow consumes 0.4 s of source instead of 0.8 s).
- 9.6 Ramp exits to 100%, impact SFX on the exit frame [IF AVAILABLE]. Flare overlay on this frame (overlay 1 of 1).
- 10.2 Freeze frame, **0.8 s, 10.2-11.0**, with the title pop. The freeze runs right up to the cut; the clip does not resume. Bass hit #2 [IF AVAILABLE]. The freeze is on by default; if the creator turns it off, slot 3 plays through to 11.0 at 100%.
- 11.0 Hard cut to slot 4.
- 13.0 Music fade [IF AVAILABLE]. Loop-safe if slot 4 is cut to match slot 1.

**Text layers.**
- Title on freeze: Bebas Neue (Google Fonts OFL build), 120 px, tracking +5%, white with a 60% black gradient band behind. Preset: pop, slight scale-down from 104% (this is the pop preset's own motion, not a keyframe), enters on the freeze frame at 10.2 s, hold 0.8 s, cut out with the slot.
- Sub-line: Montserrat Medium, 36 px, amber accent. Preset: slide-in from left 10.4 s. Placeholders: "Take 14. Finally." / Hinglish "Take 14. Ho gaya." / Hindi "टेक 14। हो गया।" (Hind alt).

**Colour / overlays.** Look: Outdoor Teal-Orange (LUT "Teal Amber" 65%, grain 12%, vignette 15%). Letterbox off by default so the frame stays full-bleed and punchy. Overlays: 1 (flare on the ramp exit frame).

**Transitions.** Hard cuts on downbeats; the speed ramp is the "transition". Freeze-frame on the exit.

**Music mood tag.** build-up / drop, hype, 90-110 BPM.

**Tier.** Pro.

**Preview loop.** Two quick cuts of build-up, then the action stretches into slow motion as a riser climbs.
Time snaps back on the impact, the frame freezes, and a tall condensed title pops over it.

---

## 4. Print Stock

**Purpose.** The long-form-to-reel talking segment. A 16:9 clip from a YouTube video sits inside the vertical frame on a blurred, graded copy of itself, with karaoke captions under it and a restrained documentary grade. Built for YouTubers cutting podcast moments, tutorials and interviews into reels without re-shooting vertical. Two B-roll slots let the inset go full-bleed for a beat.

**Canvas.** 9:16, no letterbox (the inset creates its own window). Inset: 16:9 clip at 1080x608, centred at 42% canvas height; the blurred background is the same clip scaled 1.6x with a 40 px blur and the LUT applied, dimmed to 55%. [ENGINE REQUEST (c)]. **Fallback until (c) lands:** a 16:9 clip in a 9:16 slot letterboxes automatically to 1080x608 on black bars; the template then switches the background to a static dark gradient card so the layout survives. 16:9 twin exports the inset full-frame with captions only.

**Duration.** 28 s default (range 20-45 s, follows the talking clip).

**Slots (4).**
1. Talking clip A (16:9 inset), 10.0 s. Static, captions on.
2. B-roll cutaway, 3.0 s, full-bleed 9:16 (or 16:9 scaled to fill). Slow push-in 100 -> 104% [ENGINE REQUEST (a); fallback: static].
3. Talking clip B (16:9 inset, same source continues), 11.0 s. Static, captions on.
4. Closing B-roll or reaction, 4.0 s, full-bleed. Push-out 104 -> 100% [ENGINE REQUEST (a); fallback: static].

**Timing beats (defaults; cuts snap to the nearest sentence end, not to beats, when captions exist).**
- 0.0 Cut in on the speaker mid-gesture, no fade. First caption line is already on frame 1 (hook).
- 0.0 Topic card pops above the inset; out at 3.0.
- 10.0 Crossfade (10 frames) to B-roll; captions continue over it.
- 13.0 Crossfade back to the inset.
- 24.0 Crossfade to closing B-roll.
- 26.5 Music fade [IF AVAILABLE]; 28.0 hold on last frame, no outro card.
- Music under VO follows the pack rule: -24 dBFS, auto-duck 6-10 dB [IF AVAILABLE]. Without the audio bus, the template sets music to the pack's no-VO level minus 12 dB as a fixed gain so VO is never buried.

**Text layers.**
- Topic card (above the inset): Playfair Display SemiBold 48 px, white, with a thin amber edge bar; second line in Inter Regular 30 px. Preset: pop at 0.0, auto-out at 3.0. Placeholders: "Why I quit my job at 31" / Hinglish "Maine 31 mein job kyun chhodi" / Hindi "मैंने 31 में जॉब क्यों छोड़ी" (Noto Sans Devanagari alt).
- **Karaoke captions (below the inset, Pro feature):** Inter SemiBold 48 px, 2 lines max, sentence case, on a semi-transparent dark pill; active word highlighted in amber (#D9A441), past words white, future words 70% white. Preset: karaoke, synced to the clip's transcript. Devanagari and Hinglish-in-Devanagari fallback: Noto Sans Devanagari / Hind at the same size, same highlight rule. Placeholder: "Yeh recipe meri nani ki hai." / Hindi "ये रेसिपी मेरी नानी की है।" / "This recipe is my grandmother's."
- Lower-third name card (optional, on by default): name in Playfair Display SemiBold 40 px, role in Inter Regular 28 px, slide-in from left at 1.0 s, out at 4.0, placed at the inset's bottom-left corner. Placeholder: "{NAME}".

**Colour / overlays.** Look: Indoor Warm Film variant with LUT "Print Stock Warm" at 55%, grain 10%, vignette 15% on inset, B-roll and background alike (grain stays at the "clean doc" level so the talking face is not textured). Overlays: 0.

**Transitions.** Crossfade only (10 frames). Nothing harder.

**Music mood tag.** calm / ambient, acoustic, 70-85 BPM, sits under VO.

**Tier.** Pro. The Pro-only part a Free user cannot replicate: the inset-on-blurred-self layout plus karaoke captions with Devanagari fallback.

**Preview loop.** A widescreen talking clip sits on a soft blurred copy of itself while amber karaoke words light up under it.
It dissolves to a slow-creeping B-roll shot with the captions still running, then back to the speaker.

---

## 5. Faded Memory

**Purpose.** The retro film / analog texture reel: grain, faded colour, a film-burn flash, long dissolves. Two sub-looks in one template: **Home Movie** (heavy grain and vignette, 8mm home-movie feel) and **Clean 35** (light grain, print look). Weddings, nostalgia dumps, "this year" recaps.

**Canvas.** 9:16, letterbox tall cinema by default (2.0 available). 1:1 twin.

**Duration.** 20 s default (range 15-30 s).

**Slots (6).**
1. Opening clip, 3.5 s.
2. Clip, 3.0 s.
3. Clip, 3.0 s.
4. Clip, 3.0 s.
5. Clip, 3.5 s.
6. Closing clip, 4.0 s, **freeze frame on the last 2.0 s (18.0-20.0)**.

**Timing beats (defaults; snap to beat).**
- 0.0 Black -> warm light leak (600 ms) -> slot 1 revealed. Overlay 1 of 3.
- 0.6 Title blurs in; hold 1.5 s; blur out at 2.6. (Title is static apart from the blur-in; no scale drift.)
- 3.5 / 6.5 / 12.5 Long crossfades (22 frames).
- 9.5 Film-burn flash (procedural amber / pink leak, 500 ms) replaces the dissolve at this cut. Overlay 2 of 3. (The earlier "position jitter" on cuts is dropped: not an engine capability. If a jitter / shake transition is added later, Home Movie reclaims it here.)
- 16.0 Crossfade to slot 6, with a soft leak on Home Movie only. Overlay 3 of 3.
- 18.0 Freeze; date line types in 18.0-19.0, then **holds 1.0 s** fully readable.
- 20.0 Dip to black.

**Text layers.**
- Title: Cormorant Garamond Medium Italic, 72 px, tracking +12%, off-white. Preset: blur-in. Placeholders: "Woh din" / Hindi "वो दिन" (Yatra One alt) / "Those days".
- Date / caption on freeze: Space Mono Regular, 32 px, uppercase, 75% white. Preset: typewriter, 1.0 s. Placeholder: "{MONTH} {YEAR} — {PLACE}" (example render: "DEC {YEAR} — GOA"). Devanagari alt: Noto Sans Devanagari Regular, same size.
- Optional Hindi title alt: Yatra One, same size.

**Colour / overlays.** Home Movie: LUT "Faded Print" 70%, grain 20%, vignette 25%, soft blacks; overlays 3 (open leak, film burn, closing leak). Clean 35: LUT "Print Stock Warm" 60%, grain 10%, vignette 15%; overlays 2 (open leak, film burn). Both within the base-grade-plus-overlays budget.

**Transitions.** Long crossfades, one film-burn, one dip to black. Never slides or zooms.

**Music mood tag.** nostalgic / lo-fi, 65-80 BPM.

**Tier.** Pro.

**Preview loop.** A leak flares out of black into a faded, grainy clip while an italic serif title blurs in.
Slow dissolves and a quick film burn carry through to a frozen last frame with a typed date that holds.

---

## 6. Title Card

**Purpose.** A movie-style intro that prefixes any reel: black, flare, wide-tracked title, hero shot, dip to black. **Default is the 3.5 s "Short" cut** (black 1.3 s, hero 2.2 s) so footage is on screen inside two seconds; a 6 s "Long" variant keeps the slower build for YouTube or for creators who open with a hook of their own first. Three typography presets so the same intro reads romantic, trailer or editorial.

**Canvas.** 9:16, letterbox tall cinema on (2.0 / 2.39 in the picker). 16:9 twin.

**Duration.** 3.5 s default (Short). Long variant 6.0 s (range 5-10 s).

**Slots (2).**
1. Black / textured background (optional dark B-roll with heavy vignette). Short: 1.3 s. Long: 3.0 s.
2. Hero shot. Short: 2.2 s. Long: 3.0 s. Slow push-in 100 -> 102% [ENGINE REQUEST (a); fallback: static].

**Timing beats — Short (default).**
- 0.0 Black. Title is **already on frame 1** (pop preset, 4-frame settle); riser starts [IF AVAILABLE].
- 0.0-1.1 Title holds static (no letterspacing animation, no scale drift: neither is an engine capability).
- 0.9 Procedural flare sweeps left to right (400 ms) over the title as it blurs out. Overlay 1 of 1.
- 1.3 Dip to black (4 frames) -> hero shot. Impact [IF AVAILABLE].
- 1.5 Sub-line slides up.
- 3.1 Dip to black, 3.5 end. Hands off to the creator's main timeline.

**Timing beats — Long.**
- 0.0 Black. Riser starts (1 s) [IF AVAILABLE].
- 0.8 Flare sweeps left to right (500 ms); title appears underneath it (blur-in or pop per preset). Impact on first visible title frame [IF AVAILABLE].
- 1.0-2.6 Title holds static.
- 2.8 Title blurs out.
- 3.0 Dip to black (6 frames) -> hero shot.
- 3.2 Sub-line enters.
- 5.4 Dip to black, 6.0 end.

**Text layers.** Pick one typography preset:
- **Epic:** Playfair Display Regular, uppercase, tracking +22%, 84 px, bone white. Blur-in (Long) / pop (Short).
- **Trailer:** Oswald Bold, uppercase, tracking +6%, 132 px, crimson or white. Pop. In tall cinema the 132 px title fits two lines inside the 1350 px window; if the creator picks 2.39 the preset drops to 96 px automatically.
- **Editorial:** Space Grotesk Light, small caps, tracking +15%, 56 px, placed as a lower-third. Typewriter (Long) / pop (Short).
- Sub-line (all presets): Inter Regular, 32 px, 70% white, slide-up. Placeholders: "Ek chhoti si kahani" / Hindi "एक छोटी सी कहानी" (Mukta alt) / "A short film by {NAME}".
- Optional leader-style numbers sticker (3, 2, 1) in Space Mono for the Trailer preset, Long variant only.

**Colour / overlays.** LUT "Print Stock Neutral" 60%, grain 12%, vignette 25% on slot 2. Overlays: 1 (flare on the title).

**Transitions.** Flare reveal, dip to black x2.

**Music mood tag.** cinematic / trailer, riser into a single hit.

**Tier.** Free.

**Preview loop.** A wide-spaced title is already hanging in the dark on the first frame; a flare streaks across and takes it with it.
The frame dips and a letterboxed hero shot sits for two seconds before cutting to black.

---

## 7. Silver

**Purpose.** The gritty trailer cut: silver-retention style grade, deep blacks, heavy grain, hard cuts, freeze frames, all-caps condensed titles. Street, fitness, motorsport, "raw" founder stories, Hindi hustle content.

**Canvas.** 9:16, no letterbox (full-bleed hits harder). 16:9 twin.

**Duration.** 15 s default (range 12-20 s). Slots total exactly 15.0 s.

**Slots (6).**
1. Opening action, 2.0 s (0.0-2.0).
2. Action, 1.5 s (2.0-3.5).
3. Face / stare, 2.0 s (3.5-5.5), freeze frame last 0.4 s.
4. Action, 1.5 s (5.5-7.0).
5. Action, **2.5 s (7.0-9.5)**.
6. Hero action, **5.5 s (9.5-15.0)**, speed ramp 1.0x -> 0.5x from 12.0, freeze from 13.5 to the end (1.5 s). Slot hint: "0.5x reads fine from 30 fps; a 0.4x toggle is offered for 60 fps footage".

**Timing beats (defaults; snap to beat).**
- 0.0 Hard cut in. Word #1 pops.
- 2.0 / 3.5 / 5.5 / 7.0 Hard cuts on downbeats, one word per cut (words #2-#5). **Five picture cuts before the hero, five words.** (The earlier 8.5 cut is dropped; slot 5 runs through to the hero cut.)
- 5.1-5.5 Freeze on the face; planned silence (music drops out 0.4 s) [IF AVAILABLE; without it the music simply continues].
- 5.5 Impact SFX [IF AVAILABLE], cut to slot 4.
- 8.5 Riser (1 s) under the back half of slot 5 [IF AVAILABLE].
- 9.5 Cut to hero; bass hit #1 [IF AVAILABLE]. Word #5 cuts out here; no new word.
- 12.0 Ramp into slow motion (1.0x -> 0.5x over 1.5 s).
- 13.5 Freeze; title stack pops; bass hit #2 [IF AVAILABLE]. Optional flare on the freeze frame (overlay 1 of 1).
- 13.5-15.0 Freeze holds with the title stack. Music fades from 14.3 to a cold stop at 15.0 [IF AVAILABLE]; picture cuts out on the last frame with no fade.

**Text layers.**
- Word-per-cut: Anton, uppercase, 96 px, tight tracking -1%, off-white. Preset: pop on each cut (impact SFX attached [IF AVAILABLE]), hold until next cut, hard cut out. Alternates centre / upper-third placement. Five placeholders (Hinglish): "SUBAH", "4 AM", "KOI NAHI DEKH RAHA", "PHIR BHI", "ROZ". Hindi-script set: "सुबह", "4 AM", "कोई नहीं देख रहा", "फिर भी", "रोज़". English set: "DAWN", "4 AM", "NOBODY WATCHING", "STILL", "EVERY DAY".
- Title on final freeze: Anton 140 px, two lines, white on 70% black band. Preset: pop. Placeholder: "{NAME}" over "{YEAR}".
- Hindi alt: Baloo 2 ExtraBold (Devanagari), same sizes.

**Colour / overlays.** Look: LUT "Silver" (desaturation -30 global, skin held -12, open midtones, no crushed blacks) at 75%, grain 18% applied last, vignette 20%. Overlays: 0 by default, 1 if the optional flare on the final freeze is on.

**Transitions.** Hard cuts only, two freeze frames, one speed ramp.

**Music mood tag.** dark / tension / trailer, 85-100 BPM, with one planned silence [IF AVAILABLE].

**Tier.** Pro.

**Preview loop.** Desaturated, grainy clips slam past with one stencil-caps word punching in on every cut.
A face freezes in silence, the action resumes, slows, and locks on a two-line title over black.

---

## 8. Night Lights

**Purpose.** The festive-night cinematic: macro flame, string lights, sparkler trails, rangoli overheads cut to soft percussion with a gold-on-dark grade. Built for Diwali greetings and small-brand promos, but any night celebration (wedding, birthday, New Year) fits the same slots.

**Canvas.** 9:16, letterbox tall cinema on (2.0 / 2.35 in the picker). 1:1 twin for feed, 9:16 story export.

**Duration.** 16 s default (range 12-20 s).

**Slots (7).**
1. Macro hero (single flame / candle), 3.0 s, speed ramp 0.5x. Slot hint: "best from 60 fps footage; a flame at 0.5x from 30 fps still reads because it is a soft subject, but faces will stutter". Slow push-in [ENGINE REQUEST (a); fallback: static].
2. String lights, 1.8 s.
3. Overhead decor / rangoli, 1.8 s.
4. Sparkler trail, 1.5 s.
5. Faces / family or product, 2.2 s.
6. Wide of the lit space, 2.2 s.
7. End card over a dark bokeh clip, 3.5 s.

**Timing beats (defaults; snap to beat).**
- 0.0 **Cut in on the flame at half speed, no fade.** Hook / wish line pops on frame 1 and holds to 3.0. (Optional "soft open" toggle restores a 0.5 s fade and moves the wish line to 0.6 s.)
- 3.0 Beat drop; hard cut to slot 2 with procedural gold flare (500 ms). Overlay 1 of 2.
- 4.8 / 6.6 / 8.1 / 10.3 Cuts on beats (all under 2.5 s).
- 12.5 Dip to black (8 frames) -> end card, with a soft leak on the reveal. Overlay 2 of 2.
- 12.9 Brand name / logo pops; wish text and CTA line slide up.
- 15.2 Music fade [IF AVAILABLE]; 16.0 dip to black.

**Text layers.**
- Wish line (slot 1, on frame 1): Yatra One, 88 px, gold (#D9A441) on a 40% deep-maroon band. Preset: pop (Short settle) so it is readable on the first frame. Placeholder: "शुभ दीपावली" / "Shubh Deepawali". Latin alt: Cormorant Garamond SemiBold uppercase, tracking +18%.
- End card headline: Modak, 96 px, gold. Preset: pop at 12.9 s. Placeholders: "Happy Diwali from {BRAND}" / Hindi "{BRAND} की ओर से शुभ दीपावली".
- CTA line: Poppins Medium, 36 px, warm white. Preset: slide-up at 13.3 s. Placeholder: "Festive delivery till {DATE} · DM to order" / Hinglish "{DATE} tak delivery · DM karo" / Hindi "{DATE} तक डिलीवरी · DM करें" (Mukta alt). `{DATE}` defaults to seven days after project creation.
- Brand slot: **logo as an uploaded image sticker [ENGINE REQUEST (d)]**; fallback until then is a text brand name in Modak 72 px, gold, pop at 12.9 s, from `{BRAND}`.

**Colour / overlays.** Look: Indoor Warm Film adapted for night (LUT "Print Stock Warm" 65%, keep golden highlights, never desaturate), grain 12%, vignette 20%. Overlays: 2 (gold flare on the drop, soft leak on the end-card reveal). Diya, rangoli, string-light and gold-on-maroon elements are generic cultural motifs supplied by the creator's footage; no bundled artwork.

**Transitions.** Hard cuts on beats, one flare reveal, one dip to black.

**Music mood tag.** warm celebratory, soft tabla / strings, 80-95 BPM, drop at 3 s.

**Tier.** Free (seasonal feature in the Cinematic pack; surfaces in the picker from mid-October to mid-November and again for New Year, available year-round from search).

**Preview loop.** A single flame is already burning in slow motion on frame one inside tall bars with a gold Devanagari wish over it.
On the drop a flare opens onto strings of lights and sparkler trails, ending on a brand name and wish card.

---

## Tier summary

| # | Template | Tier | Length | Letterbox default | Look | Overlays | What Pro buys |
|---|----------|------|--------|-------------------|------|----------|---------------|
| 1 | Slow Burn | Free | 15-24 s | tall cinema | Outdoor Teal-Orange | 2 | — |
| 2 | Beat Drop Walk (Walk / Dump) | Free | 10-15 s | off | Moody Night (soft) | 0 | — |
| 3 | Hero Frame | Pro | 10-18 s | off | Outdoor Teal-Orange | 1 | centred speed curve + freeze-and-title |
| 4 | Print Stock | Pro | 20-45 s | off (inset) | Indoor Warm Film | 0 | inset-on-blurred-self + karaoke captions w/ Devanagari |
| 5 | Faded Memory | Pro | 15-30 s | tall cinema | Faded Print / Clean 35 | 2-3 | film-burn transition + analog pipeline |
| 6 | Title Card (Short / Long) | Free | 3.5 s / 5-10 s | tall cinema | Neutral print | 1 | — |
| 7 | Silver | Pro | 12-20 s | off | Silver | 0-1 | word-per-cut stack + silence-freeze + ramp |
| 8 | Night Lights | Free (seasonal) | 12-20 s | tall cinema | Warm film, gold | 2 | — |

Four Free, four Pro. Free covers the two most-searched intents (travel cinematic, slowed walk / dump), a universal intro, and the seasonal greeting. Each Pro template now holds something a Free user visibly cannot build in Verso: Hero Frame's centred speed curve with freeze-and-title, Print Stock's widescreen-inside-vertical layout with karaoke captions, Faded Memory's film-burn and analog pipeline, Silver's word-per-cut trailer stack.

## Open items for engineering

1. [ENGINE REQUEST (a)] per-clip scale keyframes — used by #1, #2, #4, #6, #8; all ship static until then.
2. [ENGINE REQUEST (b)] source-fps read — used by #1, #3, #7, #8 slot hints; manual toggles until then.
3. [ENGINE REQUEST (c)] inset slot with blurred self background — #4; letterbox-on-black fallback shipped.
4. [ENGINE REQUEST (d)] image sticker upload — #8 logo; text fallback shipped.
5. [IF AVAILABLE] audio bus and bundled CC0 SFX set — all templates render without it.
6. Beat-snap tolerance (+/-0.25 s, slot flex +/-15%) needs to be exposed as a per-template constant so the beat-synced-cuts feature reads it instead of fighting the listed times.

---

<!-- Pack: Podcast (source: podcast.md, verbatim) -->

# Verso Template Pack: Podcast (rev. 2)

Eight original templates for turning long podcast and interview recordings into reels-first clips. Built for Indian video-first podcasters and YouTubers who are not editors: drag footage into the slot, type a headline, export.

All designs are Verso originals. Formats are described generically; no third-party template, asset name or brand is referenced.

Revision notes: rev. 2 keeps eight templates but swaps the former "Speaker Switch" (a layout feature, not a look) for a beat-synced **Hot Take Montage**, folds the per-segment layout-state system into Two-Up Exchange as a Pro unlock, adds a text-first cold open and a question-reply state to Headline Clip, adds a "receipt card" overlay to Chapter Card and Hot Take Montage, modernises the cinematic cues (halation/bloom, micro-drift, single anamorphic streak; light leak now opt-in), and states every engine dependency explicitly.

## Pack-wide defaults (baked into every template)

- Canvas: 9:16, 1080x1920, export H.264 30fps. 16:9 and 1:1 variants where noted.
- Safe zone guide visible in the editor: bottom ~20% and right ~12% reserved for platform UI. Captions sit in the 50-78% height band. Nothing touches the bottom edge.
- Three text styles per template, visually distinct so a viewer can tell them apart at a glance: Headline (biggest, boldest), Point/Caption (mid, readable), CTA/Tag (small, accent colour).
- Hook rule: speaker audio starts at frame 0 in every template (cold audio). No template opens on black, a logo or an intro; a title or claim card may sit over the opening picture for at most 2s (Chapter Card: 3s, then shrinks to a corner tag). Hook slot auto-limited to 3s.
- Fonts: **Google Fonts / OFL builds only**, pinned by file. Latin: Poppins, Inter, Montserrat, Oswald, Bebas Neue (the Google Fonts OFL release only; the commercial "Pro" family and the original foundry release are not licensed and must not be substituted), Anton, Cormorant Garamond, JetBrains Mono. Indic coverage: Noto Sans Devanagari, Hind, Mukta, Baloo 2, Noto Sans Tamil, Noto Sans Telugu. Every template ships Hinglish placeholder copy with a one-click English / Hindi / Hinglish swap on every text layer, including lower thirds, show tags and closing tags (Hindi variants listed per template).
- Text size floors at 1080 wide: Latin 56px; Devanagari / Tamil / Telugu 64px. Indic styles use auto line-height (1.45 for Devanagari, 1.5 for Tamil/Telugu, versus 1.2 Latin) so matras, vowel signs and stacked conjuncts never clip; caption plates, pills and rounded boxes size from the measured text box, not a fixed height. Karaoke chunks drop to 2-4 words in Indic scripts.
- Audio bus (one definition, used everywhere below): VO peaks -6 dBFS. Music bed sits at -18 dBFS and is ducked to -24 dBFS whenever VO is present (that duck is the whole 6 dB; nothing further is applied), 50-100ms attack / 200ms release. SFX -22 dBFS, under 300ms, max two per clip (Hot Take Montage: max four, see template 3). Music eases out over the final 20%. Master is loudness-normalised to -14 LUFS integrated with a -1 dBTP ceiling so platform normalisation does not re-level the clip.
- Licensing of everything that ships in the pack: music, SFX, placeholder footage, headshots, B-roll, receipt-card stills and preview-thumbnail renders are own-shot/own-rendered by Agape Labs or CC0. No stock-site previews or watermarked comps, no clips of real podcasters or recognisable public figures, no platform emoji glyphs. Grain and light leaks are procedural (generated in-engine), never scanned plates. Every .cube LUT is authored in-house from the curve targets described in its template and is not derived from, sampled from, or named after any commercial film-stock emulation pack.
- Icons and stickers: own-drawn SVG set (bookmark, arrow, circle, number badges 1-6, speech bubble, quote marks) or glyphs from an OFL emoji family. The engine never rasterises operating-system or messaging-app emoji into exported video.
- Effect stacking rule: maximum two stacked looks per clip (LUT + grain, or LUT + letterbox), never everything at once.
- Caption presets available in every template: Karaoke (word-highlight), Chunk (3-5 word pop; 2-4 in Indic), Plate (sentence-case on semi-transparent pill). Cinematic templates default to Plate with Karaoke as a toggle.
- Lower-third / caption collision rule: whenever a lower third is on screen, Karaoke/Chunk captions lift to the 50-58% band; the lower third sits at 80% height inside the safe zone (never inside the caption band). Headlines that live on the 50% seam (Two-Up Exchange) push captions to 62-70% for the duration of the headline hold.
- Preview thumbnails loop for 3s starting at each template's marked **preview-in** point (default frame 0; templates may mark a later point so the gallery shows the signature move). Placeholder footage follows the licensing rule above.

Tier split: 4 Free, 4 Pro. Free templates cover the everyday clip jobs; Pro templates carry the cinematic grade stacks, beat-synced cutting and sound design.

### Engine additions this pack depends on

Listed once so implementation can plan; each template names which it uses.

- **E1 Slot scale keyframes / punch presets:** per-slot scale and position keyframes with ease presets ("punch 115", "punch 125", "slow push 100-106", "settle 104-100"). Currently "zoom" exists only as a transition.
- **E2 Background blur fill:** Gaussian blur (radius up to 60px at 1080) on a slot copy. Until shipped, the engine uses the described fallback: a dark gradient fill (sampled dominant colour of the clip, darkened 60%, 80% vignette) behind the inset.
- **E3 Shape / gradient layer + mask:** rectangle and rounded-rectangle shapes with keyframable width, linear gradient fills, circular and rounded-corner masks on a slot. Fallback: ship the fixed states as own-drawn PNG/SVG stickers (badges 1-6 as six stickers, gradient band as a PNG, progress bar in 11 fill-steps as stickers).
- **E4 Audio: unlinked audio in a slot (J-cut offset in frames), two music-volume keyframes per clip ("breath" dips), and a CC0 SFX pack shipped with Verso (whoosh soft/sharp, impact soft/hard, riser 1s, bass hit, pop, tick). Mood beds ship with marked downbeats so beat-synced cuts and dips snap to them.**
- **E5 Manual markers in place of auto detection:** speaker-change marker (one tap), crop-centre drag per slot, punch-in marker, callout-position drag. No ASR, diarization or face detection is assumed anywhere in this pack. If those arrive later they pre-place the same markers; the creator still confirms.
- **E6 Frame blending on speed ramps** (simple blend, not optical flow) and a source-fps check.
- **E7 Halation / bloom** (highlight threshold + soft radius) and a single procedural anamorphic streak (horizontal, cool white or warm, 300-500ms). Procedural, like the existing light leak and flare.

---

## 1. Headline Clip

**Tier:** Free
**Purpose:** The workhorse. One speaker, one strong line, big headline on top, word-highlight captions. Works muted. Its signature move is the **Question / Answer state**: the headline can split into a pinned question bubble at the top and a bold answer line that lands under the face on the key word, so a clip reads like a reply to a comment or a listener question.

**Canvas:** 9:16 (1:1 variant for feed)
**Duration:** 15-45s, default 25s

**Slots**
1. Speaker slot (full frame, single talking head, 4K source recommended). Punch pattern (E1): 100% to 115% on creator-placed punch markers every 3-5s; one 125% hit allowed on the key word. The editor pre-suggests markers at every caption chunk boundary; the creator keeps or drags them.

**Opener options** (picker, default A)
- A. Cold open: speaker audio and picture from frame 0, headline pops on frame 0.
- B. Claim card: 1.2s bold claim text over the frozen first frame (70% black box), speaker audio already running underneath; card pops out at 1.2s and the picture resumes. The claim becomes the headline.
- C. Question / Answer: a question bubble (own-drawn speech-bubble shape, E3) sits pinned at the top from frame 0; the answer line pops in below the face at the marked key word and holds 2.5s.

**Timing beats**
- 0.0s: clip starts mid-sentence on the strongest line; audio at frame 0.
- 0.0-4.0s: headline (or question bubble) holds; headline fades over 0.4s, bubble stays until the answer lands then fades.
- 4.0-7.0s: compact lower third slides in from the left at 80% height; captions lift to 50-58% for those 3s.
- Every 3-5s: punch-in or punch-out on a marker (pattern interrupt).
- Last 1.5s: no outro card; music fades; clip ends on the last strong word so the loop back to frame 0 feels natural.

**Text layers**
- Headline: top safe zone, 2 lines max, 6-8 words. Preset: pop. Font: Poppins ExtraBold (Latin) / Hind Bold (Devanagari). White on a 70% black rounded box (box height from measured text), or bone white with 4px dark outline. Placeholder: "Yeh baat koi nahi batata | Startups". Hindi: "ये बात कोई नहीं बताता | स्टार्टअप्स".
- Question bubble (opener C): Inter SemiBold 48px (Indic 56px), dark text on an off-white bubble, small "Q" tag in the accent colour. Placeholder: "Pehla hire kaun hona chahiye?" Hindi: "पहला हायर कौन होना चाहिए?"
- Answer line (opener C): Poppins ExtraBold 64px (Indic 72px), accent colour, pop, below the face at 60% height. Placeholder: "Koi bhi jo bech sake." Hindi: "कोई भी जो बेच सके।"
- Lower third: name (Montserrat SemiBold) + role or show (Inter Regular) with a 6px accent bar on the left edge (E3 shape, or the own-drawn bar sticker). Preset: slide (left). 80% height, left-aligned, inside the safe zone. Placeholder: "Riya Sharma / Founder Talks". Hindi: "रिया शर्मा / फ़ाउंडर टॉक्स".
- Captions: Karaoke preset, 2-5 words (2-4 Indic), Poppins Bold 56-60px / Hind Bold 64px, white fill, 4px dark outline, active word in the pack accent (electric yellow #FFD60A by default) with 6% scale-up. Centred at 50-78% height; 50-58% while the lower third is on.

**Colour / LUT / overlays:** none by default (clean, natural). Optional "Lift" micro-grade: +5 contrast, +3 warmth, no grain. Accent colour token swappable per show.

**Transitions:** cut only (punch-ins are E1 scale keyframes, not transitions).

**Music mood tag:** none, or `lo-fi bed` on the pack audio bus.

**Preview thumbnail animation** (preview-in: frame 0; placeholder footage own-shot/CC0)
Frame 0: headline pops onto a talking head; captions start lighting word by word in yellow.
At 3s the frame punches in 15% on a hard cut and the lower third slides in at 80% while the captions lift, then the loop restarts.

---

## 2. Two-Up Exchange

**Tier:** Free (layout-state system is a Pro unlock, see below)
**Purpose:** Guest and host stacked top/bottom so both faces stay large during a back-and-forth. Reactions carry meaning in a conversation; this keeps them visible without black bars.

**Canvas:** 9:16 full bleed (1:1 side-by-side variant)
**Duration:** 15-40s

**Slots**
1. Top slot: 1080x960, guest camera feed.
2. Bottom slot: 1080x960, host camera feed.
Both slots one-drag swap; both accept a 16:9 source. The crop centre is dragged once per slot by the creator (E5); the editor opens with the crop at frame centre and a "drag to the face" hint.

**Speaker emphasis (manual):** the creator taps a speaker-change marker on the timeline while scrubbing (E5; keyboard: one key per speaker). At each marker the listening half dims 10% with a 200ms ease, no cut. No automatic speaker detection is assumed.

**Pro unlock: Layout States.** Each segment between markers can pick a layout state: (S) stacked two-up (default), (A) single full-frame on the speaker, (W) wide two-shot with background fill (template 7's technique, E2 or its gradient fallback). A per-segment toggle, no keyframing. Suggested rule shown as a tip, not enforced: short replies stay stacked, longer answers go full-frame. One optional 115% punch (E1) per full-frame segment.

**Timing beats**
- 0.0s: audio from frame 0; hook headline pops over the seam, holds 3s, fades. Captions sit at 62-70% during the hold, then return to 55-70%.
- 0.0-3.0s: both feeds visible; the first speaker's half at 100%, the other dimmed 10%.
- Every marker: dim swap (or state change on a hard cut in the Pro unlock).
- Optional 2px divider line in the accent colour along the seam (E3 shape or sticker), fading in at 0.5s.
- End: last frame matches first (same crop and dim states) for loop-safe replay.

**Text layers**
- Headline: centred on the seam, 2 lines, Oswald Bold (Latin) / Noto Sans Devanagari Bold. Preset: pop. White on 65% black plate. Placeholder: "Host ne sawaal poocha, guest chup ho gaya". Hindi: "होस्ट ने सवाल पूछा, गेस्ट चुप हो गया".
- Captions: Karaoke preset, centred in the bottom half at 55-70% frame height (62-70% during the headline hold), 2-4 words, Poppins Bold 56px / Hind Bold 64px, accent highlight. Caption colour flips between two accents (guest = accent A, host = accent B) at each speaker marker so the reader knows who said it.
- Tags: tiny name tag per half (Inter Medium 36px / Mukta Medium 42px, upper-left of each half, 50% opacity), always on. Placeholder: "Guest: Arjun" / "Host: Neha". Hindi: "गेस्ट: अर्जुन" / "होस्ट: नेहा".
- Pro lower thirds (Layout States): per speaker, slide-in at 80% height on their first full-frame segment, auto-out after 3s.

**Colour / LUT / overlays:** matched exposure nudge between slots (manual slider with a "match" button that equalises mean luminance; no scene analysis beyond that). Optional light vignette 12% on each half to separate them. Pro unlock adds a neutral "Studio Match" .cube at 45% across all slots so two or three cameras look like one grade (in-house curve: flattened contrast, neutral white point, skin saturation held; not derived from any commercial emulation). No grain.

**Transitions:** cut only; speaker emphasis via dim swap. Pro unlock: cut between states, one punch per 3-4 cuts, soft whoosh from the shipped SFX pack on the punch.

**Music mood tag:** none, or `lo-fi bed`.

**Preview thumbnail animation** (preview-in: frame 0)
Two faces stacked; a headline pops onto the centre seam while the lower face dims 10%.
At 1.8s the dim flips to the upper face as the other speaker answers and the captions switch accent colour; loop.

---

## 3. Hot Take Montage

**Tier:** Pro
**Purpose:** The fast one. Three to five soundbites from one episode (or one guest across episodes) cut on the beat at 0.8-1.2s per shot for the opener, then settling into a single take. Opens text-first with a 1.2s claim card. This is the pack's only rapid-cut, beat-synced template and the one that looks like 2026 rather than 2022.

**Canvas:** 9:16
**Duration:** 15-30s, default 20s

**Slots**
1. Claim-card slot (0-1.2s): the first soundbite's frame, held, under a bold claim card (70% black box). Audio of soundbite 1 runs from frame 0.
2-6. Soundbite slots (3-5): one line each, 0.8-1.2s for the opening montage, chosen by the creator with a scrub-and-mark. Each slot auto-snaps its out-point to the nearest downbeat of the mood bed (E4 downbeat markers; snap can be disabled).
7. Main take slot: the strongest soundbite in full, 8-18s.
8. Optional receipt slot: a screenshot, chart or stat card (own asset) that slides in beside the face for 2-3s on a marker (E3 rounded-corner mask, 420px wide, 24px radius).

**Timing beats**
- 0.0s: audio from frame 0; claim card pops in with a soft impact; at 1.2s the card snaps out on a beat.
- 1.2-6.0s: montage, hard cuts on downbeats, each cut with a 110% punch-in (E1) that resets on the next shot; a 2-frame white flash on the last cut only.
- 6.0s: dip to the main take with a 6-frame crossfade; music drops 6 dB (E4 keyframe) and the caption preset switches from Chunk to Karaoke.
- One receipt slide-in (if used) on the marker; 300ms slide from the right, ease-out, 2-3s hold, slide back.
- Final line: hard cut to the show tag on black for 0.8s (this template is not loop-safe by design; it ends on a tag).

**Text layers**
- Claim card: Anton (Latin) / Baloo 2 ExtraBold (Devanagari), uppercase, 2 lines, centred, pop with 104-100 settle. Placeholder: "80% PODCASTS 10 EPISODES SE PEHLE BAND". Hindi: "80% पॉडकास्ट 10 एपिसोड से पहले बंद".
- Soundbite tag: one word or name per soundbite, Oswald Medium 44px (Indic 52px), accent colour, top-left safe zone, pops per cut (own-drawn quote-marks sticker optional).
- Captions: Chunk preset during the montage (one chunk per shot, 2-4 words, Poppins Bold 60px / Hind Bold 68px), Karaoke during the main take, 50-70% band.
- Receipt caption: Inter Medium 40px small caps under the card, "Source: own data, 2026" style; Hindi "स्रोत: अपना डेटा, 2026".
- Show tag: JetBrains Mono 36px, centred on the closing black, typewriter. Placeholder: "The Builder Hour | Ep. 12". Hindi: "द बिल्डर आवर | एपिसोड 12".

**Colour / LUT / overlays:** "Punch" micro-grade (in-house: +8 contrast, +6 saturation, skin held) at 100%; vignette 12%. No grain, no letterbox (two-effect rule kept as grade + vignette). Optional bloom (E7) at 8% on the claim card only.

**Transitions:** hard cuts on downbeats; one 6-frame crossfade into the main take; one dip to black at the end. SFX from the shipped CC0 pack: soft impact on the claim card, tick on each montage cut (counts as one SFX group, max four ticks), soft whoosh on the receipt slide. Montage SFX cap: four in total.

**Music mood tag:** `upbeat drive` or `trap-lite`, 90-110 BPM, downbeat-marked bed. Follows the pack audio bus; additional -6 dB keyframe at 6.0s.

**Preview thumbnail animation** (preview-in: frame 0)
A bold uppercase claim slams over a frozen face; at 1.2s it snaps out and three faces cut past on the beat, each punching in 10%.
At 2.8s the cut lands on the main speaker as a caption chunk pops, then loop.

---

## 4. Cinema Cut

**Tier:** Pro
**Purpose:** The flagship cinematic podcast clip. Letterbox, one film-print style grade, light procedural grain, slow push-ins, subtle handheld micro-drift, halation on highlights, calm plate captions. For reflective monologues, founder stories, interviews that deserve to look like a documentary.

**Canvas:** 9:16 with letterbox bars (default visible window 1080x1350 "tall cinema"; ratio picker 1.85 / 2.35 / 2.39 for a stricter widescreen inset). 16:9 export of the same timeline without bars for YouTube.
**Duration:** 25-45s

**Slots**
1. Opening slot (0-2s): speaker clip; audio from frame 0, picture fades up over 0.3s under the title.
2. Speaker slot A (main monologue, slow push 100% to 106% over the slot, E1 "slow push" preset, plus micro-drift: 2px/3s random-walk position wobble, E1).
3. B-roll slot 1 (2-3s cutaway on the first key noun).
4. Speaker slot B (continues, fresh crop 104%).
5. B-roll slot 2 (2-3s).
6. Closing slot (speaker, last line, slow 102% drift, dip to black).

**Timing beats**
- 0.0s: speaker audio starts cold; picture fades up from black over 0.3s (never a black hold).
- 0.0-1.8s: title blur-in at 0.2s, holds, blurs out by 1.8s. Speaker is visible under it from 0.3s.
- ~9s and ~20s: B-roll cutaways with 14-frame crossfades; VO leads the picture by 8 frames (J-cut, E4 unlinked audio).
- Midpoint: one dip-to-black chapter break, 10 frames black, soft impact on the black-to-picture frame.
- Final 3s: closing line, 0.6s music breath before it (E4 keyframe), dip to black with location/date tag.

**Text layers**
- Title: Cormorant Garamond SemiBold (Latin) / Mukta SemiBold (Devanagari, tracking +6%), uppercase, tracking +18% Latin, bone white (#F3EFE6), centred inside the visible window. Preset: blur-in. Placeholder: "EPISODE 42 | ON FAILING WELL". Hindi: "एपिसोड 42 | हार से सीखना".
- Captions: Plate preset only. Inter Medium 56px / Noto Sans Devanagari Medium 64px, sentence case, 2-5 words (2-4 Indic), on a 55% black rounded plate sized from the text box, fade per line, no per-word animation. Locked to the inner safe area of the letterbox window.
- Closing tag: Inter Light small caps, tracking +10%, blur-in on the final dip. Placeholder: "Mumbai, 2026". Hindi: "मुंबई, 2026".
- Lower third: editorial style, thin grotesk small caps (Inter Light), typewriter reveal, once, on the first line, at 80% of the visible window. Placeholder: "Aditi Rao / Founder, Kiln Studio". Hindi: "अदिति राव / फ़ाउंडर, किल्न स्टूडियो".

**Colour / LUT / overlays:** "Print Stock Warm" .cube at 65% (in-house curve targets: warm highlights +4 toward amber, shadows nudged 3 toward cyan, skin hue and saturation protected, soft shoulder; authored from scratch, not from any commercial film emulation). **Procedural film grain** 12%, screen blend, scaled to canvas, luminance-weighted. Halation/bloom (E7) at 10% on highlights above 85%. Vignette 18% feathered. Letterbox bars pure black with optional 5% feathered edge. Light leak: **off by default**; opt-in procedural warm amber, capped at exactly twice (title frame, chapter break). Indoor talking heads default to this warm/neutral stock.

**Transitions:** crossfade (14 frames) between speaker and B-roll; dip to black at the chapter break and the end. No slides or zooms (bars make them look cheap). SFX from the shipped CC0 pack: soft whoosh centred on each crossfade, soft impact on dip-to-black return, 1s riser before the closing line (two SFX rule: riser + impact; whooshes are optional and off by default).

**Music mood tag:** `cinematic ambient`, 70-90 BPM, pack audio bus.

**Preview thumbnail animation** (preview-in: frame 0)
A speaker fades up in 0.3s between letterbox bars as a wide-tracked serif title blurs in over them; highlights carry a soft halation.
At 1.8s the title blurs out and the frame pushes in slowly with fine grain as a sentence-case caption fades onto a dark plate.

---

## 5. Night Mood

**Tier:** Pro
**Purpose:** The dark, moody cinematic variant for late-night conversations, hard truths and trailer-style soundbites. Cool grade, heavier procedural grain, high-contrast condensed type, hard cuts with impacts, two freezes instead of slow motion. Built to stop a scroll in a feed full of bright clips.

**Canvas:** 9:16, letterbox optional (off by default so the grade reads full-bleed; "Silver" grade plus grain is already two effects).
**Duration:** 15-30s

**Slots**
1. Cold-open slot (0-2s): speaker on the key line, 100%.
2. Speaker slot B: 112% crop (E1 static scale).
3. Speaker slot C: gesture or glance. Default: a 0.4s freeze (first freeze) on the gesture peak. Optional speed ramp 100 -> 80 -> 100% with frame blending (E6), only when the source is 60fps or higher; on 24/30fps sources the ramp control is locked and the slot shows "freeze used instead" (no judder, no interpolation claims).
4. Freeze slot: 0.5s freeze (second freeze) on the reaction face at the strongest claim.
5. Speaker slot D: closing line.

**Timing beats**
- 0.0s: hard open, audio from frame 0, no fade; headline slams in with a soft impact.
- 0.0-2.0s: headline holds, exits with a 2-frame jitter.
- Cuts land on sentence breaks and on downbeats of the tense bed (E4 markers); max 1 cut per 3s.
- Riser from 1s before the second freeze; stops dead on the freeze frame; 0.4s planned silence (E4 keyframe); music returns.
- Final line: hard cut to black with the show tag.

**Text layers**
- Headline: Bebas Neue (Google Fonts OFL build) / Noto Sans Devanagari Black (Hindi), uppercase, tight tracking, off-white (#EDEDED) with a 2px crimson (#B3121F) underline bar (E3 shape or sticker). Preset: pop with 104-100 settle. Placeholder: "WOH 5 LAKH MAINE WASTE KIYE". Hindi: "वो 5 लाख मैंने बर्बाद किए".
- Captions: Chunk preset in Oswald Medium 58px / Noto Sans Devanagari Medium 64px, off-white, keyword in crimson, no plate, 4px outline; one position shift at the second freeze.
- Freeze-frame callout: one word in Anton 140px (Indic: Baloo 2 ExtraBold 140px), centred, pop, 0.5s. Placeholder: "WASTE". Hindi: "बर्बाद".
- Show tag: JetBrains Mono small, bottom of safe zone, 50% opacity, typewriter. Placeholder: "Late Night Ledger | Ep. 7". Hindi: "लेट नाइट लेजर | एपिसोड 7".

**Colour / LUT / overlays:** "Silver" desaturated high-contrast .cube at 70% (in-house curve targets: saturation -25, skin held at -12, open midtones, no crushed blacks, cool neutral white point; not a bleach-bypass emulation from any pack). **Procedural film grain** 18%, overlay blend. Vignette 24%. No letterbox by default. Light leak off; one procedural cool-white anamorphic streak (E7, 400ms) on the second freeze only.

**Transitions:** hard cuts; one dip to black at the end. SFX from the shipped CC0 pack: soft impact on the headline frame, riser into the second freeze, single bass hit on the freeze (max two bass hits per template; this uses one).

**Music mood tag:** `dark tension` or `trailer`, 80-100 BPM, downbeat-marked bed.

**Preview thumbnail animation** (preview-in: frame 0)
A desaturated, grainy face snaps in from black as an uppercase headline slams on with a crimson underline.
At 2.2s the frame freezes, a cool streak flashes across and a single giant word pops over the face before the loop.

---

## 6. Clip Countdown

**Tier:** Free
**Purpose:** For list-style soundbites ("3 habits", "5 numbers"): a top-pinned progress bar and numbered point badges give viewers a reason to stay to the last item. Hinglish-first educational variant included.

**Canvas:** 9:16
**Duration:** 20-45s (3s hook + 3-6 points at 5-7s + 3s outro)

**Slots**
1. Hook slot (0-3s): speaker, the stat or claim that frames the list.
2-7. Point slots (5-7s each, 3-6 points): speaker or swappable B-roll per point.
8. Outro slot (3s): speaker or still, "Save karo" CTA.

**Timing beats**
- 0.0s: audio from frame 0; hook text typewriter-in over the speaker; progress bar appears at 2% fill.
- 3.0s: slide transition to point 1; number badge pops in the upper-left safe zone; point text slides in from the right.
- Each point change: slide transition on a downbeat (E4), badge swaps to the next own-drawn badge sticker (1 -> 2 -> 3, six stickers shipped; or E3 shape with a text layer), progress bar steps (E3 keyframed width, or the 11-step bar stickers).
- Last point: badge pops 110% with a soft whoosh ("the best one is last" moment).
- Outro: own-drawn bookmark icon sticker (or OFL emoji-set glyph; never a platform emoji) + CTA text pop; progress bar reaches 100% and brightens once (200ms opacity pulse, E3 or sticker swap).

**Text layers**
- Hook: Poppins ExtraBold / Hind Bold, 2 lines, centred top-third on a 70% black box. Preset: typewriter. Placeholder: "90% creators yeh 3 numbers track nahi karte". Hindi: "90% क्रिएटर ये 3 नंबर ट्रैक नहीं करते".
- Point text: Montserrat SemiBold / Mukta SemiBold, one line, 60px (Indic 64px), white with an accent plate behind the number. Preset: slide (right). Placeholder: "1. Watch time, views nahi". Hindi: "1. वॉच टाइम, व्यूज़ नहीं".
- Captions: Karaoke preset throughout (mute viewing is the norm for educational content), 50-70% band.
- CTA: Baloo 2 Bold, accent colour, pop. Placeholder: "Save karo, baad mein kaam aayega". Hindi: "सेव करो, बाद में काम आएगा".

**Colour / LUT / overlays:** none; optional "Lift" micro-grade. Progress bar: 8px tall, pinned at top safe zone, inset 4%, fill in the accent colour, track at 30% white, rounded ends; reverse-fill countdown toggle.

**Transitions:** slide between points, cut elsewhere. SFX from the shipped CC0 pack: pop on each badge swap (one SFX group), soft whoosh on the last badge.

**Music mood tag:** `calm focus` or `upbeat light`, downbeat-marked bed, pack audio bus.

**Preview thumbnail animation** (preview-in: frame 0)
A hook line types itself over a speaker while a thin yellow bar creeps along the top edge.
At 2.4s the frame slides left, a "1" badge pops in the corner and the first point text slides in from the right.

---

## 7. Wide Shot Fit

**Tier:** Free
**Purpose:** For single-camera two-shots, slide decks and screen shares that a 9:16 crop would destroy. The 16:9 frame sits as an inset over a blurred, darkened copy of itself (or the gradient fallback); hook above, captions below. Its signature move is the **drift-and-point**: the inset drifts slowly, then punches in on a marker while an own-drawn "point" callout (arrow + circle) lands on the evidence at the same frame. Also the fallback layout for the Two-Up Exchange wide state and Chapter Card.

**Canvas:** 9:16
**Duration:** 15-45s

**Slots**
1. Inset slot: 16:9 clip fit-to-width (1080x608), placed at 38-55% height. Single drag fills both this and the background.
2. Background layer: same media auto-scaled to fill, Gaussian blur radius 60px, darkened 35% (E2). Until E2 ships: gradient fallback from the pack rule (dominant colour of the clip, darkened 60%, 80% vignette). Not user-editable.
3. Optional reaction inset (circular 320px mask, E3; fallback: a square 320px inset with a 24px rounded-corner sticker frame) bottom-right inside the safe zone for a creator camera.

**Timing beats**
- 0.0s: audio from frame 0; headline pops above the inset.
- 0.0-4.0s: headline holds then fades.
- Whole clip: inset drifts 100% to 104% with a 3px lateral micro-drift (E1).
- Punch marker (creator-placed, E5): inset punches to 125% (E1) for 2s, and the point callout (arrow + circle stickers in the accent colour) pops onto the dragged target position on the same frame; both release together.
- End: loop-safe, no outro.

**Text layers**
- Headline: Poppins ExtraBold / Hind Bold, 2 lines, centred at 18-30% height above the inset. Preset: pop. Placeholder: "Guest ne live chart dikhaya". Hindi: "गेस्ट ने लाइव चार्ट दिखाया".
- Captions: Karaoke preset, 2-4 words, Poppins Bold 56px / Hind Bold 64px, centred at 62-74% height below the inset.
- Point callout label (optional): Inter SemiBold 44px (Indic 52px) beside the circle. Placeholder: "Yahan dekho". Hindi: "यहाँ देखो".

**Colour / LUT / overlays:** inset untouched (fidelity for slides and charts); background blur + darken (or gradient fallback) only. Thin 2px accent border on the inset optional.

**Transitions:** cut only.

**Music mood tag:** none, or `lo-fi bed`.

**Preview thumbnail animation** (preview-in: frame 0)
A widescreen two-shot sits inset over its own blurred, darkened copy as a bold headline pops above it.
At 2s the inset punches in 25% on the chart while an arrow-and-circle callout lands on the number and a caption lights up word by word below.

---

## 8. Chapter Card

**Tier:** Pro
**Purpose:** The "big idea" clip: a chapter card opens over the speaking face for 3s then shrinks to a corner tag, the speaker delivers, two explanatory B-roll cutaways land on the lines that mention a product, stat or person, a one-word callout sits beside the face, and a **receipt card** (screenshot or stat) slides in beside the face when the speaker quotes a number. For clips you want to feel produced, not just cut.

**Canvas:** 9:16 (16:9 variant)
**Duration:** 25-45s

**Slots**
1. Card slot (0-3s): speaker clip, audio from frame 0, under a two-line chapter card on a 60% black gradient band (E3 gradient, or the shipped band PNG).
2. Speaker slot A.
3. B-roll slot 1 (2s cutaway, explanatory not decorative).
4. Speaker slot B (fresh crop).
5. Receipt slot (2-3s): screenshot, stat card or mentioned-person photo (own asset), 420px wide rounded-corner inset (E3 mask, 24px radius; fallback: rounded-corner sticker frame) with slide-in from the right. Or a second 2s B-roll.
6. Speaker slot C (closing line).

**Timing beats**
- 0.0s: speaker audio starts on the hook line; chapter card text slides up with a 104-100 scale settle (E1 on the text layer).
- 0.0-3.0s: card holds; at 3.0s the band fades and the chapter title shrinks (300ms) to a small corner tag at the top-left safe zone that stays on for the clip.
- ~10s and ~22s: B-roll / receipt cutaways with 12-frame crossfades; VO leads picture by 8 frames (J-cut, E4).
- At each cutaway: one-word callout pops in the third of the frame opposite the subject (creator drags its anchor once; E5) with a light whoosh, 1-5s.
- Midpoint: 0.5s music breath before the key claim (E4 keyframe).
- End: music eases out over the final 20%, loop-safe end on the last line.

**Text layers**
- Chapter card: Oswald Bold uppercase (Latin) / Noto Sans Devanagari Bold, tracking +5%, two lines: chapter number small (Inter Medium) over the chapter title big. Preset: slide (up) with scale settle. Bone white on the 60% black gradient band. Placeholder: "CH. 03 | PAISA KAHAN GAYA". Hindi: "अध्याय 3 | पैसा कहाँ गया".
- Corner tag (after 3s): the chapter title at Inter Medium 36px (Indic 42px), 60% opacity.
- Callouts: single word, Anton 96px / Baloo 2 ExtraBold 96px, accent colour, pop, anchored opposite the subject. Placeholder: "BURN". Hindi: "ख़र्च".
- Receipt caption: Inter Medium 40px small caps under the card. Placeholder: "Source: company blog, 2025". Hindi: "स्रोत: कंपनी ब्लॉग, 2025".
- Captions: Karaoke preset by default; Plate preset toggle for a calmer feel. Poppins Bold 56px / Hind Bold 64px, 50-70% band (lifted to 50-58% while the lower third is on).
- Lower third: name + show, slide-in once at the first line after the card, 80% height. Placeholder: "Kabir Mehta / The Ledger Show". Hindi: "कबीर मेहता / द लेजर शो".

**Colour / LUT / overlays:** "Teal-Orange Subtle" .cube at 55% is retained as an option for outdoor/product B-roll, but the default is "Print Stock Warm" at 50% (template 4's in-house curve) with bloom (E7) at 6% on highlights, which reads more current on faces. Both .cube files are authored in-house from the described curve targets (Teal-Orange Subtle: shadows nudged 4 toward teal, skin hue protected and warmed 2, no crushed blacks) and are not derived from or named after any commercial emulation pack. Vignette 14%; no grain (two-effect rule kept as LUT + vignette).

**Transitions:** crossfade 12 frames into and out of B-roll; cut between speaker slots; one slide-in for the receipt. SFX from the shipped CC0 pack: light whoosh on callout entry, pop on text entrances (one SFX group), soft whoosh on the receipt slide; whooshes on crossfades optional and off by default.

**Music mood tag:** `warm build` or `focus`, pack audio bus.

**Preview thumbnail animation** (preview-in: 1.5s)
A two-line chapter title sits on a dark gradient band over a speaking face; at 3.0s (1.5s into the preview) the band fades and the title shrinks to a corner tag.
A 2s receipt card slides in beside the face and a single bold word pops opposite the speaker before the loop.

---

## Quick reference

| # | Name | Tier | Canvas | Duration | Core trick | Grade stack |
|---|------|------|--------|----------|-----------|-------------|
| 1 | Headline Clip | Free | 9:16 (1:1) | 15-45s (25s) | Top headline + karaoke + punch markers; Q/A and claim-card openers | none / Lift |
| 2 | Two-Up Exchange | Free (+Pro Layout States) | 9:16 (1:1) | 15-40s | Stacked guest/host, speaker dim swap; Pro per-segment layout states | vignette / Studio Match 45% (Pro) |
| 3 | Hot Take Montage | Pro | 9:16 | 15-30s | 1.2s claim card, beat-synced 0.8-1.2s cuts, receipt slide-in | Punch grade + vignette |
| 4 | Cinema Cut | Pro | 9:16 letterbox / 16:9 | 25-45s | Print-stock grade, halation, micro-drift, serif title, plate captions | LUT 65% + procedural grain 12% |
| 5 | Night Mood | Pro | 9:16 | 15-30s | Silver grade, two freezes + streak, trailer type | LUT 70% + procedural grain 18% |
| 6 | Clip Countdown | Free | 9:16 | 20-45s | Progress bar + numbered badges, Hinglish CTA | none |
| 7 | Wide Shot Fit | Free | 9:16 | 15-45s | Blur-fill inset, drift-and-point punch | blur + darken (or gradient fallback) |
| 8 | Chapter Card | Pro | 9:16 (16:9) | 25-45s | 3s card to corner tag, explanatory B-roll, receipt card, callouts | LUT 50% + vignette + bloom |

Trending-format coverage: text-first cold open (T1 opener B, T3), question/comment reply (T1 opener C), rapid-fire beat-synced montage (T3), receipts overlay (T3, T8).

## Shared engine notes for implementation

- Engine additions E1-E7 (listed under pack-wide defaults) are the only capabilities assumed beyond the base list. Where a fallback is described, the template must render correctly with the fallback alone.
- Loop-safety: templates 1, 2, 6, 7, 8 enforce matching first/last crop states and continuous music across the loop point; no outro cards (CTA lives in the post caption). Templates 3, 4, 5 end on a tag or dip to black by design.
- Letterbox ratio picker (template 4): 1.85 / 2.35 / 2.39 / 2.76, default "tall cinema" 1080x1350 for podcasts; bar colour #000 with optional 5% feather; text layers auto-lock to the inner window.
- Speed-ramp guard (template 5): the ramp control is available only when the source is 60fps or higher; the minimum speed is 80% and frame blending (E6) is always on. Below 60fps the slot substitutes a 0.4s freeze and shows a one-line note.
- Caption position floor: no caption layer may be placed below 78% frame height; the editor snaps it back. Lower thirds live at 80% inside the safe zone and lift captions to 50-58% while on screen.
- Indic text: all headline and caption styles carry a Devanagari fallback (Hind / Noto Sans Devanagari / Baloo 2 / Mukta) and Tamil / Telugu fallbacks (Noto Sans Tamil / Telugu), the 64px floor and auto line-height, so a language swap never clips or breaks layout. Plates and boxes size from the measured text box.
- Fonts are bundled from Google Fonts OFL builds with their licence files; the font picker is locked to that bundle so a commercial variant cannot be substituted.
- Manual markers (E5): speaker change, punch-in, crop centre, callout anchor and receipt-in are all one-tap or one-drag. Templates never promise automatic detection of faces, speakers or sentence breaks.
- Audiogram fallback: any template accepts a still headshot (own or CC0) in the speaker slot; a slow 100 to 104% push (E1) and the Plate captions keep it from feeling dead.
- Preview thumbnails: rendered from own-shot/CC0 placeholder footage, starting at each template's preview-in point.

---

<!-- Pack: Creator Basics (source: creator-basics.md, verbatim) -->

# Verso — "Creator basics" template pack (revision 2)

Eight original templates for first-time short vertical video creators and long-form creators cutting clips for vertical. Each one is built around a format that is strong and trending in late 2026: beat-synced photo dumps, trailer-style teasers, cinematic letterbox edits, dramatic reveals, talking-head captions, long-form-to-vertical clips, Hinglish listicles, slowed-beat showcases. Every design below is Verso's own: formats and techniques are described generically, no third-party template is reproduced or named, and no platform is named in template copy.

All fonts are OFL. All music is CC0 or the creator's own. Every template ships placeholder copy in three versions (English, Hindi, Hinglish) in its notes panel; the creator pastes the version they want into the text layer. Devanagari fonts are pre-assigned on every text layer; Tamil and Telugu fonts ship in the pack and are picked per text layer.

---

## Engine capabilities this pack relies on

**Used as listed.** 9:16 / 1:1 / 16:9 canvases; video and photo media slots with one-drag swap; text layers with `pop`, `typewriter`, `slide`, `blur-in`, `karaoke captions`; .cube LUTs; film grain; vignette; letterbox bars; procedural light leak / flare; transitions `cut`, `crossfade`, `dip to black`, `slide`, `zoom`; speed ramps; freeze frames; beat-synced cuts; music mood tags; stickers / emoji layer.

**Assumed as basic slot properties (not new features).** A media slot has a static fit / fill scale and crop offset set once per slot (this is how a 16:9 clip sits in a 9:16 frame and how a "tight" copy of a talking-head slot is made). A music track has a fixed gain per slot range. The engine can read the source frame rate of a clip.

**Flagged for confirmation.** `karaoke captions` needs word timings. The pack assumes the preset includes speech-to-text with word timings, or a manual tap-along timing mode. If neither exists, every karaoke layer below falls back to a static `pop` caption line per sentence.

**Not used (capability requests only, no template depends on them).** Scale / position keyframes inside a slot (slow drift, push-in). Where a template would benefit, it is marked *optional once keyframes land*; the default build is static. Also not used: automatic silence removal, automatic audio ducking, blurred-fill picture-in-picture, animated progress shapes, sticker auto-renumbering, one-click language swap.

---

## Pack-wide scaffold (applies to all eight)

| Rule | Default |
|---|---|
| Canvas | 9:16, 1080x1920. Variants in 1:1 or 16:9, where noted, are separate layout presets with their own text anchors and slot crops, never a re-export of the 9:16 timeline |
| Export | 1080x1920, 30 fps, H.264, master peak -1 to -3 dB |
| Safe zone guide | Visible overlay: bottom 20% and right 12% reserved for platform UI; text locked out of both |
| Text styles | Three named styles per template: **Headline** (biggest, bold, high contrast), **Point** (medium, sentence case), **CTA / Marker** (smallest, accent colour). Size floors at 1080 wide: Headline 64 px, Point 52 px, CTA / Marker / badge / sticker text 44 px. Small caps only at 52 px or larger; CTAs below that are sentence case |
| Hook slot | First slot auto-capped at 3 s; hook text appears at 0.0 s |
| Hook starter library | Swappable placeholder hooks in five archetypes (negative callout, shortcut, secret, quantified result, failure), English and Hinglish (Rs / lakh formatting) |
| Fonts | Latin: Inter, Poppins, Montserrat, Oswald, Bebas Neue, Anton, Cormorant Garamond, Space Mono. Indic: Noto Sans Devanagari, Hind, Mukta, Baloo 2, Noto Sans Tamil / Telugu |
| Audio bus | VO peaks -6 dBFS. Music sits at -12 dBFS; on any slot the creator flags **has VO**, the music track is set to -22 dBFS for that slot range with a 100 ms ramp in and out (a per-slot level, not automatic detection). SFX -22 dBFS, under 300 ms, max two per template. Music eases down over the final 20% |
| Transition SFX | Optional, CC0: soft whoosh centred on crossfade, sharp whoosh straddling slide / zoom, impact on the black-to-picture frame of a dip, pop on text entrance, 1 s riser ending on a reveal |
| Effect stacking | One LUT plus up to two full-clip finishing overlays (grain, vignette, letterbox). Light leaks are transition-scoped (400-600 ms) and do not count against the stack |
| Slow motion | Any slot with a speed ramp below 1.0x shows a "shoot this at 60 fps" prompt on media swap. If the dropped clip is under 50 fps, the ramp is auto-capped at 0.75x to avoid stutter |
| Emoji | Never inline in a text layer (falls back to system glyphs). Use the sticker / emoji layer beside the text |
| Loop | Templates marked "loop-safe" match first and last frame crop and keep music continuous across the loop point |

---

## 1. Photo Dump

**Purpose.** Beat-synced slideshow or recap: photos or clips, one hard cut per beat group, one word per cut. Week recap, trip dump, event roll-up, 30-day progress. Zero dead air. Replaces the earlier separate recap and process-video templates: process videos use the "Marker" text layer; nostalgic dumps use the "Film Memory" look.

**Canvas.** 9:16 (1:1 layout preset available). **Duration.** 15-24 s (standard). Loop-safe.

**Slots.**
1. `hook` — 1.44 s (3 beats), opens on motion or the strongest photo.
2-9. `beat-01` … `beat-08` — 0.96 s each (2 beats). Photos or clips. Slot floor 0.96 s.
10-14. `beat-09` … `beat-13` — 1.44 s each (3 beats) as the track opens up.
15. `hero` — 2.88 s (6 beats), best clip; speed ramp 1.0x -> 0.75x -> 1.0x centred on the slot midpoint (clip slots only; a photo plays static).

**Timing beats (19.2 s preset = 40 beats at 125 BPM, beat 0.48 s).**
- 0.00 s: framing text "Ek hafta, 19 second mein" pops over `hook`.
- 1.44 s: cuts every 2 beats: 1.44 / 2.40 / 3.36 / 4.32 / 5.28 / 6.24 / 7.20 / 8.16 s.
- 9.12 s: cuts every 3 beats: 9.12 / 10.56 / 12.00 / 13.44 / 14.88 s.
- 16.32 s: `hero` enters with a `zoom` transition; speed dip is centred on 17.76 s (beat 37).
- 19.20 s: loop point; last frame crop matches `hook`.
- 24 s preset: adds five more 0.96 s slots after `beat-08` (+4.80 s = 24.00 s); 15 s preset drops `beat-05`-`beat-08` and `beat-13` (-5.28 s) and holds `hero` one beat longer (+0.48 s) = 14.40 s, 30 beats exactly.

**Text layers.**
| Layer | Copy | Preset | Font |
|---|---|---|---|
| Headline (framing) | "Ek hafta, 19 second mein" | `pop`, hold 1.44 s, exit | Montserrat ExtraBold 80 px / Baloo 2 for Devanagari |
| Point (per-cut word) | "Mon" / "Gym" / "Chai" / "Deadline" / "Done" | `pop` on each cut, 1 word or 2-3 word phrase | Montserrat Bold 64 px |
| Marker (optional, process videos) | "Day 1" / "6:40 AM" / "Final" | `typewriter` 0.4 s, top-left corner inside safe zone | Space Mono Bold 44 px uppercase, white, 2 px shadow |
| CTA (last frame) | "Save for Monday" | `slide` up from the Point position | Montserrat SemiBold 48 px, sentence case |

**Looks.**
- Default "Clean": "Bazaar Pop" LUT at 50% (slight contrast + saturation lift). No grain, no letterbox.
- Variant "Film Memory" (nostalgic, strongly trending): "Chai Warm" LUT 60%, grain 18% screen blend, vignette 15% feathered; cuts become 10-frame `crossfade`s centred on the same beat positions; a date stamp "12 . 10 . 26" types in bottom-left (Space Mono 44 px) and holds for the whole clip.
- Variant "Tyohaar" (festival greeting): same grid, `hero` becomes a 2.88 s greeting card on a deep maroon plate with "Shubh Deepavali" / "Happy Diwali" in Cormorant Garamond SemiBold 84 px and a diya sticker from the sticker layer. Generic artwork only, no licensed characters or brand marks.

**Transitions.** `cut` on all beats (default look); one `zoom` into `hero`. Sharp whoosh straddling the zoom only.

**Music mood tag.** `upbeat / energetic`, 120-130 BPM (Film Memory: `warm / nostalgic`, 90-110 BPM with the grid retimed to the chosen track). **Tier.** Free.

**Preview thumbnail animates.** Thirteen photos and clips flash past at beat speed, a single bold word punching in with each one.
The last clip slows for a half-second hero moment, then the loop restarts without a visible seam.

---

## 2. Teaser

**Purpose.** A 15 s trailer for anything: a launch, a vlog, a wedding film, a course, a cricket-weekend plan. Text cards on black, dip-to-black rhythm, letterbox, one typewriter title, two impacts. Cinematic feel with three clips and zero grading skill. Fully buildable with current capabilities.

**Canvas.** 9:16 with letterbox bars (inner 2.39:1). **Duration.** 12-15 s (micro).

**Slots.**
1. `card-1` — text card, no media, black plate, 2.0 s.
2. `clip-A` — 2.5 s, the widest or most atmospheric shot.
3. `card-2` — text card, black plate, 1.8 s.
4. `clip-B` — 2.2 s, a face or a hand doing something.
5. `clip-C` — 1.6 s, the fastest motion you have.
6. `title` — black plate, 2.4 s, the title types in.
7. `end` — 2.0 s, end card over `clip-A` frozen on its last frame (freeze frame), fades to black.

**Timing beats (15 s preset).**
- 0.0-0.5 s: black.
- 0.5 s: card 1 types in "Sab kuch plan tha." (2.0 s card, type 0.9 s, hold 1.1 s).
- 2.5 s: `dip to black` (short, 6 frames) into `clip-A`; impact SFX on the first picture frame (SFX 1 of 2).
- 5.0 s: `dip to black` into card 2 "Phir ek call aaya." (type 0.8 s, hold 1.0 s).
- 6.8 s: `dip to black` into `clip-B`.
- 9.0 s: hard `cut` to `clip-C`.
- 10.6 s: `dip to black`; impact SFX (SFX 2 of 2); title types in "KAL. 7 PM." over 1.0 s, holds to 13.0 s.
- 13.0 s: `end` slot, freeze frame of `clip-A`, end line blurs in, music eases out, fade to black at 15.0 s.

**Text layers.**
| Layer | Copy | Preset | Font |
|---|---|---|---|
| Card lines | "Sab kuch plan tha." / "Phir ek call aaya." | `typewriter`, centred in the letterbox window | Cormorant Garamond Medium 68 px, bone white, tracking +6% |
| Headline (title) | "KAL. 7 PM." | `typewriter` 1.0 s, hold 1.4 s | Bebas Neue 132 px, tracking +14%, white |
| End card | "shot on a phone" / "@yourhandle" | `blur-in`, hold till black | Oswald Light 52 px small caps |

All text locked to the inner letterbox window.

**Colour / overlays.** "Raat Noir" LUT at 50% (cool shadows, held skin), grain 12% screen blend, letterbox (LUT + two overlays). No vignette, no light leaks.

**Transitions.** `dip to black` (6 frames) as the rhythm, one `cut`. No slides, no zooms.

**Music mood tag.** `cinematic / tension / drone`, 80-100 BPM or beatless; impacts are the only percussive element. **Tier.** Free.

**Preview thumbnail animates.** A serif line types onto black, the frame snaps to a wide graded shot with a thud, and bars sit top and bottom.
Two more flashes of picture, black again, and a tall condensed title hammers itself out letter by letter.

---

## 3. Dhoop

**Purpose.** The cinematic travel, vlog or wedding edit: letterbox, warm film grade, grain, a slow build that lands on the beat drop. Signals production value with footage straight off a phone. Variant "Shaadi" relabels the same slots for a sangeet / wedding highlight.

**Canvas.** 9:16 with letterbox bars (inner 2.39:1 by default; ratio picker 1.85 / 2.35 / 2.39; "Tall cinema" variant with thinner bars to a 1080x1350 window). No 16:9 export of this timeline; a 16:9 layout would need its own crops and text anchors and is not part of this template.

**Duration.** 18-28 s (standard). Shaadi variant adds a 40-48 s preset by doubling slots 2-5.

**Slots (24 s preset, every slot 3.0 s = one bar at 80 BPM).**
1. `establish` — 0-3 s, static wide. *Optional once keyframes land: 100 -> 103% push-in.*
2. `arrive` — 3-6 s.
3. `detail` — 6-9 s.
4. `move` — 9-12 s, speed ramp 0.5x -> 1.0x (shoot 60 fps; 30 fps source auto-caps at 0.75x).
5. `faces` — 12-15 s.
6. `hero` — 15-18 s, freeze frame 0.6 s at 16.5 s for the title to settle.
7. `wide` — 18-21 s.
8. `end` — 21-24 s, dips to black.

Shaadi relabels: `baraat` / `entry` / `haath` (hands, mehendi, rings) / `dance` (the ramp slot) / `family` / `couple` (hero) / `venue` / `end`.

**Timing beats (24 s, track at 80 BPM, beat 0.75 s, bar 3.0 s, drop on the second bar).**
- 0.0-0.6 s: fade in from black.
- 0.4 s: location lower-third blurs in.
- 3.0 s: beat drop; cut `establish` -> `arrive` with a 500 ms warm light-leak flash.
- 6.0 / 9.0 / 12.0 s: cuts on bar lines; `crossfade` 14 frames between `detail` and `move` only.
- 9.0-10.5 s: `move` plays at 0.5x; 10.5-11.25 s ramps to 1.0x, landing on beat 15 (11.25 s), impact SFX optional.
- 15.0 s: `hero` enters with the second light-leak flash; 16.5 s (beat 22) freeze frame 0.6 s, title types in.
- 18.0 s: `dip to black` chapter break into `wide`.
- 21.0-24.0 s: `end` slot, music eases down, dip to black with date / location text.

**Text layers.**
| Layer | Copy | Preset | Font |
|---|---|---|---|
| Lower-third (location + date) | "Hampi · Nov 2026" (Shaadi: "Priya & Arjun · Udaipur") | `blur-in` at 0.4 s, hold 2.5 s | Cormorant Garamond SemiBold 60 px, tracking +18%, bone white |
| Headline (title on freeze) | "dhoop" (Shaadi: "the sangeet") | `typewriter` 0.8 s, hold 1.5 s | Oswald Light small caps 72 px, tracking +12% |
| End card | "shot on a phone" | `blur-in`, hold till black | Cormorant Garamond Italic 52 px |

All text locked to the inner letterbox window.

**Colour / overlays.** "Dhoop Warm" .cube LUT at 70% (warm highlights, slightly cyan shadows, protected skin), film grain 14% screen blend, vignette 20% feathered (LUT + two overlays; letterbox bars are frame masks, not a grade), procedural amber light leak on two transitions only. Optional swap to "Monsoon Teal" LUT at 60% for outdoor action footage.

**Transitions.** `crossfade` (14 frames), `dip to black` for chapter breaks, `cut` on bars. No slides or zooms (they fight the letterbox).

**Music mood tag.** `cinematic / ambient / slowed`, 75-90 BPM; the bar grid retimes to the chosen track. **Tier.** Pro.

**Preview thumbnail animates.** Black bars slide in top and bottom, a warm establishing shot holds while the serif location line blurs into view.
On the drop a light leak washes the frame and three graded clips cut past with grain visibly moving.

---

## 4. Snap Reveal

**Purpose.** Before / after in one cut that matters. Fashion, fitness, room makeover, rangoli, food plating, product unbox. The transition is the hook and lands inside the first 3 seconds.

**Canvas.** 9:16 (1:1 layout preset available). **Duration.** 7-14 s (micro).

**Slots.**
1. `before` — 2.0-3.0 s on the default preset (2.9 s shipped). Variant "Long tease" (opt-in) allows 3.0-4.5 s. "Ash" desaturated LUT at 60% so colour arrives with the reveal.
2. `after` — 4-8 s, full colour, speed ramp 0.85x for the first 1.5 s then 1.0x (above the 0.75x cap, safe on 30 fps).

**Timing beats (10 s preset, drop at 2.9 s).**
- 0.0 s: hook text pops in over `before`.
- 1.9-2.9 s: 1 s riser ending on the cut; optional freeze frame 0.4 s at 2.5 s ("world stop").
- 2.9 s: hard cut on the beat drop with a 450 ms light-leak flash. Alternates: `zoom` punch or `slide`.
- 2.9 s: "AB" label pops, colour arrives.
- 2.9-4.4 s: `after` plays at 0.85x, then settles to 1.0x.
- 8.0 s: music eases over the final 20%; last frame holds to 10.0 s.

**Text layers.**
| Layer | Copy | Preset | Font |
|---|---|---|---|
| Headline (hook) | "Ruko, end tak dekho" (wait for it) | `pop` 0.0 s, exit at 2.5 s | Anton 84 px / Hind Bold for Devanagari, white with 6 px dark outline |
| Point "BEFORE" | "PEHLE" | `slide` from left at 0.5 s, corner badge, exits at cut | Oswald SemiBold 52 px small caps, grey plate |
| Point "AFTER" | "AB" (alt: "BAAD") | `pop` on the cut frame | Oswald SemiBold 52 px small caps, accent plate (#FF5A36) |
| Timer (optional) | "30 din" | `pop` with the hook | Space Mono 48 px |

**Colour / overlays.** `before`: "Ash" LUT 60%, grain 10%. `after`: "Bazaar Pop" LUT 45%, no grain. Light-leak flash on the single transition.

**Transitions.** One hard `cut` with light-leak flash (default); `zoom` and `slide` alternates. Nothing else.

**Music mood tag.** `beat-drop / hype`. **Tier.** Free.

**Preview thumbnail animates.** A grey, half-faded before shot holds while a riser swells and the hook line waits on top.
A flash on the drop and the after shot lands in full colour with the orange label snapping in.

---

## 5. Just Talking

**Purpose.** Off-the-cuff talking head with word-by-word captions, a headline hook and a punch-in rhythm so the frame changes every 3-5 seconds. Original audio first. Works for storytime, hot takes, mini explainers and match-day reactions.

**Canvas.** 9:16. **Duration.** 20-40 s (standard).

**Slots.**
1. `talk` — one selfie clip, subject centred, framed close. The creator cuts at sentence breaks (manual cuts; there is no automatic pause removal). Verso alternates each resulting segment between two static crops of the same clip: **wide** (100%) and **tight** (115%, centred on the face). The creator can promote any one segment to **hit** (130%) for the key line. *Optional once keyframes land: a 100 -> 120% slow push on any uncut stretch over 15 s.*
2-4. `broll-A/B/C` — optional 2 s cutaway slots with `crossfade`, placed on the 2-3 lines that name a product, number or person.

**Timing beats (30 s preset).**
- 0.0 s: cold open mid-sentence; headline pops at frame 0.
- 0.0-3.5 s: headline holds, fades by 4 s.
- 3-5 s rhythm: `cut` to the alternate crop at each sentence break.
- ~15 s: caption block shifts from 62% height to 55% height once (pattern interrupt).
- Last 2.5 s: CTA chip slides up; music (if any) sits at -22 dBFS throughout because every slot is flagged has VO.

**Text layers.**
| Layer | Copy | Preset | Font |
|---|---|---|---|
| Headline | "Yeh galti maine 2 saal ki" (6-8 words, written like a headline) | `pop` at 0 s, hold 3.5 s, fade | Poppins ExtraBold 76 px / Hind Bold, white on 60% black rounded plate, top safe zone |
| Karaoke captions | key phrases, 2-5 words on screen | `karaoke captions`, active word in accent (#2BD4A8) | Inter Bold 58 px, white fill, 5 px dark outline, centred at 55-62% height |
| Callout (optional) | one-word call-out beside face, e.g. "Rs 40,000" | `pop`, 1-4 s | Oswald Bold 64 px, accent |
| Score chip (variant "Match reaction") | "187/4 · 18.2 ov" | `pop`, top-right inside safe zone, updated per cut | Space Mono Bold 48 px on 60% black plate |
| CTA | "Save karo, baad mein kaam aayega" | `slide` up, last 2.5 s | Inter SemiBold 48 px, sentence case |

Match reaction variant uses plain text for scores only: no team crests, broadcaster graphics or player likenesses.

**Colour / overlays.** "Skin True" LUT at 35% (gentle contrast, no colour cast). No grain, no letterbox, no vignette.

**Transitions.** Hard `cut` between crops; `crossfade` into B-roll cutaways only.

**Music mood tag.** `none` or `lo-fi bed` (held at -22 dBFS). **Tier.** Free.

**Preview thumbnail animates.** A centred face cuts from wide to tight as a bold headline sits at the top of frame.
Below, four words light up one at a time in mint green, then a single callout number pops beside the face.

---

## 6. Clip Frame

**Purpose.** Turns a 16:9 long-form recording into a vertical clip: the source sits in a centred widescreen window, a headline bar above states the claim, karaoke captions run below, and the last two seconds point to the full video. Built for long-form creators who want three clips out of every upload.

**Canvas.** 9:16. **Duration.** 20-60 s (standard / educational).

**Layout (1080x1920).**
- Background: solid plate #101014 (variant: creator accent colour). No blurred-fill background (not an engine capability).
- `source` window: 1080x608, 16:9 fit, vertically centred at y 656-1264.
- Headline bar: y 400-620, above the window.
- Caption band: y 1300-1480, below the window and above the 20% bottom safe zone (1536).
- Variant "Face fill": the same `source` slot set to a static fill crop (approx. 316%, face-centred) so the speaker fills 9:16 for talking segments; the creator cuts between "Frame" and "Face fill" segments of the same clip for a punch-in rhythm.

**Slots.**
1. `source` — 20-58 s, the long-form clip, trimmed to the moment. Cuts at sentence breaks alternate Frame / Face fill as above.
2. `end` — 2.0 s, freeze frame of the last `source` frame with the CTA.

**Timing beats (40 s preset).**
- 0.0 s: headline bar pops; clip starts mid-sentence on the strongest line.
- 0.0-40 s: karaoke captions throughout; the creator places 2-4 Frame / Face fill cuts.
- 12 s and 26 s: optional chapter chip pops under the headline ("Part 2 / 3").
- 38.0 s: `end` freeze frame; CTA slides up; music, if any, stays at -22 dBFS (all slots have VO).

**Text layers.**
| Layer | Copy | Preset | Font |
|---|---|---|---|
| Headline bar | "Pehli salary ka sabse bada mistake" (two lines max) | `pop` at 0 s, hold whole clip | Poppins ExtraBold 68 px / Hind Bold, white on #101014 (no plate needed) |
| Karaoke captions | speech | `karaoke captions`, active word in accent (#FFD84D) | Inter Bold 56 px, white, 4 px dark outline |
| Chapter chip (optional) | "Part 2 / 3" | `pop`, hold 3 s | Space Mono Bold 44 px on 25% white plate |
| CTA (end) | "Full video link in bio" | `slide` up, last 2 s | Inter SemiBold 48 px, sentence case, accent |

**Colour / overlays.** "Skin True" LUT at 30% on `source`. No grain, no vignette. The dark plate does the framing; letterbox bars off.

**Transitions.** `cut` only between Frame / Face fill segments; `crossfade` 8 frames into `end`.

**Music mood tag.** `none` or `lo-fi bed`. **Tier.** Free.

**Preview thumbnail animates.** A widescreen clip sits in the middle of a dark vertical frame with a two-line headline above and words lighting up below.
The frame cuts to a full-height face fill on the key sentence, then back, and a "full video" line slides in at the end.

---

## 7. Galti Mat Karo

**Purpose.** Hinglish-first educational listicle: problem hook, 3-5 numbered points, save CTA. Built for jargon-free finance, career, cooking, health and small-business creators. Devanagari rendering guaranteed.

**Canvas.** 9:16. **Duration.** 30-55 s (educational). The creator picks a 3-, 4- or 5-point layout when opening the template; each is a fixed layout with its badges pre-numbered (no runtime renumbering).

**Slots (4-point layout).**
1. `hook` — 3 s, talking head or B-roll with opening motion.
2-5. `point-1` … `point-4` — 8 s each (6-8 s allowed; the grid below assumes 8), talking head or B-roll swap.
6. `outro` — 3 s, save CTA.

**Timing beats (38 s with 4 points; 3 points = 30 s, 5 points = 46 s).**
- 0.0 s: hook types in ("Yeh 4 galtiyan mat karo…").
- 3.0 s: `slide` transition to `point-1`; badge "1 / 4" pops, point line slides in from the right at 3.3 s.
- 11.0 / 19.0 / 27.0 s: next point, same pattern, each on a beat.
- 28.0 s: optional "sabse important" curiosity chip on the last point.
- 35.0 s: `slide` to `outro`, bookmark sticker pops, "Save karo" CTA, music eases down; ends 38.0 s.

**Text layers.**
| Layer | Copy | Preset | Font pairing |
|---|---|---|---|
| Headline (hook) | "Yeh 4 galtiyan mat karo pehli salary mein" | `typewriter` 1.2 s, hold till 3 s (alt: `pop`) | Poppins ExtraBold 76 px + Hind Bold for Devanagari glyphs |
| Number badge | "1 / 4" … "4 / 4" (the counter replaces a progress bar so viewers know how many points remain) | `pop` on slot start, top-left of safe zone | Baloo 2 ExtraBold 64 px on saffron circle (#F2A33C) |
| Point line | "Credit card ka minimum due mat bharo" | `slide` from right, hold full slot | Poppins SemiBold 60 px / Hind SemiBold, white on 55% navy plate |
| Karaoke captions (optional, if speaking) | speech | `karaoke captions`, low-contrast style | Inter Bold 52 px |
| CTA (outro) | "Save karo · Share karo dost ko" | `pop`; bookmark emoji placed as a sticker beside the text, never inline | Poppins Bold 52 px small caps, saffron |

Fonts: Poppins (Latin) paired with Hind (Devanagari); Noto Sans Tamil / Telugu assigned per layer for Tamil / Telugu copy.

**Colour / overlays.** "Skin True" LUT 35%. No grain, no vignette.

**Transitions.** `slide` between points, `cut` within a point. Soft whoosh on each slide (one per transition).

**Music mood tag.** `calm / focus`, held at -22 dBFS under VO. **Tier.** Free.

**Preview thumbnail animates.** A Hinglish hook types itself out, then the frame slides left as an orange "1 / 4" badge pops and the first point line glides in.
The counter ticks up at each slide and a bookmark sticker bounces in at the end.

---

## 8. Drop Walk

**Purpose.** Slowed-beat showcase for outfits, walks, products and calm founder POVs: stillness, then movement exactly on the drop. Confidence carries it, text stays out of the way. Moody cinematic grade.

**Canvas.** 9:16 (1:1 layout preset available). **Duration.** 10-15 s (micro). Loop-safe optional.

**Slots.**
1. `still` — 3.2 s, near-static shot, speed ramp 0.6x (shoot 60 fps; 30 fps source auto-caps at 0.75x), "breath" 0.6 s music dip before the drop.
2. `move` — 4.8 s at 1.0x: walk toward camera, orbit, product spin.
3. `second` (optional) — 3.2 s at 0.8x, alternate angle.
4. `tail` — 2.4 s, static, dips to black or loops to `still`. *Optional once keyframes land: 100 -> 104% push.*

**Timing beats (13.6 s preset, 75 BPM half-time, beat 0.8 s, bar 3.2 s, drop on bar 2).**
- 0.0-0.5 s: fade in from black.
- 2.6-3.2 s: music breath (planned silence), freeze frame 0.3 s optional.
- 3.2 s: hard cut (alt: `zoom`) to `move`; bass hit SFX allowed here (one of max two).
- 8.0 s: `crossfade` 12 frames to `second`.
- 9.6 s (beat 12): small-caps line slides up at bottom-third centre, holds 2.4 s, exits 12.0 s.
- 11.2 s: `tail`, music eases down, dip to black at 13.6 s (or loop).

**Text layers.**
| Layer | Copy | Preset | Font |
|---|---|---|---|
| Point (single line, after the drop) | "no plan. just walking." (3-5 words) | `slide` up at 9.6 s, hold 2.4 s, exit | Oswald Regular small caps 52 px, tracking +10%, bone white, no plate |
| Optional title on freeze | "11.06" | `blur-in` on the 0.3 s freeze | Cormorant Garamond 64 px |

No captions by default; karaoke toggle available in low-contrast style.

**Colour / overlays.** "Raat Noir" LUT at 60% (cool shadows, warm skin held), grain 12% screen blend, vignette 25% feathered (LUT + two overlays). Letterbox off by default (toggle available, which replaces grain with letterbox to stay inside the stacking rule and disables the zoom alternate).

**Transitions.** `cut` or `zoom` on the drop, one `crossfade`, `dip to black` out.

**Music mood tag.** `slowed / reverb / cinematic trap`, 70-80 BPM; the bar grid retimes to the chosen track. **Tier.** Pro.

**Preview thumbnail animates.** A dark, graded still breathes in slow motion while the music drops out for a beat.
Then a hard cut on the drop to a full-speed walk, grain shimmering, and a small lettered line slides up and fades.

---

## Tier summary

| # | Template | Format family | Duration preset | Tier |
|---|---|---|---|---|
| 1 | Photo Dump | Beat-synced photo / clip slideshow (Film Memory, Tyohaar looks) | Standard 15-24 s | Free |
| 2 | Teaser | Cinematic trailer, text cards + letterbox | Micro 12-15 s | Free |
| 3 | Dhoop | Cinematic letterbox travel / Shaadi highlight | Standard 18-28 s (Shaadi 40-48 s) | Pro |
| 4 | Snap Reveal | Dramatic before / after | Micro 7-14 s | Free |
| 5 | Just Talking | Talking head + karaoke captions (Match reaction variant) | Standard 20-40 s | Free |
| 6 | Clip Frame | Long-form 16:9 to vertical clip | Standard 20-60 s | Free |
| 7 | Galti Mat Karo | Hinglish listicle | Educational 30-55 s | Free |
| 8 | Drop Walk | Slowed-beat cinematic showcase | Micro 10-15 s | Pro |

Three of eight are cinematic (Teaser free, Dhoop and Drop Walk Pro). Three carry India-first variants or copy by default (Dhoop Shaadi, Photo Dump Tyohaar, Galti Mat Karo) plus the Match reaction variant of Just Talking.

**Shared preset bundles referenced above** (ship once, reused by templates): LUTs "Dhoop Warm", "Monsoon Teal", "Raat Noir", "Ash", "Bazaar Pop", "Skin True", "Chai Warm" (all Verso's own names, .cube); grain presets 10 / 12 / 14 / 18%; vignette 15 / 20 / 25%; letterbox ratio picker 1.85 / 2.35 / 2.39; procedural light leak 400-600 ms amber; transition SFX set (CC0: whoosh soft / sharp, impact, pop, riser).

---

## Revision notes (for the reviewer)

- Hooks in template copy are neutral (confession / hot take / "the one thing nobody told me" archetypes in the hook library); no text points to a specific sound or meme.
- Platform and brand names removed from pack text, including generic product-name uses.
- LUT names and the "Golden Hour" template renamed to Verso-distinct names.
- Timing grids recomputed: Photo Dump is a true 40-beat grid at 125 BPM (hook on the grid, 0.96 s floor respected); Galti Mat Karo is 38 s with 4 points (outro at 35 s); Dhoop is eight 3.0 s bars at 80 BPM with the drop, ramp exit and freeze on beats; Snap Reveal reveals at 2.9 s with the longer tease opt-in; Drop Walk drops on bar 2 at 75 BPM (3.2 s).
- Capabilities outside the engine list are no longer required: keyframe drifts and pushes are marked optional, punch-ins use static crops and cuts, ducking is a per-slot music level, the inset variant, progress bar, badge renumbering and one-click language swap are removed; STT word timings for karaoke are flagged for confirmation.
- Effect-stacking rule relaxed to one LUT + two overlays with transition-scoped light leaks exempt; both Pro templates comply.
- Text floors restated (Headline 64 / Point 52 / CTA 44, small caps only at 52+); all CTAs, badges, markers and stickers meet them.
- Slow-mo rule added pack-wide (60 fps prompt, 0.75x cap on sub-50 fps source).
- "One Line", "Twenty Seconds" and "Day One" were merged or retired to make room for Teaser (free cinematic), Photo Dump (slideshow, Film Memory and festival looks) and Clip Frame (long-form to vertical). The 16:9 export of the letterbox template is dropped. "BAAD MEIN" is now "AB"; inline emoji moved to the sticker layer.

---

<!-- Pack: Festive India (source: festive-india.md, verbatim) -->

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

---

<!-- Pack: Business and Promo (source: business-and-promo.md, verbatim) -->

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


---

# Engine requirements

A single checklist of every capability the 48 templates rely on, compiled from the six pack specs. **Base** items are the confirmed engine list every pack was designed against. **Requested** items are additions at least one pack depends on for its look as designed; the pack that raises each one ships a stated fallback until it lands. **Confirm** items are capabilities one pack treats as available while another treats as absent, so engineering should state which is true before the packs ship. Pack abbreviations: TR Trending, CI Cinematic, PO Podcast, CB Creator Basics, FI Festive India, BP Business and Promo.

## Canvas, export and layout

- [ ] **Base.** 9:16 (1080x1920), 1:1 (1080x1080) and 16:9 (1920x1080) canvases; export H.264 30fps, master peak -1 to -3 dBFS. (all)
- [ ] **Base.** Separate canvas variant files / layout presets per template (1:1 sibling, 16:9 twin) with their own text anchors and slot crops, shipped alongside the 9:16 file. (TR, CI, PO, CB, FI, BP)
- [ ] **Requested.** Cross-canvas reframe plus relayout from one timeline to 1:1 and 16:9, replacing the separate variant files. Fallback: separate files. (BP request 5)
- [ ] **Base.** Safe-zone guide overlay: top 10% (TR), bottom 20% and right 12% (all), visible in the editor; text layers snap out of the zones. (all)
- [ ] **Requested.** Hard safe-zone lock so a text layer cannot be dragged into a reserved zone (`[dep: safe-zone lock]`, P1). Fallback: default positioning inside the safe area. (FI)
- [ ] **Base.** Letterbox bars as a canvas setting: bars expressed as % of canvas height (8 / 10 / 12 / 15 / 20%) and as a ratio picker (tall cinema 1080x1350, 1.85, 2.0, 2.35, 2.39, 2.76); pure black with optional 5% feathered edge; text layers lock to the visible window, not the canvas; the 2.39 / 2.76 options warn that the window is under 30% of the screen. (TR, CI, PO, CB, FI, BP; FI lists the picker as `[dep: letterbox ratio picker]` P2)
- [ ] **Base.** Hook slot auto-capped at 3s; a duration slider that scales slot lengths proportionally (end cards capped); a count picker (3 / 4 / 5 points) that recomputes slot lengths; variant / mode / look pickers per template at load. (all)
- [ ] **Base.** Loop-safe flag: first and last frame share crop state, music continuous across the loop point, no outro card. (TR, PO, CB, FI, BP)
- [ ] **Requested.** Loop-check overlay in the slot picker (first versus last frame difference) for loop-safe templates. (BP request 6; BP Price Drop expects an editor warning when first and last frames differ strongly)
- [ ] **Base.** Editor-only layout guides excluded from export (16:9 end-screen placeholder regions for channel / video / playlist / subscribe elements). (TR Word Storm End Screen, FI Shubh Title + Outro)
- [ ] **Base.** Templates can declare a seasonal surfacing window in the picker while staying searchable year-round. (CI Night Lights)
- [ ] **Base.** Each template ships a 2-6s silent looping preview video in the picker, starting from a per-template preview-in point. (all)

## Media slots

- [ ] **Base.** Video slots with one-drag media swap; mixed photo + video accepted. (all)
- [ ] **Requested / Confirm.** Still image dropped into a video slot and held for the slot duration (`[dep: still-in-slot]`, P0). TR, CB and CI assume photos work in slots; FI flags it as a dependency. Photo dumps are impossible without it. (TR Twenty Seconds, CB Photo Dump, CI Beat Drop Walk Dump, FI Diwali Dump)
- [ ] **Base.** Linked slots: one drag fills two slots that share the same media and continue from the frame the first left off. (BP Price Drop)
- [ ] **Base.** Static fit / fill scale and crop offset per slot, set once (how a 16:9 clip sits in 9:16 and how a "tight" 115% / "hit" 130% copy of a talking-head slot is made); crop-centre drag with a "drag to the face" hint. (CB, PO E5)
- [ ] **Base.** Per-slot "Min clip: Ns" hint computed from duration x speed, shown in the slot's empty state. (FI, CI slot hints)
- [ ] **Base.** Source-length check on swap with graceful fallback (time-lapse slot drops 3x to 2x to 1.0x with a notice when the clip is too short). (BP Behind the Counter)
- [ ] **Requested.** Slot trimming: empty slots collapse and later layers re-time (`[dep: slot trimming]`, P2). Fallback: fixed slot count. (FI Sahi Gift)
- [ ] **Base.** Slot count recomputed from duration (one slot per bar) and hero slot relocated to whichever bar the detected drop falls in. (TR Twenty Seconds)
- [ ] **Base.** Per-slot opacity dim (listening half dims 10% with a 200ms ease). (PO Two-Up Exchange)
- [ ] **Base.** Manual exposure-match slider with a "match" button that equalises mean luminance between two slots. (PO Two-Up Exchange)
- [ ] **Requested.** Per-segment layout states (stacked / single full-frame / wide with background fill) chosen between markers, no keyframing. Pro unlock. (PO Two-Up Exchange)

## Slot motion (keyframes)

- [ ] **Requested.** Per-clip scale / position keyframes: two-point "Ken Burns" (start / end scale and offset, linear or ease), punch presets ("punch 115", "punch 125", "slow push 100-106", "settle 104-100"), slow push-in 100 -> 103/104/106/108%, push-out, micro-drift (2-3px random-walk wobble). Fallback: static framing; punch-ins use the `zoom` transition at the cut. (TR dependency table, CI [ENGINE REQUEST (a)], PO E1, CB "optional once keyframes land", FI removed in rev 2, BP uses "slow push 1.00 -> 1.08" on every template and requests "keyframable scale on text")
- [ ] **Confirm.** BP writes slow push-ins and a returning push for loop safety into every template as if available; CI, TR, PO and CB treat the same motion as a request with a static fallback. Engineering should state whether slot scale keyframes ship with the first pack release.
- [ ] **Base.** Alternating static crops between cuts (wide / tight / hit) as the no-keyframe punch-in rhythm. (CB Just Talking, CB Clip Frame Face fill)
- [ ] **Base.** Automatic zoom punch (1.00x <-> 1.15x alternating) applied on every creator-placed jump cut. (BP Founder Note)

## Text layers

- [ ] **Base.** Text animation presets: `pop` (with built-in 104 -> 100% overshoot / settle, re-triggerable on a beat), `typewriter`, `slide` (from left / right / bottom), `blur-in` / blur-out, `karaoke captions`. (all)
- [ ] **Base.** Three named styles per template (Headline / Point / CTA) with size floors: 56px Latin, 64px Devanagari / Tamil / Telugu; CB uses Headline 64 / Point 52 / CTA 44. (all)
- [ ] **Base.** Text background plate / pill / rounded box as a text-layer property: solid colour at 40-85% opacity, radius, padding (28px vertical for Devanagari), sized from the measured text box, 60% black gradient band variant. (all; PO requires plates sized from the measured text box; PO and CI gradient band is E3 / PNG fallback)
- [ ] **Confirm.** Text stroke / outline (4-6px dark outline) and drop shadow. TR, PO, CB and FI write "white with 4px dark outline" / "6px stroke" / "soft shadow" / "2px shadow" into captions and labels; BP states the engine has no stroke, outline or shadow and uses plates instead, listing stroke and shadow as request 1. Engineering must confirm which is true; if absent, TR / PO / CB / FI captions fall back to plates.
- [ ] **Confirm.** Strikethrough text style. FI Sahi Gift uses a strikethrough text style on the MRP; BP states there is no strikethrough and uses the strike-line sticker. Confirm.
- [ ] **Confirm.** Small caps. TR, CI, PO, CB and FI specify "small caps" on several layers; BP states no shipped font carries an OpenType smcp face and uses uppercase + tracking. Confirm whether the engine synthesises small caps; otherwise all packs use uppercase + tracking.
- [ ] **Base.** Letter-spacing / tracking on text layers (static, +5% to +22%, -1%). (all)
- [ ] **Requested.** Per-layer static rotation on text (-15 to +15 degrees). Fallback: 0 degrees. (TR dependency table: Word Storm, One-Liner Sign, Photo Dump polaroid frames; FI Sahi Gift GALAT tag -4 degrees; CB Photo Dump Film Memory alternating -2 / +2)
- [ ] **Requested.** Keyframable scale on text layers for a true 100 -> 108 -> 100 beat (fallback: re-triggered pop). Chapter-card "shrink to corner tag" (300ms) and claim-card scale settle. (BP request 4; PO Chapter Card uses E1 on the text layer)
- [ ] **Base.** Multiple text layers sharing one plate (name / role lower-third). (BP Founder Note, PO lower thirds)
- [ ] **Base.** Caption position floor: no caption layer below 78% frame height; captions lift to 50-58% while a lower third is on screen (collision rule). (PO)
- [ ] **Base.** Caption presets: Karaoke (word highlight, active word in accent with 6% scale-up), Chunk (2-5 word pop), Plate (sentence case on a pill, fade per line, no per-word animation). (PO, CI, CB)
- [ ] **Base.** Indic text rendering: Devanagari matras and conjuncts, Tamil and Telugu vowel signs, auto line-height (1.35-1.5), rupee glyph U+20B9, Devanagari digits, Indian lakh number formatting in placeholders. (all)
- [ ] **Base.** Placeholder tokens `{YEAR}`, `{MONTH}`, `{DATE}`, `{PLACE}`, `{NAME}`, `{BRAND}` resolved at project creation from system clock and creator profile; `{DATE}` default offset (seven days). (CI)
- [ ] **Base.** Three placeholder copy presets per layer (Hinglish default, English, Hindi) in the notes / placeholder panel, with Devanagari fonts pre-assigned per layer. (all)
- [ ] **Requested.** One-click language swap across all layers (`[dep: language swap]`, P0). TR, CI and PO describe it as shipping; CB and FI treat it as not available and ship per-layer presets. Fallback: creator pastes per layer. (all)
- [ ] **Base.** Hook starter library: swappable placeholder hooks in five archetypes (negative callout, shortcut, secret, quantified result, failure), English and Hinglish. (CB)

## Karaoke captions and speech

- [ ] **Confirm.** Word timings for the karaoke preset. TR explicitly does NOT assume speech-to-text: the creator types 2-5 words per line in a caption panel, the engine distributes word timings by syllable count across the line and the creator nudges them on the beat ruler. CI Print Stock says "synced to the clip's transcript". CB flags the preset as needing either STT with word timings or a manual tap-along timing mode, falling back to a static `pop` line per sentence. PO assumes no ASR anywhere. Engineering must state the shipped mechanism; the typed-and-distributed workflow (TR) is the common floor.
- [ ] **Requested (optional plugin).** Hinglish / code-switched ASR to prefill caption words and timings; a separate dependency no template breaks without. (TR)
- [ ] **Base.** Captions follow the VO (no beat grid) and start on the first spoken word. (FI Shubh Bolo)
- [ ] **Base.** Cuts snap to the nearest sentence end rather than the beat when captions exist. (CI Print Stock)
- [ ] **Base.** Manual markers in place of auto-detection, one tap or one drag each: jump-cut / pause markers (paired markers trim between them), speaker-change marker (one key per speaker), punch-in marker, crop-centre drag, callout-anchor drag, receipt-in marker, cutaway markers. No silence detection, diarisation or face detection is assumed; if they arrive later they pre-place the same markers. (TR, PO E5, CB, FI)

## Grading and overlays

- [ ] **Base.** .cube LUT grading with an intensity slider (20-100%); every LUT authored in-house, named by result. Full in-house LUT list to ship once and reuse: Clean Punch, Soft Face, Flat Grey, Moody Night, Silver, Gritty, Warm Filmic, Muted Green, Indoor Warm Film, Teal-Orange (TR); Print Stock Warm, Print Stock Neutral, Teal Amber, Faded Print (CI); Lift and Punch micro-grades, Studio Match, Teal-Orange Subtle (PO); Dhoop Warm, Monsoon Teal, Raat Noir, Ash, Bazaar Pop, Skin True, Chai Warm (CB); Festive Warm, Flat Before, Product True, Night Pop, Natural Warm (FI); warm neutral, clean neutral, desaturated cool, warm commercial, soft neutral skin-safe, warm print-stock, muted film print, cool moody, light natural (BP). Pre-ship trademark check on "Night Pop" and "Faded Print". (all)
- [ ] **Base.** Procedural film grain 8-20%, screen or overlay blend, scaled to canvas resolution, luminance-weighted option. (all)
- [ ] **Base.** Vignette 10-30%, feathered. (all)
- [ ] **Base.** Procedural light leak (warm amber / pink, 400-600ms) and procedural flare (bloom from behind text, left-to-right sweep 400-700ms, gold variant), attachable to a transition or a text pop; per-template overlay budget (max 3). (all)
- [ ] **Base.** Effect-stacking rule enforced by the template: one LUT plus at most two of grain / vignette / letterbox; toggling letterbox on auto-disables vignette or grain to stay inside the rule. (BP Signature Walk, CB Drop Walk, CI, TR)
- [ ] **Base.** Look bundles exposed as one-click presets inside a template (Outdoor Teal-Orange, Indoor Warm Film, Moody Night; Warm Print Film, Muted Film Print; Clean, Film Memory, Tyohaar). (CI, BP, CB)
- [ ] **Requested.** Halation / bloom (highlight threshold + soft radius, 6-10%) and a single procedural anamorphic streak (horizontal, cool white or warm, 300-500ms). (PO E7: Hot Take Montage, Cinema Cut, Night Mood, Chapter Card)
- [ ] **Requested.** Procedural backdrop generator (dark paper / concrete / gradient noise). Fallback: bundled 10s in-house CC0 loop. (TR Word Storm)
- [ ] **Requested.** Background blur fill: Gaussian blur (radius up to 60px at 1080) on a slot copy, scaled 1.6x, darkened 35-55%, LUT applied, behind a 16:9 inset. Fallback: dark gradient fill sampled from the clip's dominant colour (darkened 60%, 80% vignette) or a static dark plate / letterbox-on-black. (CI [ENGINE REQUEST (c)] Print Stock, PO E2 Wide Shot Fit and Two-Up wide state, CB Clip Frame uses the solid plate fallback)
- [ ] **Base.** 2-frame white flash on a cut. (PO Hot Take Montage)
- [ ] **Base.** Before-slot desaturation via LUT and an inset-at-90%-width "smaller" framing for the before shot. (BP Before and After Snap, TR Snap Reveal inset variant)

## Shapes, stickers and images

- [ ] **Requested.** Shape primitive: rectangle / rounded rectangle with fill, radius, opacity; keyframable width (progress-bar mode driven by template length, reverse-fill countdown toggle, 200ms opacity pulse at 100%); linear gradient band; circular and rounded-corner masks on a slot (320px circle, 420px wide card with 24px radius); chat bubbles; thin accent bar / divider line / underline bar. Fallback: prerendered sticker sequences (60-frame or 11-step progress bar), 9-slice bubble stickers, badge stickers 1-6, gradient band PNG, rounded-corner sticker frame, square inset. (TR dependency table, PO E3, CI, BP states no shape layers)
- [ ] **Base.** Verso vector sticker set (own-drawn SVG): number badges 1-6 (accent fill, white numeral), bookmark, check mark, strike line, arrow, circle / point callout, speech bubble, quote marks, stopwatch, "3x" speed badge, "3 · 2 · 1" leader numbers, diya; Noto Emoji (OFL) bundle in the sticker panel. No platform emoji glyphs rasterised, no emoji inline in text layers. (all)
- [ ] **Requested.** User-uploaded image sticker / logo slot (brand logo, headshot, receipt screenshot, stat card). Fallback: text brand name from `{BRAND}`. (CI [ENGINE REQUEST (d)] Night Lights, FI Shubh Title + Outro and Festive Film end card, PO receipt slots use own-asset image slots)
- [ ] **Base.** Image slot for a still asset (receipt card, chart, stat card) that slides in / out beside the face with ease-out. (PO Hot Take Montage, Chapter Card)

## Transitions, speed and time

- [ ] **Base.** Transitions: `cut`, `crossfade` (6-22 frames, specified per cut), `dip to black` (4-18 frames), `slide` (left / right / up, 10 frames), `zoom` (punch 1.05-1.1x with 6-frame settle; 2-frame zoom-in for photos). Per-template disabling of slides and zooms inside letterbox. (all)
- [ ] **Base.** Speed ramps: fixed speed per slot (0.6x, 0.8x, 0.85x, 3x time-lapse), linear ramps (0.5x -> 1.0x), preset curves (100 / 50 / 100 and 100 / 25 / 100 centred on a visible midpoint marker; the creator drags footage so the key instant sits on the marker; "Deep slow 25%" toggle). (all)
- [ ] **Base.** Speed-ramp floor with source-fps read and automatic clamp: 0.5x minimum on 30fps or lower, 0.25x only on 60fps+; soften to 0.75x on sub-50/60fps source; the inspector shows which floor applied and a "shoot this at 60fps" hint on media swap; ramp control locked with "freeze used instead" on 24/30fps where the template demands 60fps. (TR, CB, FI treat the fps read as base; CI [ENGINE REQUEST (b)] and PO E6 treat it as a request with a manual toggle fallback. Confirm.)
- [ ] **Requested.** Frame blending on speed ramps (simple blend, not optical flow), always on when ramping. (PO E6)
- [ ] **Base.** Freeze frames: at the slot end, at a marker, at the slowest point of a ramp, "world stop" 0.3-0.5s before a reveal, running up to the cut without resuming. (all)
- [ ] **Base.** Fade in from black (0.3-0.6s) and fade to black / cold cut-out on the last frame. (CI, CB, FI, BP)
- [ ] **Base.** Match-cut on an action cue at the drop (clap / stomp / spin). (FI Garba Drop, Rangoli Reveal)

## Beat sync and music

- [ ] **Base.** Beat detection on the chosen track: beat grid, downbeat / bar markers, drop marker detection; bundled mood beds ship with marked downbeats. (all; PO E4 downbeat markers)
- [ ] **Base.** Beat-synced cuts: listed cut times are defaults that snap to the nearest beat (half-beat for cuts under 1s) within a +/-0.25s window; slot lengths flex +/-15% to absorb the snap; the template total flexes and the final fade / dip re-anchors; freeze frames and ramps keep their duration and move with their slot; snap can be disabled. The snap tolerance and flex must be exposed as per-template constants. (CI open item 6, FI, CB, BP)
- [ ] **Base.** Grid retiming on music swap within the mood tag's BPM range; slot durations expressed as whole beats or bars; first slot stretches / trims so the first cut lands on the detected drop; word count rescales to duration (one word per beat). (TR, CI, CB, FI)
- [ ] **Base.** Fixed-length templates with no beat grid use % of template length for every beat so layout survives duration changes. (TR One-Liner, Snap Reveal, Straight Talk)
- [ ] **Base.** Music mood tags mapped to an in-house / CC0 library with licence metadata per track: chill-lofi, deadpan-dramatic, upbeat-energetic, cinematic-slowed, cinematic-warm-strings, beat-drop-hype, lofi-bed, calm-focus, slowed-reverb, cinematic-trap, hype-electronic, cinematic / ambient, build-up / drop, nostalgic / lo-fi, dark / tension / trailer, warm celebratory, upbeat drive, trap-lite, warm build, focus, upbeat light, warm / nostalgic, cinematic / tension / drone, indie-acoustic, warm-celebratory-low, festive-dhol-upbeat, festive-upbeat-low, festive-pulse, garba-bass-drop, lo-fi-acoustic, nostalgic-cinematic, upbeat / festive-pop, upbeat / mid-tempo, lo-fi / acoustic, festive-upbeat / energetic, slowed / half-time. Loop-safe cuts of a tag where needed. The "slowed-reverb" tag holds only original compositions in that style; no trending-sound or platform-audio import path; CC0 or creator-owned music only. (all)
- [ ] **Base.** Music auto-fade over the final 20% of the template (CI tags this [IF AVAILABLE]; others treat it as base). (all)
- [ ] **Base.** Per-slot fixed music gain (a "has VO" flag sets music to -18 / -22 dBFS for that slot range with a 100ms ramp) as the no-audio-bus fallback. (CB, BP, FI)

## Audio bus (requested as a whole; every template renders without it)

- [ ] **Requested.** Sidechain auto-duck on the music bus under VO: 6-10 dB, 50-100ms attack / 200ms release; VO -6 dBFS peak, music -12 dBFS (no VO) / -18 to -24 dBFS (VO). Fallback: fixed music level. (TR, CI [IF AVAILABLE], PO, FI `[dep: audio bus]` P1, BP request 2)
- [ ] **Requested.** Loudness normalisation on the master: -14 LUFS integrated, -1 dBTP true peak. Fallback: peak normalisation to -3 dBFS with a warning badge. (TR, PO)
- [ ] **Requested.** Two music-volume keyframes per clip ("breath" dip 0.5-0.8s before the hero, planned silence 0.4s, -6 dB step at a section change). (PO E4, CI, CB, FI, BP)
- [ ] **Requested.** Unlinked audio in a slot: J-cut offset in frames (VO leads picture by 8 frames). (PO E4)
- [ ] **Requested.** Bundled CC0 SFX set, Verso-made, attachable to transitions and text pops as optional cue markers: soft / sharp whoosh, soft / hard impact, 1s riser ending on a cut or freeze, bass hit, pop, tick; -22 dBFS, under 300ms, per-template caps (2-4). Fallback: empty cue markers the creator fills from CC0 or own recordings. (TR, CI, PO E4, CB, FI, BP)
- [ ] **Requested.** Secondary audio track for SFX so cue markers hold clips directly instead of editing the music track. (BP request 3)
- [ ] **Base.** Dialogue peak normalisation to -6 dBFS (simple, not a compressor). (TR)
- [ ] **Base.** Original audio prioritised: speaker audio starts at frame 0 (cold audio) in talking templates. (PO, BP)

## Fonts and licensing

- [ ] **Base.** OFL fonts bundled from Google Fonts builds with licence files, picker locked to the bundle. Latin: Inter, Poppins, Montserrat, Oswald, Bebas Neue (Google Fonts / Dharma Type OFL build only; never the commercial Pro family), Anton, Cormorant Garamond, Playfair Display, Space Mono, Space Grotesk, JetBrains Mono. Devanagari: Noto Sans Devanagari, Hind, Mukta, Baloo 2, Yatra One, Modak, Rozha One, Khand, Teko, Tiro Devanagari Hindi. Other Indic: Noto Sans Tamil, Noto Sans Telugu. Emoji: Noto Color Emoji / Noto Emoji (OFL). (all)
- [ ] **Base.** Placeholder footage, headshots, B-roll, receipt stills and preview renders own-shot / own-rendered or CC0; no stock-site previews, watermarked comps or recognisable public figures. (PO, all)
- [ ] **Pre-ship (product / legal).** Confirm the H.264 encoder in use is already licensed (OS or hardware encoder). (FI)
- [ ] **Pre-ship (product / legal).** Trademark check on LUT names "Night Pop" and "Faded Print" before they appear in the UI. (FI)

## Summary of requested additions by priority

| Addition | Raised by | Templates depending on it | Fallback shipped |
|---|---|---|---|
| Still image in a video slot | FI P0 (assumed by TR, CB, CI) | TR Twenty Seconds, CB Photo Dump, CI Beat Drop Walk Dump, FI Diwali Dump, logo slots | None for photo dumps; confirm first |
| One-click language swap | FI P0 (assumed by TR, CI, PO) | all | Per-layer copy presets |
| Slot scale / position keyframes (Ken Burns, punch, drift) | TR, CI (a), PO E1, BP | TR 6 templates, CI 5, PO 6, BP all (slow push), CB optional | Static framing; zoom transition at the cut; alternating static crops |
| Audio bus (duck, LUFS, breath dips, J-cut, SFX pack, SFX track) | TR, CI, PO E4, FI P1, BP | all VO templates; all for fade / SFX | Fixed music gain per slot, -3 dBFS peak normalise, empty cue markers |
| Shape primitive, progress bar, gradient band, masks | TR, PO E3 | TR Five Things / One-Liner / Word Storm, PO Clip Countdown / Wide Shot Fit / Hot Take / Chapter Card / Night Mood / Headline Clip | Sticker sequences, PNG band, sticker frames |
| Background blur fill / inset on blurred self | CI (c), PO E2 | CI Print Stock, PO Wide Shot Fit, PO Two-Up wide state | Gradient fill / dark plate / letterbox on black |
| Source-fps read + frame blending | CI (b), PO E6 (assumed by TR, CB, FI) | every slow-motion slot | Manual 25% / 0.4x toggles, slot hints |
| Text stroke / outline / shadow | BP request 1 (assumed by TR, PO, CB, FI) | captions and labels in four packs | Plates |
| Per-layer text rotation | TR | TR Word Storm / One-Liner Sign / Photo Dump polaroids, FI Sahi Gift tag, CB Film Memory frames | 0 degrees |
| Keyframable text scale | BP request 4, PO | BP beat hits, PO Chapter Card shrink | Re-triggered pop |
| User-uploaded image sticker (logo) | CI (d), FI | CI Night Lights, FI Festive Film / Shubh Title + Outro | Text brand name from `{BRAND}` |
| Halation / bloom + anamorphic streak | PO E7 | PO Hot Take, Cinema Cut, Night Mood, Chapter Card | Off |
| Safe-zone hard lock | FI P1 | all | Default positions inside the safe area |
| Procedural backdrop generator | TR | TR Word Storm | Bundled CC0 loop |
| Letterbox ratio picker | FI P2 (base elsewhere) | FI Festive Film, Shubh Title 9:16 | Fixed 2.39 |
| Slot trimming | FI P2 | FI Sahi Gift | Fixed eight slots |
| Cross-canvas reframe + relayout | BP request 5 | BP Studio Cut, Offer Countdown | Separate variant files |
| Loop-check overlay | BP request 6 | BP Price Drop, Offer Countdown | None |
| Hinglish ASR plugin for karaoke prefill | TR (optional) | all karaoke templates | Typed words with syllable-distributed timings |
| Per-template beat-snap tolerance and slot flex as constants | CI open item 6 | every beat-synced template | Listed times used as written |
