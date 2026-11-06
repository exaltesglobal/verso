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
