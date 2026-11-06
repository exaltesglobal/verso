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
