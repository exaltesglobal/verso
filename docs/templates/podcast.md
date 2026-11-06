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
