# Verso Template Design Brief (2026)

Verso is a desktop reels editor by Agape Labs for India-first creators: podcasters, YouTubers and small businesses. This brief covers three things: the short-form formats working in 2026, the cinematic toolkit creators borrow from film, and 50 original templates in a machine-readable structure.

**Originality rule.** All template names, layouts, timings and copy below are original to Verso. The sources describe trends and platform behaviour only. Do not copy template names, layouts or assets from other editors (CapCut, VN, InShot, Canva, Edits or similar). Do not ship trending audio. Templates carry a `musicMood` and the user picks a licensed track.

## Catalogue (one list)

Every template we ship plus the ones still to build, cross-checked against the 48-name follow-up list. Built templates show their id in `src/templates`.

| Template | Pack | Tier | Status | Id / what to build |
| --- | --- | --- | --- | --- |
| Three-Second Promise | trending | Free | Built | `tr-three-second-promise` |
| POV Window | trending | Free | Built | `tr-pov-window` |
| Side-by-Side Take | trending | Free | Built | `tr-side-by-side-take` |
| Beat Typist | trending | Pro | Built | `tr-beat-typist` |
| Swipe Deck | trending | Free | Built | `tr-swipe-deck` |
| Five to One | trending | Free | Built | `tr-five-to-one` |
| Myth Buster Board | trending | Free | Built | `tr-myth-buster-board` |
| Then / Now Reveal | trending | Free | Built | `tr-then-now-wipe` |
| Day in Ten Frames | trending | Pro | Built | `tr-day-in-ten-frames` |
| Three-Step Fix | trending | Free | Built | `tr-three-step-fix` |
| Lessons Ledger | trending | Pro | Built | `tr-lessons-ledger` |
| Three-Panel Recap | trending | Pro | Built | `tr-triptych-day` |
| Price Ladder | trending | Free | Built | `tr-price-ladder` |
| Scope Opening | cinematic | Free | Built | `ci-scope-opening` |
| Sunlit Reel | cinematic | Pro | Built | `ci-sunlit-reel` |
| Silver Stakes | cinematic | Pro | Built | `ci-silver-stakes` |
| Neon Hours | cinematic | Pro | Built | `ci-neon-hours` |
| Coming Soon Cut | cinematic | Pro | Built | `ci-coming-soon-cut` |
| Ramp & Hold | cinematic | Free | Built | `ci-ramp-and-hold` |
| Slow Push Portrait | cinematic | Free | Built | `ci-slow-push-portrait` |
| Chapter Cards | cinematic | Pro | Built | `ci-chapter-cards` |
| Monsoon Frames | cinematic | Pro | Built | `ci-monsoon-frames` |
| Wide Frame Story | cinematic | Free | Built | `ci-wide-frame-story` |
| Film memories | cinematic | Free | Built | `cine-film-memories` |
| Travel montage | cinematic | Pro | Built | `cine-travel` |
| Mic Drop Clip | podcast | Free | Built | `pc-mic-drop-clip` |
| Two Chairs | podcast | Free | Built | `pc-two-chairs` |
| Waveform Card | podcast | Free | Built | `pc-waveform-card` |
| Hot Take Opener | podcast | Pro | Built | `pc-hot-take-opener` |
| Pull Quote Moment | podcast | Pro | Built | `pc-pull-quote-moment` |
| Guest Spotlight | podcast | Free | Built | `pc-guest-spotlight` |
| Hook + quote | podcast | Free | Built | `podcast-hook-quote` |
| Two-speaker | podcast | Free | Built | `podcast-two-speaker` |
| Big number stat | podcast | Pro | Built | `podcast-big-number` |
| Episode in three beats | podcast | Pro | Built | `podcast-chapters` |
| Hello, I'm | creator | Free | Built | `cb-hello-im` |
| Clean Talker | creator | Free | Built | `cb-clean-talker` |
| Quote Card | creator | Free | Built | `cb-quote-card` |
| Voice Over Visuals | creator | Free | Built | `cb-voice-over-visuals` |
| End Card | creator | Free | Built | `cb-end-card` |
| Photo Dump Beat | creator | Pro | Built | `cb-photo-dump-beat` |
| Day in my life | creator | Free | Built | `creator-day-in-life` |
| 3 tips | creator | Free | Built | `creator-three-tips` |
| Before / after | creator | Free | Built | `creator-before-after` |
| Product drop | creator | Pro | Built | `creator-product-drop` |
| Get ready with me | creator | Pro | Built | `creator-grwm` |
| Answering your questions | creator | Free | Built | `creator-qna` |
| Rangoli Lights | festive | Pro | Built | `fe-rangoli-lights` |
| Colour Burst | festive | Free | Built | `fe-colour-burst` |
| Chand Raat Greetings | festive | Free | Built | `fe-chand-raat` |
| Pookalam Morning | festive | Free | Built | `fe-pookalam-morning` |
| Harvest Sun | festive | Pro | Built | `fe-harvest-sun` |
| Pujo Dhak Beats | festive | Pro | Built | `fe-pujo-dhak` |
| Bappa Arrival | festive | Free | Built | `fe-bappa-arrival` |
| Star & Plum Cake | festive | Free | Built | `fe-star-and-plum` |
| Diwali greeting | festive | Free | Built | `festive-diwali` |
| Shop opening offer | festive | Free | Built | `festive-shop-opening` |
| Wedding teaser | festive | Pro | Built | `festive-wedding-teaser` |
| Fitness challenge | festive | Free | Built | `festive-fitness-challenge` |
| Food recipe | festive | Pro | Built | `festive-food-recipe` |
| Navratri nights | festive | Pro | Built | `festive-navratri` |
| Raksha Bandhan | festive | Free | Built | `festive-rakhi` |
| Shelf to Spotlight | business | Free | Built | `bz-shelf-to-spotlight` |
| Offer Countdown | business | Free | Built | `bz-offer-countdown` |
| Customer Says | business | Free | Built | `bz-customer-says` |
| Behind the Counter | business | Free | Built | `bz-behind-the-counter` |
| Menu Walk | business | Pro | Built | `bz-menu-walk` |
| Find Us | business | Free | Built | `bz-find-us` |
| Launch Day Drop | business | Pro | Built | `bz-launch-day-drop` |
| Event countdown | business | Pro | Built | `biz-event-countdown` |
| Service before / after | business | Free | Built | `biz-service-before-after` |
| One-Liner | trending | Free | To build | One line of text over a single shot, under 8 s |
| Twenty Seconds | trending | Free | To build | 20 s explainer with a running countdown (fallback: text timer layer) |
| Drop Walk | trending, creator | Pro | To build | Walk-in shot with a speed ramp on the beat drop |
| Hero Frame | cinematic | Pro | To build | Letterboxed hero shot, slow push, one title |
| Print Stock | cinematic | Pro | To build | Film-print look (fallback until halation ships: warm-film grade plus grain) |
| Night Lights | cinematic | Free (seasonal) | To build | Festive night lights, soft leaks on two cuts |
| Cinema Cut | podcast | Pro | To build | Podcast clip in 2.39 letterbox, teal-orange grade |
| Night Mood | podcast | Pro | To build | Late-night talk: cool-night grade, low-key text |
| Clip Countdown | podcast | Free | To build | Top three moments counted down 3, 2, 1 |
| Wide Shot Fit | podcast | Free | To build | 16:9 shot inset in 9:16 (needs blur fill; fallback: dark plate) |
| Clip Frame | creator | Free | To build | Clip inside a framed card, headline above |
| Galti Mat Karo | creator | Free | To build | Hinglish "don't make this mistake" list with a payoff |
| Shubh Bolo | festive | Free | To build | One greeting for any festival, festival name swaps in |
| Sahi Gift | festive | Free | To build | Festive gift guide: three picks and a CTA |
| Diwali Dump | festive | Free | To build | Diwali photo dump on the beat (photo slots now work) |
| Festive Film | festive | Pro | To build | Cinematic festival recap with a title card |
| Ghar Ki Taiyaari | festive | Free | To build | Home prep before the festival, before/after beats |
| Shubh Title + Outro | festive | Pro | To build | Branded festive title card and outro pair |
| Five Reasons | business | Free | To build | Five reasons to buy, numbered points |
| Founder Note | business | Free | To build | Founder to camera, three points, signature CTA |
| Studio Cut | business | Pro | To build | Product on a studio backdrop (needs backdrop generator; fallback: colour plate) |
| Signature Walk | business | Pro (Full), Free (Lite) | To build | Owner walks through the shop, ramp on entry |

Follow-up names we already cover under another name: Wide Frame = Wide Frame Story; Snap Reveal = Then / Now Reveal; Straight Talk, Just Talking = Clean Talker; Five Things = Five to One; Word Storm = Beat Typist; Slow Burn = Slow Push Portrait; Beat Drop Walk = Ramp & Hold; Faded Memory = Film memories; Title Card = Chapter Cards; Silver = Silver Stakes; Headline Clip = Mic Drop Clip; Two-Up Exchange = Two Chairs; Hot Take Montage = Hot Take Opener; Chapter Card = Episode in three beats; Photo Dump = Photo Dump Beat; Teaser = Coming Soon Cut; Dhoop = Sunlit Reel; Rangoli Reveal = Rangoli Lights; Garba Drop = Navratri nights; Price Drop = Price Ladder; Before and After Snap = Service before / after. Behind the Counter and Offer Countdown exist under those names.

### Design rules (enforced by `withRules` in `src/templates/rules.ts`)

- The hook slot ends by 3 s: longer first slots are split, and the rest keeps the framing. Text is on frame 0. Dips at the ends are capped at 0.25 s, so there are no black holds.
- Look: a grade plus at most two of grain, vignette and letterbox (vignette is dropped first). Light leaks flash on at most two transitions.
- Three text roles: Headline (first line), Point, CTA (last line). Size floors: 56 px Latin, 64 px Devanagari on 1080x1920 (applied in `applyTemplate`).
- Copy: Hinglish (`hi`) is the default when a template has it; English is always there. Still to write: Devanagari Hindi presets for every layer, and Hinglish for the 94 hand-made layers that lack it.
- Every slot shows "Min clip N s". Photos (jpg, png, webp) fill any slot as a still.
- Safe zones: top 10%, bottom 20%, right 12%. Text centres are clamped out of the top and bottom zones. `SafeZoneOverlay` shows the zones in the preview.
- Beat snap tolerance per pack: `BEAT_SNAP_TOLERANCE` (a template can override it with `beatSnap`).
- Fonts: no template uses Bebas Neue; if one does, use only the OFL `@fontsource/bebas-neue`. Sticker emoji should bundle Noto Emoji (OFL); today they use the system emoji font.
- There is no trending-audio import path, and none should be added. Templates carry a `musicMood` only.

---

## 1. Trends summary (2025–2026)

### Platform signals that shape every template

- **The first 2–3 seconds decide reach.** Hook-first editing in the opening two seconds is one of the five core patterns of 2026 short-form ([ShortVids](https://shortvids.co/short-form-video-trends/)). Short Reels of 7–15 s that get watched twice beat longer ones on completion ([r/InstagramEmpire, Apr 2026](https://www.reddit.com/r/InstagramEmpire/comments/1slz15c/i_analyzed_whats_working_on_instagram_reels_in/)). Every template therefore opens on a text hook or a motion hit within 0–1 s.
- **Shares count more than likes.** Reel shares rose 67% YoY ([Metricool](https://metricool.com/instagram-trends/)). DM sends drive distribution ([CreatorFlow](https://creatorflow.so/blog/instagram-trends-creators-marketers/)). Myth/fact, listicles and quotes are all formats people send to a friend.
- **Raw beats polished, but structure still wins.** Unpolished, off-the-cuff content beats high production ([New Engen](https://newengen.com/insights/instagram-trends/), [CreatorFlow](https://creatorflow.so/blog/instagram-trends-creators-marketers/)). Templates should add structure (hook, beats, payoff, captions) without making footage look artificial.
- **Carousels lead engagement; Reels lead reach.** Carousels get 9x more saves ([Metricool](https://metricool.com/instagram-trends/)). Instagram's Edits app added a mixed photo/video carousel editor in Oct 2026 ([CreatorFlow](https://creatorflow.so/blog/instagram-trends-creators-marketers/)). Swipe-style photo reels bring carousel pacing to video.
- **Captions work like search.** Keyword-rich captions are replacing hashtags ([Metricool](https://metricool.com/instagram-trends/)). Word-timed captions are expected on faceless Shorts ([Treza Labs](https://www.trezalabs.com/blog/faceless-youtube-shorts)). Every template defines a caption style.
- **Format trends last 3–4 weeks; audio trends run longer** ([New Engen](https://newengen.com/insights/instagram-trends/)). Ship formats as evergreen structures. Rotate the "Trending" pack monthly.

### Formats working now, and why

| Format | Why it works | Source |
|---|---|---|
| Hook cards | Bold on-screen promise in the first 2 s stops the scroll | [ShortVids](https://shortvids.co/short-form-video-trends/), [FlexWork](https://flexworkstudios.com/short-form-video-trends/) |
| POV storytelling | Puts the viewer inside the scene; easy for anyone to shoot | [Hootsuite](https://blog.hootsuite.com/tiktok-trends/), [New Engen](https://newengen.com/insights/instagram-trends/) |
| Split-screen reactions / duets | Two reads of one moment; built for remixing and replies | [FlexWork](https://flexworkstudios.com/short-form-video-trends/) (listener reactions, stitches) |
| Text-on-beat / kinetic text | Holds silent viewers; music sync raises completion | [Radaar, Feb 2026](https://www.radaar.io/resources-121/blog-388/what-are-the-hottest-instagram-reels-trends-shaking-up-your-feed-right-now-and-how-can-you-use-them-to-skyrocket-engagement-in-february-2026-16429/) |
| Carousel-style swipe reels | Carousel pacing in video; photo-first creators can join | [Metricool](https://metricool.com/instagram-trends/), [CreatorFlow](https://creatorflow.so/blog/instagram-trends-creators-marketers/) |
| Listicle countdowns | Open loop ("#1 is…") keeps viewers to the end | [Treza Labs](https://www.trezalabs.com/blog/faceless-youtube-shorts) (top-3 at 45–60 s) |
| Myth vs fact | Gets saved and shared; positions the creator as an expert | [Metricool](https://metricool.com/instagram-trends/) (shares/saves) |
| Before / after, on-off toggles | One transition shows the change; very rewatchable | [Hootsuite](https://blog.hootsuite.com/tiktok-trends/), [Later, Aug 2026](https://later.com/blog/instagram-reels-trends/) |
| Day-in-the-life, rapid-fire recap | A phone, a routine and captions are enough | [Anijam](https://www.anijam.ai/blog/youtube-shorts-trends/), [Later, Sep 2026](https://later.com/blog/instagram-reels-trends/) |
| Three-panel collage recaps | Eat / wear / go structure; one screen, three stories | [Later, Jul 2026](https://later.com/blog/instagram-reels-trends/) |
| Escalating-number reactions | Each step raises the stakes; adapts to prices and results | [New Engen](https://newengen.com/insights/instagram-trends/) |
| Age / lessons hooks | A number in the hook is instantly relatable | [Later, Sep 2026](https://later.com/blog/instagram-reels-trends/) |
| Mini tutorials | Tap-to-pause (2026) makes step-by-step text easier to follow | [Metricool](https://metricool.com/instagram-trends/), [NexLev](https://www.nexlev.io/youtube-shorts-niches) |
| Quote cards | Cheap to make, highly shareable, work across niches | [Metricool](https://metricool.com/instagram-trends/) |
| Faceless explainers | 38% of new monetisation ventures in 2026 are faceless; clear VO lifts retention | [Anijam](https://www.anijam.ai/blog/youtube-shorts-trends/), [Fliki](https://fliki.ai/blog/best-faceless-youtube-niches) |
| Podcast clips | 30–60 s vertical highlights with word-timed captions are the main podcast growth lever | [Treza Labs](https://www.trezalabs.com/blog/faceless-youtube-shorts), [FlexWork](https://flexworkstudios.com/short-form-video-trends/) |
| Panoramic / wide-frame Reels | Cinematic widescreen inside vertical feels new | [Radaar](https://www.radaar.io/resources-121/blog-388/what-are-the-hottest-instagram-reels-trends-shaking-up-your-feed-right-now-and-how-can-you-use-them-to-skyrocket-engagement-in-february-2026-16429/) |
| Indian festive content | Diwali is the top influencer season; 42% of brands raise spend | [MediaNews4U](https://www.medianews4u.com/diwali-remains-the-top-influencer-marketing-season-with-42-of-brands-increasing-spend-sohail-qadri-khan-kofluence/), [Verve Media](https://vervemedia.co.in/video-ideas-for-diwali-or-upcoming-festive-season) |
| Hindi and regional-language content | 68% of Indian creators make mainly Hindi content and 24% regional; 77% of Indian Gen Z watched translated creators | [Instagram post citing creator survey](https://www.instagram.com/p/DZeZic5iI1t/), [Buzzincontent / YouTube](https://www.buzzincontent.com/insight/youtube-reports-that-77-of-gen-z-in-india-watched-creators-in-translated-formats-10892375) |
| Business promo (UGC-style, BTS) | Native-looking, creator-led ads beat studio spots; BTS builds trust | [ShortVids](https://shortvids.co/short-form-video-trends/), [TikTok Next 2026](https://ads.tiktok.com/business/en-US/next) |

**Design consequences for Verso.** Every text layer needs an English copy and a Hindi/Hinglish copy, plus an optional regional field (`ta`, `ml`, `bn`, `mr`). Captions must render Devanagari and other Indic scripts. Most templates last 8–20 s, with podcast and chapter formats up to 45 s.

---

## 2. Cinematic toolkit for short-form

Values are Verso preset defaults. `0–1` means effect strength.

| Tool | Verso preset / default | Use |
|---|---|---|
| **Letterbox** | `2.39` (scope), `2.00` (univisium), `1.85` (flat). In 9:16 the bars are horizontal mattes; animate them in over 0.6 s | Instant "film" signal; opening and closing beats |
| **Wide-in-vertical** | 16:9 or 2.39 frame centred with blurred, darkened fill (blur 40px, brightness −35%) | Panoramic Reels, landscape b-roll |
| **Grade: teal-orange** | Shadows toward teal (hue 190°, +12 sat), skin/highlights toward orange (hue 30°), contrast +10 | Action, travel, trailers |
| **Grade: warm-film** | Temperature +12, lifted blacks +6, highlights rolled off, slight green in shadows, sat −8 | Nostalgia, family, festive |
| **Grade: bleach-bypass** | Sat −45, contrast +25, slight silver highlights | Stark drama, sport, grit |
| **Grade: cool-night** | Temperature −15, shadows blue-cyan, neon highlights kept, crushed blacks −4 | Night drives, city, moody VO |
| **Grade: golden-hour** | Temperature +18, tint +4 magenta, soft highlights | Portraits, weddings, harvest |
| **Grade: monsoon-green** | Temperature −6, greens +15 sat, shadows teal-green | Rain, Kerala and Northeast landscapes |
| **Grade: mono-silver** | B/W with red filter mix, contrast +15 | Quotes, memories |
| **Film grain** | Size 1.2, strength 0.10–0.40, animated per frame, luma-weighted (more in mids) | Hides compression and phone sharpness. Above 0.35, social compression smears grain |
| **Vignette** | Strength 0.15–0.45, feather 0.7, roundness 0.6 | Focus on subject; pairs with push-in |
| **Light leaks** | Overlay assets `amber-edge`, `rose-sweep`, `gold-flash`; screen blend, 0.25–0.6 opacity, 0.5–1.2 s | Transitions between memories; festive warmth |
| **Anamorphic flare** | Horizontal streak, blue (`cine-blue`) or amber (`amber-streak`), linked to brightest point or keyframed | Night lights, headlights, diyas |
| **Push-in (slow zoom)** | Scale 1.00 to 1.08–1.15 over slot, ease-in-out | Builds tension on a face or product |
| **Punch-in (axial cut)** | Instant scale jump 1.00 to 1.25 on beat | Emphasis in talking heads |
| **Speed ramp** | 100% to 20–35% to 100% with optical-flow interpolation; ramp duration 0.3–0.5 s | Action peaks, colour throws, reveals |
| **Dip-to-black** | 0.25 s out, 0.1 s hold, 0.25 s in | Chapter breaks, trailer beats |
| **Serif title card** | Centred serif, tracking +80, small caps subtitle, fade/blur-in 0.8 s | Chapters, openings, quotes |
| **Freeze frame** | Hold 0.6–1.2 s with grain kept animated | Payoff, quote moments |
| **Sound design cues** | `riser` (1–2 s before reveal), `bass-hit` on title, `whoosh` on slide, `tape-stop` before drop, `room-tone` under silence, `film-projector` loop at −28 dB | Cinematic feel comes as much from sound as from picture |

---

## 3. Templates

### Schema (applies to every block)

```yaml
id: string            # pack prefix + slug, stable, kebab-case
name: string          # user-facing, original
pack: trending | cinematic | podcast | creator-basics | festive-india | business
pro: bool
aspect: "9:16" | "1:1" | "4:5" | "16:9"
duration: number      # seconds
musicMood: string     # tag for licensed library; BPM where it matters
layout: full | split-v | split-h | triptych-v | pip   # optional, default full
look:
  grade: preset-id    # see section 2
  intensity: 0-1
  grain: 0-1
  vignette: 0-1
  letterbox: none | "2.39" | "2.00" | "1.85"
  leak: none | {preset, opacity, at: [s]}
  flare: none | {preset, intensity}
slots:                # media drop zones, in time order
  - {id, kind: video|photo, from, to, crop, zoom?, ramp?, region?}
  # crop: face-center | product-center | full-bleed | thirds-left | thirds-right | top-half | bottom-half | wide-fit
  # zoom: "1.00>1.10" (start>end scale, ease-in-out) | "punch 1.25@t"
  # ramp: "100>30@t1>100@t2" (speed % at seconds within slot)
text:
  - {id, en, hi, pos, style, anim, from, to}   # optional regional keys: ta, ml, bn, mr
  # pos: top | upper-third | center | lower-third | bottom-safe | top-left | top-right
  # style: hook-bold | kinetic-caps | serif-title | serif-sub | quote-serif | number-xl | label-pill | sticker | lower-third | handwritten | price-tag | deva-display
  # anim: pop | typewriter | slide-up | blur-in | bounce | word-by-word
transitions:
  - {between: [a, b], type: fade|dissolve|slide|zoom|dip-to-black|cut, dur}
captions: caption-style-id   # cap-bold-highlight | cap-karaoke | cap-minimal | cap-boxed | cap-serif-cine | cap-bilingual | none
sfx: [{at, cue}]             # optional
whyItWorks: string
```

**Safe zone.** Keep all text out of the bottom 20% and right 12% of 9:16 frames, where platform UI sits. `bottom-safe` means 72–78% height.

**Hindi copy.** `hi` is natural Hindi or Hinglish as a creator would write it, not a literal translation. Festive greetings must be checked by a native speaker before release.

---

### 3.1 Trending pack (13)

```yaml
id: tr-three-second-promise
name: Three-Second Promise
pack: trending
pro: false
aspect: "9:16"
duration: 12
musicMood: upbeat-minimal 110bpm
look: {grade: clean-pop, intensity: 0.4, grain: 0.05, vignette: 0.1, letterbox: none, leak: none, flare: none}
slots:
  - {id: s1, kind: video, from: 0, to: 3, crop: face-center, zoom: "1.00>1.06"}
  - {id: s2, kind: video, from: 3, to: 8, crop: full-bleed}
  - {id: s3, kind: video, from: 8, to: 12, crop: face-center, zoom: "punch 1.20@9.0"}
text:
  - {id: hook, en: "Watch this before you buy another course", hi: "Agla course lene se pehle ye dekho", pos: upper-third, style: hook-bold, anim: pop, from: 0, to: 3}
  - {id: payoff, en: "Saved you ₹5,000. Share it.", hi: "₹5,000 bacha diye. Share karo.", pos: upper-third, style: label-pill, anim: slide-up, from: 9.5, to: 12}
transitions:
  - {between: [s1, s2], type: zoom, dur: 0.3}
  - {between: [s2, s3], type: cut, dur: 0}
captions: cap-bold-highlight
sfx: [{at: 0.0, cue: bass-hit}, {at: 3.0, cue: whoosh}]
whyItWorks: A specific promise in the first frame gives viewers a reason to stay, and the payoff line asks for the share.
```

```yaml
id: tr-pov-window
name: POV Window
pack: trending
pro: false
aspect: "9:16"
duration: 10
musicMood: dreamy-lofi 85bpm
look: {grade: warm-film, intensity: 0.35, grain: 0.15, vignette: 0.2, letterbox: none, leak: none, flare: none}
slots:
  - {id: s1, kind: video, from: 0, to: 4, crop: full-bleed, zoom: "1.00>1.08"}
  - {id: s2, kind: video, from: 4, to: 7, crop: full-bleed}
  - {id: s3, kind: video, from: 7, to: 10, crop: full-bleed, zoom: "1.05>1.00"}
text:
  - {id: pov, en: "POV: your first chai after a 12-hour shift", hi: "POV: 12 ghante ki shift ke baad pehli chai", pos: upper-third, style: kinetic-caps, anim: typewriter, from: 0.2, to: 4}
  - {id: kicker, en: "worth it.", hi: "worth it.", pos: center, style: handwritten, anim: blur-in, from: 7.5, to: 10}
transitions:
  - {between: [s1, s2], type: dissolve, dur: 0.4}
  - {between: [s2, s3], type: dissolve, dur: 0.4}
captions: none
whyItWorks: First-person framing lets anyone star with three phone shots, and the relatable caption does the storytelling.
```

```yaml
id: tr-side-by-side-take
name: Side-by-Side Take
pack: trending
pro: false
aspect: "9:16"
duration: 15
musicMood: none (dialogue-led), light bed optional
layout: split-v
look: {grade: neutral, intensity: 0.2, grain: 0.0, vignette: 0.0, letterbox: none, leak: none, flare: none}
slots:
  - {id: src, kind: video, from: 0, to: 15, crop: wide-fit, region: top}
  - {id: react, kind: video, from: 0, to: 15, crop: face-center, region: bottom, zoom: "punch 1.25@6.0"}
text:
  - {id: label, en: "My honest reaction", hi: "Mera honest reaction", pos: center, style: label-pill, anim: pop, from: 0, to: 2.5}
  - {id: verdict, en: "Verdict: 7/10", hi: "Verdict: 10 mein 7", pos: center, style: number-xl, anim: bounce, from: 12.5, to: 15}
transitions: []
captions: cap-boxed
whyItWorks: The original and the reaction share one screen, so viewers get two reads of the same moment and the format invites replies.
```

```yaml
id: tr-beat-typist
name: Beat Typist
pack: trending
pro: true
aspect: "9:16"
duration: 8
musicMood: punchy-electronic 128bpm (beat grid required)
look: {grade: clean-pop, intensity: 0.5, grain: 0.08, vignette: 0.15, letterbox: none, leak: none, flare: none}
slots:
  - {id: s1, kind: video, from: 0, to: 2, crop: full-bleed}
  - {id: s2, kind: video, from: 2, to: 4, crop: full-bleed, zoom: "punch 1.15@3.0"}
  - {id: s3, kind: video, from: 4, to: 6, crop: full-bleed}
  - {id: s4, kind: video, from: 6, to: 8, crop: face-center, zoom: "1.00>1.12"}
text:
  - {id: line, en: "Stop. Scrolling. This. Changes. Everything.", hi: "Ruko. Scroll. Mat. Karo. Ye. Dekho.", pos: center, style: kinetic-caps, anim: word-by-word, from: 0, to: 6}
  - {id: tag, en: "@yourhandle", hi: "@yourhandle", pos: bottom-safe, style: label-pill, anim: slide-up, from: 6.2, to: 8}
transitions:
  - {between: [s1, s2], type: cut, dur: 0}
  - {between: [s2, s3], type: cut, dur: 0}
  - {between: [s3, s4], type: zoom, dur: 0.2}
captions: none
whyItWorks: Each word lands on a beat, so sound-off viewers read along and sound-on viewers feel the sync, which lifts completion.
```

```yaml
id: tr-swipe-deck
name: Swipe Deck
pack: trending
pro: false
aspect: "4:5"
duration: 10
musicMood: soft-pop 100bpm
look: {grade: pastel-fade, intensity: 0.4, grain: 0.06, vignette: 0.0, letterbox: none, leak: none, flare: none}
slots:
  - {id: p1, kind: photo, from: 0, to: 2, crop: full-bleed, zoom: "1.00>1.04"}
  - {id: p2, kind: photo, from: 2, to: 4, crop: full-bleed, zoom: "1.00>1.04"}
  - {id: p3, kind: photo, from: 4, to: 6, crop: full-bleed, zoom: "1.00>1.04"}
  - {id: p4, kind: photo, from: 6, to: 8, crop: full-bleed, zoom: "1.00>1.04"}
  - {id: p5, kind: photo, from: 8, to: 10, crop: full-bleed, zoom: "1.00>1.04"}
text:
  - {id: title, en: "5 cafés in Pune worth the hype", hi: "Pune ke 5 café jo sach mein worth hain", pos: top, style: hook-bold, anim: pop, from: 0, to: 2}
  - {id: counter, en: "{n}/5", hi: "{n}/5", pos: top-right, style: label-pill, anim: pop, from: 2, to: 10}
  - {id: name, en: "{place name}", hi: "{place name}", pos: bottom-safe, style: lower-third, anim: slide-up, from: 2, to: 10}
transitions:
  - {between: [p1, p2], type: slide, dur: 0.25}
  - {between: [p2, p3], type: slide, dur: 0.25}
  - {between: [p3, p4], type: slide, dur: 0.25}
  - {between: [p4, p5], type: slide, dur: 0.25}
captions: none
whyItWorks: Brings carousel save-and-swipe pacing into video, so photo-first creators can compete for Reels reach.
```

```yaml
id: tr-five-to-one
name: Five to One
pack: trending
pro: false
aspect: "9:16"
duration: 20
musicMood: building-tension 120bpm
look: {grade: clean-pop, intensity: 0.45, grain: 0.05, vignette: 0.15, letterbox: none, leak: none, flare: none}
slots:
  - {id: s0, kind: video, from: 0, to: 2, crop: face-center}
  - {id: s5, kind: video, from: 2, to: 5.5, crop: full-bleed}
  - {id: s4, kind: video, from: 5.5, to: 9, crop: full-bleed}
  - {id: s3, kind: video, from: 9, to: 12.5, crop: full-bleed}
  - {id: s2, kind: video, from: 12.5, to: 16, crop: full-bleed}
  - {id: s1, kind: video, from: 16, to: 20, crop: full-bleed, zoom: "1.00>1.12"}
text:
  - {id: hook, en: "Top 5 apps I use daily (#1 is free)", hi: "Roz use hone wale top 5 apps (#1 free hai)", pos: upper-third, style: hook-bold, anim: pop, from: 0, to: 2}
  - {id: num, en: "#{n}", hi: "#{n}", pos: top-left, style: number-xl, anim: bounce, from: 2, to: 20}
  - {id: item, en: "{item name}", hi: "{item name}", pos: upper-third, style: label-pill, anim: slide-up, from: 2, to: 20}
transitions:
  - {between: [s0, s5], type: zoom, dur: 0.25}
  - {between: [s5, s4], type: slide, dur: 0.2}
  - {between: [s4, s3], type: slide, dur: 0.2}
  - {between: [s3, s2], type: slide, dur: 0.2}
  - {between: [s2, s1], type: dip-to-black, dur: 0.5}
captions: cap-bold-highlight
sfx: [{at: 15.4, cue: riser}, {at: 16.0, cue: bass-hit}]
whyItWorks: A countdown is an open loop, so viewers stay for number one, and the dip before the top item makes it feel like a reveal.
```

```yaml
id: tr-myth-buster-board
name: Myth Buster Board
pack: trending
pro: false
aspect: "9:16"
duration: 14
musicMood: quirky-pluck 105bpm
look: {grade: clean-pop, intensity: 0.35, grain: 0.0, vignette: 0.1, letterbox: none, leak: none, flare: none}
slots:
  - {id: s1, kind: video, from: 0, to: 5, crop: face-center}
  - {id: s2, kind: video, from: 5, to: 11, crop: face-center, zoom: "punch 1.20@5.0"}
  - {id: s3, kind: video, from: 11, to: 14, crop: face-center}
text:
  - {id: myth, en: "MYTH: Ghee makes you fat", hi: "MYTH: Ghee se mota hote ho", pos: upper-third, style: sticker, anim: pop, from: 0, to: 5}
  - {id: fact, en: "FACT: Portion size matters more", hi: "FACT: Kitna khaate ho, wo zyada matter karta hai", pos: upper-third, style: sticker, anim: bounce, from: 5, to: 11}
  - {id: cta, en: "Send this to someone who needs it", hi: "Jisko zaroorat hai usse bhejo", pos: upper-third, style: label-pill, anim: slide-up, from: 11, to: 14}
transitions:
  - {between: [s1, s2], type: zoom, dur: 0.2}
  - {between: [s2, s3], type: cut, dur: 0}
captions: cap-bold-highlight
sfx: [{at: 0.2, cue: buzzer-soft}, {at: 5.0, cue: ding}]
whyItWorks: Correcting a common belief makes people send it to someone, and shares are the strongest ranking signal in 2026.
```

```yaml
id: tr-then-now-wipe
name: Then / Now Reveal
pack: trending
pro: false
aspect: "9:16"
duration: 8
musicMood: reveal-drop 115bpm (drop at 3.5s)
look: {grade: clean-pop, intensity: 0.4, grain: 0.05, vignette: 0.1, letterbox: none, leak: none, flare: none}
slots:
  - {id: before, kind: video, from: 0, to: 3.5, crop: full-bleed, zoom: "1.00>1.05"}
  - {id: after, kind: video, from: 3.5, to: 8, crop: full-bleed, ramp: "30>100@0.6"}
text:
  - {id: b, en: "Before", hi: "Pehle", pos: top-left, style: label-pill, anim: pop, from: 0, to: 3.5}
  - {id: a, en: "After 30 days", hi: "30 din baad", pos: top-left, style: label-pill, anim: pop, from: 3.5, to: 8}
transitions:
  - {between: [before, after], type: slide, dur: 0.3}
captions: none
sfx: [{at: 3.3, cue: whoosh}]
whyItWorks: The whole change shows in one transition timed to the drop, and viewers replay it to compare.
```

```yaml
id: tr-day-in-ten-frames
name: Day in Ten Frames
pack: trending
pro: true
aspect: "9:16"
duration: 15
musicMood: bright-funk 118bpm
look: {grade: warm-film, intensity: 0.3, grain: 0.12, vignette: 0.15, letterbox: none, leak: {preset: amber-edge, opacity: 0.3, at: [7.5]}, flare: none}
slots:
  - {id: f1, kind: video, from: 0.0, to: 1.5, crop: full-bleed}
  - {id: f2, kind: video, from: 1.5, to: 3.0, crop: full-bleed}
  - {id: f3, kind: video, from: 3.0, to: 4.5, crop: full-bleed}
  - {id: f4, kind: video, from: 4.5, to: 6.0, crop: full-bleed}
  - {id: f5, kind: video, from: 6.0, to: 7.5, crop: full-bleed}
  - {id: f6, kind: video, from: 7.5, to: 9.0, crop: full-bleed}
  - {id: f7, kind: video, from: 9.0, to: 10.5, crop: full-bleed}
  - {id: f8, kind: video, from: 10.5, to: 12.0, crop: full-bleed}
  - {id: f9, kind: video, from: 12.0, to: 13.5, crop: full-bleed}
  - {id: f10, kind: video, from: 13.5, to: 15.0, crop: full-bleed, zoom: "1.00>1.08"}
text:
  - {id: time, en: "{6:30 AM}", hi: "{subah 6:30}", pos: top-left, style: label-pill, anim: typewriter, from: 0, to: 15}
  - {id: title, en: "A day as a solo founder in Indore", hi: "Indore mein solo founder ka ek din", pos: upper-third, style: hook-bold, anim: pop, from: 0, to: 1.5}
transitions:
  - {between: [f5, f6], type: dissolve, dur: 0.3}
captions: cap-minimal
whyItWorks: A whole day compressed into 1.5 s beats feels like a scrapbook and rewards a rewatch, and the clock label anchors each moment.
```

```yaml
id: tr-three-step-fix
name: Three-Step Fix
pack: trending
pro: false
aspect: "9:16"
duration: 20
musicMood: focus-lofi 90bpm
look: {grade: neutral, intensity: 0.3, grain: 0.0, vignette: 0.1, letterbox: none, leak: none, flare: none}
slots:
  - {id: hook, kind: video, from: 0, to: 3, crop: face-center}
  - {id: st1, kind: video, from: 3, to: 8, crop: product-center, zoom: "1.00>1.10"}
  - {id: st2, kind: video, from: 8, to: 13, crop: product-center, zoom: "1.00>1.10"}
  - {id: st3, kind: video, from: 13, to: 18, crop: product-center, zoom: "1.00>1.10"}
  - {id: result, kind: video, from: 18, to: 20, crop: full-bleed}
text:
  - {id: h, en: "Fix a slow laptop in 3 steps", hi: "Slow laptop 3 steps mein fast karo", pos: upper-third, style: hook-bold, anim: pop, from: 0, to: 3}
  - {id: step, en: "Step {n}: {action}", hi: "Step {n}: {action}", pos: top, style: label-pill, anim: slide-up, from: 3, to: 18}
  - {id: done, en: "Done. Save for later.", hi: "Ho gaya. Save kar lo.", pos: upper-third, style: label-pill, anim: pop, from: 18, to: 20}
transitions:
  - {between: [hook, st1], type: slide, dur: 0.2}
  - {between: [st1, st2], type: slide, dur: 0.2}
  - {between: [st2, st3], type: slide, dur: 0.2}
  - {between: [st3, result], type: zoom, dur: 0.25}
captions: cap-boxed
whyItWorks: Numbered steps with persistent labels fit the new tap-to-pause habit and get saved as a reference.
```

```yaml
id: tr-lessons-ledger
name: Lessons Ledger
pack: trending
pro: true
aspect: "9:16"
duration: 15
musicMood: reflective-piano 80bpm
look: {grade: warm-film, intensity: 0.4, grain: 0.18, vignette: 0.25, letterbox: none, leak: none, flare: none}
slots:
  - {id: s1, kind: video, from: 0, to: 3, crop: face-center, zoom: "1.00>1.06"}
  - {id: s2, kind: video, from: 3, to: 7, crop: full-bleed}
  - {id: s3, kind: video, from: 7, to: 11, crop: full-bleed}
  - {id: s4, kind: video, from: 11, to: 15, crop: face-center, zoom: "1.00>1.08"}
text:
  - {id: hook, en: "Things I know at 32 that I wish I knew at 22", hi: "32 mein jo samjha, kaash 22 mein samajh aata", pos: upper-third, style: serif-title, anim: blur-in, from: 0, to: 3}
  - {id: lesson, en: "{n}. {lesson}", hi: "{n}. {lesson}", pos: center, style: quote-serif, anim: typewriter, from: 3, to: 15}
transitions:
  - {between: [s1, s2], type: dissolve, dur: 0.4}
  - {between: [s2, s3], type: dissolve, dur: 0.4}
  - {between: [s3, s4], type: dissolve, dur: 0.4}
captions: none
whyItWorks: A number in the hook speaks straight to the viewer's own age group, and the calm serif treatment makes each lesson worth reading.
```

```yaml
id: tr-triptych-day
name: Three-Panel Recap
pack: trending
pro: true
aspect: "9:16"
duration: 9
musicMood: retro-disco 120bpm
layout: triptych-v
look: {grade: clean-pop, intensity: 0.45, grain: 0.06, vignette: 0.0, letterbox: none, leak: none, flare: none}
slots:
  - {id: top, kind: video, from: 0, to: 9, crop: full-bleed, region: top}
  - {id: mid, kind: video, from: 1, to: 9, crop: full-bleed, region: middle}
  - {id: bot, kind: video, from: 2, to: 9, crop: full-bleed, region: bottom}
text:
  - {id: l1, en: "ate", hi: "khaaya", pos: top-left, style: handwritten, anim: pop, from: 0, to: 9}
  - {id: l2, en: "wore", hi: "pehna", pos: center, style: handwritten, anim: pop, from: 1, to: 9}
  - {id: l3, en: "went", hi: "gaye", pos: lower-third, style: handwritten, anim: pop, from: 2, to: 9}
transitions: []
captions: none
whyItWorks: Three panels that appear one by one tell a whole day on a single screen, with no cuts for viewers to miss.
```

```yaml
id: tr-price-ladder
name: Price Ladder
pack: trending
pro: false
aspect: "9:16"
duration: 10
musicMood: comedic-build 125bpm (rising energy)
look: {grade: clean-pop, intensity: 0.4, grain: 0.0, vignette: 0.1, letterbox: none, leak: none, flare: none}
slots:
  - {id: r1, kind: video, from: 0, to: 2.5, crop: face-center}
  - {id: r2, kind: video, from: 2.5, to: 5, crop: face-center, zoom: "punch 1.15@2.5"}
  - {id: r3, kind: video, from: 5, to: 7.5, crop: face-center, zoom: "punch 1.30@5.0"}
  - {id: r4, kind: video, from: 7.5, to: 10, crop: face-center, zoom: "punch 1.45@7.5"}
text:
  - {id: tier, en: "My reaction to a ₹{amount} {thing}", hi: "₹{amount} wale {thing} pe mera reaction", pos: upper-third, style: number-xl, anim: bounce, from: 0, to: 10}
transitions:
  - {between: [r1, r2], type: cut, dur: 0}
  - {between: [r2, r3], type: cut, dur: 0}
  - {between: [r3, r4], type: cut, dur: 0}
captions: none
whyItWorks: Each step raises the number and the zoom, so the energy builds, and the format works for prices, offers or results.
```

### 3.2 Cinematic pack (10)

```yaml
id: ci-scope-opening
name: Scope Opening
pack: cinematic
pro: false
aspect: "9:16"
duration: 15
musicMood: ambient-swell, slow build, no drums until 10s
look: {grade: teal-orange, intensity: 0.55, grain: 0.18, vignette: 0.3, letterbox: "2.39", leak: none, flare: none}
slots:
  - {id: s1, kind: video, from: 0, to: 5, crop: wide-fit, zoom: "1.00>1.08"}
  - {id: s2, kind: video, from: 5, to: 10, crop: wide-fit}
  - {id: s3, kind: video, from: 10, to: 15, crop: wide-fit, zoom: "1.00>1.12"}
text:
  - {id: title, en: "THE LONG WAY HOME", hi: "घर का लंबा रास्ता", pos: center, style: serif-title, anim: blur-in, from: 1, to: 4.5}
  - {id: sub, en: "a short film by {name}", hi: "{name} की एक छोटी फ़िल्म", pos: lower-third, style: serif-sub, anim: blur-in, from: 2, to: 4.5}
transitions:
  - {between: [s1, s2], type: dissolve, dur: 0.6}
  - {between: [s2, s3], type: dip-to-black, dur: 0.6}
captions: cap-serif-cine
sfx: [{at: 0.0, cue: room-tone}, {at: 1.0, cue: bass-hit}]
whyItWorks: Animated scope bars and a serif title make phone footage read as film within the first second.
```

```yaml
id: ci-sunlit-reel
name: Sunlit Reel
pack: cinematic
pro: true
aspect: "9:16"
duration: 14
musicMood: nostalgic-acoustic 90bpm
look: {grade: warm-film, intensity: 0.7, grain: 0.32, vignette: 0.35, letterbox: "1.85", leak: {preset: amber-edge, opacity: 0.5, at: [0.0, 4.5, 9.5]}, flare: none}
slots:
  - {id: s1, kind: video, from: 0, to: 4.5, crop: full-bleed, ramp: "100>50@1.0>100@3.5"}
  - {id: s2, kind: video, from: 4.5, to: 9.5, crop: full-bleed}
  - {id: s3, kind: photo, from: 9.5, to: 14, crop: full-bleed, zoom: "1.00>1.10"}
text:
  - {id: date, en: "summer, {year}", hi: "गर्मियाँ, {year}", pos: bottom-safe, style: handwritten, anim: typewriter, from: 0.5, to: 4}
transitions:
  - {between: [s1, s2], type: dissolve, dur: 0.8}
  - {between: [s2, s3], type: dissolve, dur: 0.8}
captions: none
sfx: [{at: 0.0, cue: film-projector}]
whyItWorks: Warm grade, heavy grain and edge leaks give the look of found family footage, which drives emotional shares.
```

```yaml
id: ci-silver-stakes
name: Silver Stakes
pack: cinematic
pro: true
aspect: "9:16"
duration: 12
musicMood: percussive-drama 95bpm, hits on 4s and 8s
look: {grade: bleach-bypass, intensity: 0.75, grain: 0.25, vignette: 0.4, letterbox: "2.00", leak: none, flare: none}
slots:
  - {id: s1, kind: video, from: 0, to: 4, crop: thirds-left, ramp: "100>25@1.5>100@2.5"}
  - {id: s2, kind: video, from: 4, to: 8, crop: face-center, zoom: "1.00>1.15"}
  - {id: s3, kind: video, from: 8, to: 12, crop: full-bleed, ramp: "100>20@1.0>100@2.0"}
text:
  - {id: line, en: "No one saw the 5 AM practice.", hi: "सुबह 5 बजे की प्रैक्टिस किसी ने नहीं देखी।", pos: center, style: serif-title, anim: blur-in, from: 4.5, to: 7.8}
transitions:
  - {between: [s1, s2], type: dip-to-black, dur: 0.4}
  - {between: [s2, s3], type: dip-to-black, dur: 0.4}
captions: cap-serif-cine
sfx: [{at: 3.8, cue: tape-stop}, {at: 4.0, cue: bass-hit}, {at: 8.0, cue: bass-hit}]
whyItWorks: Desaturated contrast and speed-ramped peaks give sport and hustle footage weight, and one line of text carries the story.
```

```yaml
id: ci-neon-hours
name: Neon Hours
pack: cinematic
pro: true
aspect: "9:16"
duration: 15
musicMood: synthwave 100bpm
look: {grade: cool-night, intensity: 0.7, grain: 0.15, vignette: 0.35, letterbox: "2.39", leak: none, flare: {preset: cine-blue, intensity: 0.6}}
slots:
  - {id: s1, kind: video, from: 0, to: 5, crop: wide-fit, zoom: "1.00>1.06"}
  - {id: s2, kind: video, from: 5, to: 10, crop: wide-fit, ramp: "100>35@2.0>100@3.0"}
  - {id: s3, kind: video, from: 10, to: 15, crop: wide-fit}
text:
  - {id: city, en: "MUMBAI · 2:14 AM", hi: "मुंबई · रात 2:14", pos: top, style: serif-sub, anim: typewriter, from: 0.5, to: 4.5}
transitions:
  - {between: [s1, s2], type: dissolve, dur: 0.5}
  - {between: [s2, s3], type: zoom, dur: 0.3}
captions: cap-serif-cine
sfx: [{at: 0.0, cue: city-ambience}]
whyItWorks: Blue-cyan shadows, horizontal streak flares and scope bars turn ordinary night city clips into a mood piece.
```

```yaml
id: ci-coming-soon-cut
name: Coming Soon Cut
pack: cinematic
pro: true
aspect: "9:16"
duration: 20
musicMood: trailer-hybrid, braams on title cards
look: {grade: teal-orange, intensity: 0.65, grain: 0.2, vignette: 0.35, letterbox: "2.39", leak: none, flare: {preset: amber-streak, intensity: 0.4}}
slots:
  - {id: s1, kind: video, from: 0, to: 3, crop: wide-fit}
  - {id: s2, kind: video, from: 4, to: 7, crop: wide-fit, zoom: "1.00>1.10"}
  - {id: s3, kind: video, from: 8, to: 11, crop: face-center, zoom: "1.00>1.15"}
  - {id: s4, kind: video, from: 12, to: 16, crop: wide-fit, ramp: "100>25@1.5>100@2.5"}
  - {id: s5, kind: video, from: 17, to: 20, crop: wide-fit}
text:
  - {id: c1, en: "THIS SUMMER", hi: "इस गर्मी", pos: center, style: serif-title, anim: blur-in, from: 3, to: 4}
  - {id: c2, en: "ONE IDEA", hi: "एक आइडिया", pos: center, style: serif-title, anim: blur-in, from: 7, to: 8}
  - {id: c3, en: "CHANGES EVERYTHING", hi: "सब कुछ बदल देगा", pos: center, style: serif-title, anim: blur-in, from: 11, to: 12}
  - {id: c4, en: "{TITLE} · {date}", hi: "{TITLE} · {date}", pos: center, style: serif-title, anim: blur-in, from: 16, to: 17}
transitions:
  - {between: [s1, c1], type: dip-to-black, dur: 0.3}
  - {between: [s2, c2], type: dip-to-black, dur: 0.3}
  - {between: [s3, c3], type: dip-to-black, dur: 0.3}
  - {between: [s4, c4], type: dip-to-black, dur: 0.3}
captions: none
sfx: [{at: 3.0, cue: bass-hit}, {at: 7.0, cue: bass-hit}, {at: 11.0, cue: bass-hit}, {at: 15.0, cue: riser}, {at: 16.0, cue: bass-hit}]
whyItWorks: Trailer grammar (black title cards between beats) builds anticipation for a launch, a new series or a channel return.
```

```yaml
id: ci-ramp-and-hold
name: Ramp & Hold
pack: cinematic
pro: false
aspect: "9:16"
duration: 12
musicMood: hard-hitting-trap 140bpm (half-time feel)
look: {grade: teal-orange, intensity: 0.5, grain: 0.12, vignette: 0.25, letterbox: none, leak: none, flare: none}
slots:
  - {id: s1, kind: video, from: 0, to: 4, crop: full-bleed, ramp: "100>20@1.6>100@2.4"}
  - {id: s2, kind: video, from: 4, to: 8, crop: full-bleed, ramp: "100>20@1.6>100@2.4"}
  - {id: s3, kind: video, from: 8, to: 12, crop: full-bleed, ramp: "100>15@1.5>15@4.0"}
text:
  - {id: tag, en: "{skill} / day {n}", hi: "{skill} / din {n}", pos: top-left, style: label-pill, anim: pop, from: 0, to: 12}
transitions:
  - {between: [s1, s2], type: zoom, dur: 0.2}
  - {between: [s2, s3], type: zoom, dur: 0.2}
captions: none
sfx: [{at: 1.5, cue: whoosh}, {at: 5.5, cue: whoosh}, {at: 9.5, cue: whoosh}]
whyItWorks: Slowing down on the peak of each move shows the skill clearly, and the slow-motion end hold gives a natural loop point.
```

```yaml
id: ci-slow-push-portrait
name: Slow Push Portrait
pack: cinematic
pro: false
aspect: "9:16"
duration: 15
musicMood: minimal-strings, sparse
look: {grade: golden-hour, intensity: 0.5, grain: 0.15, vignette: 0.4, letterbox: none, leak: none, flare: none}
slots:
  - {id: s1, kind: video, from: 0, to: 15, crop: face-center, zoom: "1.00>1.15"}
text:
  - {id: q, en: "\"I almost quit in 2023.\"", hi: "\"2023 mein main lagbhag chhod chuka tha.\"", pos: upper-third, style: quote-serif, anim: blur-in, from: 0.5, to: 5}
captions: cap-serif-cine
transitions: []
whyItWorks: One continuous push-in on a face while the person speaks feels intimate and lets the monologue lead.
```

```yaml
id: ci-chapter-cards
name: Chapter Cards
pack: cinematic
pro: true
aspect: "9:16"
duration: 30
musicMood: indie-folk 95bpm
look: {grade: warm-film, intensity: 0.5, grain: 0.2, vignette: 0.3, letterbox: "1.85", leak: {preset: rose-sweep, opacity: 0.35, at: [10.0, 20.0]}, flare: none}
slots:
  - {id: s1, kind: video, from: 1.5, to: 10, crop: full-bleed}
  - {id: s2, kind: video, from: 11.5, to: 20, crop: full-bleed}
  - {id: s3, kind: video, from: 21.5, to: 30, crop: full-bleed, zoom: "1.00>1.08"}
text:
  - {id: ch1, en: "I. The Plan", hi: "I. प्लान", pos: center, style: serif-title, anim: blur-in, from: 0, to: 1.5}
  - {id: ch2, en: "II. The Mess", hi: "II. गड़बड़", pos: center, style: serif-title, anim: blur-in, from: 10, to: 11.5}
  - {id: ch3, en: "III. The Result", hi: "III. नतीजा", pos: center, style: serif-title, anim: blur-in, from: 20, to: 21.5}
transitions:
  - {between: [ch1, s1], type: dip-to-black, dur: 0.4}
  - {between: [s1, ch2], type: dip-to-black, dur: 0.4}
  - {between: [ch2, s2], type: dip-to-black, dur: 0.4}
  - {between: [s2, ch3], type: dip-to-black, dur: 0.4}
  - {between: [ch3, s3], type: dip-to-black, dur: 0.4}
captions: cap-serif-cine
whyItWorks: A three-act structure with chapter cards turns a longer vlog into a mini film, and viewers stay to see act three.
```

```yaml
id: ci-monsoon-frames
name: Monsoon Frames
pack: cinematic
pro: true
aspect: "9:16"
duration: 16
musicMood: rain-ambient + soft sitar or guitar, 75bpm
look: {grade: monsoon-green, intensity: 0.65, grain: 0.2, vignette: 0.35, letterbox: "2.00", leak: none, flare: none}
slots:
  - {id: s1, kind: video, from: 0, to: 5, crop: full-bleed, ramp: "50>50@0>50@5"}
  - {id: s2, kind: video, from: 5, to: 10, crop: full-bleed, zoom: "1.00>1.08"}
  - {id: s3, kind: video, from: 10, to: 16, crop: full-bleed}
text:
  - {id: t, en: "the first rain", hi: "पहली बारिश", pos: center, style: serif-title, anim: blur-in, from: 1, to: 4.5}
transitions:
  - {between: [s1, s2], type: dissolve, dur: 0.8}
  - {between: [s2, s3], type: dissolve, dur: 0.8}
captions: none
sfx: [{at: 0.0, cue: rain-loop}, {at: 9.5, cue: thunder-distant}]
whyItWorks: The monsoon matters across India, and slow motion with a green-teal grade and rain sound turns everyday clips into a seasonal mood piece.
```

```yaml
id: ci-wide-frame-story
name: Wide Frame Story
pack: cinematic
pro: false
aspect: "9:16"
duration: 12
musicMood: epic-ambient, wide pads
look: {grade: teal-orange, intensity: 0.45, grain: 0.12, vignette: 0.2, letterbox: none, leak: none, flare: none}
slots:
  - {id: s1, kind: video, from: 0, to: 6, crop: wide-fit, zoom: "1.00>1.05"}
  - {id: s2, kind: video, from: 6, to: 12, crop: wide-fit}
text:
  - {id: place, en: "Spiti Valley, 4,200 m", hi: "स्पीति घाटी, 4,200 मीटर", pos: upper-third, style: serif-sub, anim: typewriter, from: 0.5, to: 5.5}
transitions:
  - {between: [s1, s2], type: dissolve, dur: 0.6}
captions: none
whyItWorks: Landscape footage stays wide in the centre over a blurred fill, so panoramas keep their scale in a vertical feed.
```

### 3.3 Podcast pack (6)

```yaml
id: pc-mic-drop-clip
name: Mic Drop Clip
pack: podcast
pro: false
aspect: "9:16"
duration: 45
musicMood: none (voice), optional low bed −30 dB
look: {grade: neutral, intensity: 0.3, grain: 0.0, vignette: 0.15, letterbox: none, leak: none, flare: none}
slots:
  - {id: talk, kind: video, from: 0, to: 45, crop: face-center, zoom: "punch 1.15@12.0"}
text:
  - {id: headline, en: "Why most startups die in year 2", hi: "Zyada tar startups 2nd year mein kyun band hote hain", pos: top, style: hook-bold, anim: pop, from: 0, to: 45}
  - {id: show, en: "{Podcast name} · Ep {n}", hi: "{Podcast name} · Ep {n}", pos: top-left, style: label-pill, anim: slide-up, from: 0, to: 45}
transitions: []
captions: cap-karaoke
whyItWorks: A fixed headline tells scrollers what the clip is about, and word-timed captions carry it with the sound off.
```

```yaml
id: pc-two-chairs
name: Two Chairs
pack: podcast
pro: false
aspect: "9:16"
duration: 40
musicMood: none (voice)
layout: split-v
look: {grade: neutral, intensity: 0.3, grain: 0.0, vignette: 0.1, letterbox: none, leak: none, flare: none}
slots:
  - {id: host, kind: video, from: 0, to: 40, crop: face-center, region: top}
  - {id: guest, kind: video, from: 0, to: 40, crop: face-center, region: bottom}
text:
  - {id: q, en: "{the question}", hi: "{sawaal}", pos: center, style: label-pill, anim: pop, from: 0, to: 4}
  - {id: names, en: "{Host} × {Guest}", hi: "{Host} × {Guest}", pos: center, style: lower-third, anim: slide-up, from: 4, to: 40}
transitions: []
captions: cap-karaoke
whyItWorks: Stacking both speakers keeps reactions visible, and active-speaker highlighting shows who is talking.
```

```yaml
id: pc-waveform-card
name: Waveform Card
pack: podcast
pro: false
aspect: "1:1"
duration: 30
musicMood: none (audio-only episode)
look: {grade: neutral, intensity: 0.2, grain: 0.08, vignette: 0.2, letterbox: none, leak: none, flare: none}
slots:
  - {id: cover, kind: photo, from: 0, to: 30, crop: product-center, zoom: "1.00>1.05"}
text:
  - {id: title, en: "{Episode title}", hi: "{Episode title}", pos: top, style: serif-title, anim: blur-in, from: 0, to: 30}
  - {id: listen, en: "Full episode: link in bio", hi: "Poora episode: bio mein link", pos: bottom-safe, style: label-pill, anim: slide-up, from: 25, to: 30}
transitions: []
captions: cap-minimal
whyItWorks: Audio-only podcasters get a moving visual (live waveform plus captions) without needing a camera.
```

```yaml
id: pc-hot-take-opener
name: Hot Take Opener
pack: podcast
pro: true
aspect: "9:16"
duration: 35
musicMood: tension-pulse under first 3s, then voice only
look: {grade: clean-pop, intensity: 0.35, grain: 0.05, vignette: 0.2, letterbox: none, leak: none, flare: none}
slots:
  - {id: freeze, kind: video, from: 0, to: 3, crop: face-center, zoom: "1.00>1.10"}
  - {id: answer, kind: video, from: 3, to: 35, crop: face-center, zoom: "punch 1.20@15.0"}
text:
  - {id: take, en: "\"Your degree doesn't matter anymore.\"", hi: "\"Degree ab matter nahi karti.\"", pos: center, style: hook-bold, anim: word-by-word, from: 0, to: 3}
  - {id: agree, en: "Agree or disagree?", hi: "Agree ya disagree?", pos: upper-third, style: label-pill, anim: pop, from: 30, to: 35}
transitions:
  - {between: [freeze, answer], type: zoom, dur: 0.25}
captions: cap-bold-highlight
sfx: [{at: 0.0, cue: riser}, {at: 3.0, cue: bass-hit}]
whyItWorks: The most debatable line is pulled to the front as a hook, and the closing question draws comments.
```

```yaml
id: pc-pull-quote-moment
name: Pull Quote Moment
pack: podcast
pro: true
aspect: "9:16"
duration: 30
musicMood: soft-piano swell in last 6s
look: {grade: warm-film, intensity: 0.35, grain: 0.12, vignette: 0.25, letterbox: none, leak: none, flare: none}
slots:
  - {id: talk, kind: video, from: 0, to: 24, crop: face-center}
  - {id: hold, kind: video, from: 24, to: 30, crop: face-center, zoom: "1.00>1.06"}
text:
  - {id: quote, en: "\"Consistency beats talent when talent sleeps in.\"", hi: "\"Talent so jaaye toh consistency jeet jaati hai.\"", pos: center, style: quote-serif, anim: typewriter, from: 24.3, to: 30}
  - {id: who, en: "— {Guest name}", hi: "— {Guest name}", pos: lower-third, style: serif-sub, anim: blur-in, from: 26, to: 30}
transitions:
  - {between: [talk, hold], type: fade, dur: 0.4}
captions: cap-karaoke
whyItWorks: Ending on a freeze-frame quote card gives a screenshot-able payoff that gets shared beyond the clip.
```

```yaml
id: pc-guest-spotlight
name: Guest Spotlight
pack: podcast
pro: false
aspect: "9:16"
duration: 20
musicMood: warm-corporate 100bpm
look: {grade: clean-pop, intensity: 0.3, grain: 0.0, vignette: 0.15, letterbox: none, leak: none, flare: none}
slots:
  - {id: intro, kind: video, from: 0, to: 6, crop: face-center, zoom: "1.00>1.08"}
  - {id: best, kind: video, from: 6, to: 20, crop: face-center}
text:
  - {id: name, en: "{Guest name}", hi: "{Guest name}", pos: lower-third, style: lower-third, anim: slide-up, from: 0.5, to: 6}
  - {id: creds, en: "Founder, {company} · 2M+ users", hi: "Founder, {company} · 20 lakh+ users", pos: lower-third, style: serif-sub, anim: slide-up, from: 1.0, to: 6}
  - {id: date, en: "New episode {day}", hi: "Naya episode {day} ko", pos: top, style: label-pill, anim: pop, from: 16, to: 20}
transitions:
  - {between: [intro, best], type: cut, dur: 0}
captions: cap-karaoke
whyItWorks: Showing the guest's credentials up front earns trust, and a teaser with a release date turns viewers into listeners.
```

### 3.4 Creator basics pack (6)

```yaml
id: cb-hello-im
name: Hello, I'm
pack: creator-basics
pro: false
aspect: "9:16"
duration: 10
musicMood: friendly-pop 110bpm
look: {grade: clean-pop, intensity: 0.4, grain: 0.05, vignette: 0.1, letterbox: none, leak: none, flare: none}
slots:
  - {id: wave, kind: video, from: 0, to: 3, crop: face-center}
  - {id: b1, kind: video, from: 3, to: 5.5, crop: full-bleed}
  - {id: b2, kind: video, from: 5.5, to: 8, crop: full-bleed}
  - {id: end, kind: video, from: 8, to: 10, crop: face-center, zoom: "1.00>1.08"}
text:
  - {id: hi1, en: "Hi, I'm {Name}", hi: "Namaste, main {Name}", pos: upper-third, style: hook-bold, anim: pop, from: 0.3, to: 3}
  - {id: what, en: "I make {topic} simple", hi: "Main {topic} ko simple banata/banati hoon", pos: upper-third, style: label-pill, anim: slide-up, from: 3, to: 8}
  - {id: follow, en: "Follow for {frequency}", hi: "{frequency} ke liye follow karo", pos: upper-third, style: label-pill, anim: bounce, from: 8, to: 10}
transitions:
  - {between: [wave, b1], type: slide, dur: 0.2}
  - {between: [b1, b2], type: slide, dur: 0.2}
  - {between: [b2, end], type: zoom, dur: 0.2}
captions: cap-minimal
whyItWorks: Tells new viewers who you are, what you post and how often in 10 seconds, so it works as a pinned post.
```

```yaml
id: cb-clean-talker
name: Clean Talker
pack: creator-basics
pro: false
aspect: "9:16"
duration: 30
musicMood: light-lofi bed −28 dB
look: {grade: neutral, intensity: 0.35, grain: 0.0, vignette: 0.15, letterbox: none, leak: none, flare: none}
slots:
  - {id: a, kind: video, from: 0, to: 10, crop: face-center, zoom: "punch 1.15@4.0"}
  - {id: b, kind: video, from: 10, to: 20, crop: face-center, zoom: "punch 1.20@14.0"}
  - {id: c, kind: video, from: 20, to: 30, crop: face-center, zoom: "punch 1.15@25.0"}
text:
  - {id: hook, en: "{one-line hook}", hi: "{ek line ka hook}", pos: top, style: hook-bold, anim: pop, from: 0, to: 3}
transitions:
  - {between: [a, b], type: cut, dur: 0}
  - {between: [b, c], type: cut, dur: 0}
captions: cap-bold-highlight
whyItWorks: Silence-trimmed jump cuts with punch-ins on key phrases keep a single talking-head take moving without B-roll.
```

```yaml
id: cb-quote-card
name: Quote Card
pack: creator-basics
pro: false
aspect: "4:5"
duration: 8
musicMood: calm-piano 70bpm
look: {grade: mono-silver, intensity: 0.6, grain: 0.15, vignette: 0.35, letterbox: none, leak: none, flare: none}
slots:
  - {id: bg, kind: photo, from: 0, to: 8, crop: full-bleed, zoom: "1.00>1.08"}
text:
  - {id: q, en: "\"Start before you're ready.\"", hi: "\"Taiyaar hone ka intezaar mat karo, shuru karo.\"", pos: center, style: quote-serif, anim: typewriter, from: 0.5, to: 8}
  - {id: a, en: "— {author}", hi: "— {author}", pos: lower-third, style: serif-sub, anim: blur-in, from: 3, to: 8}
transitions: []
captions: none
whyItWorks: Very cheap to produce and easy to share, and a slow push stops it reading as a static image.
```

```yaml
id: cb-voice-over-visuals
name: Voice Over Visuals
pack: creator-basics
pro: false
aspect: "9:16"
duration: 40
musicMood: documentary-pulse 95bpm, −24 dB under VO
look: {grade: teal-orange, intensity: 0.35, grain: 0.08, vignette: 0.2, letterbox: none, leak: none, flare: none}
slots:
  - {id: v1, kind: video, from: 0, to: 5, crop: full-bleed, zoom: "1.00>1.10"}
  - {id: v2, kind: video, from: 5, to: 12, crop: full-bleed, zoom: "1.10>1.00"}
  - {id: v3, kind: video, from: 12, to: 19, crop: full-bleed, zoom: "1.00>1.10"}
  - {id: v4, kind: photo, from: 19, to: 26, crop: full-bleed, zoom: "1.00>1.12"}
  - {id: v5, kind: video, from: 26, to: 33, crop: full-bleed}
  - {id: v6, kind: video, from: 33, to: 40, crop: full-bleed, zoom: "1.00>1.08"}
text:
  - {id: hook, en: "Why India has 22 official languages", hi: "India mein 22 official bhashayein kyun hain", pos: upper-third, style: hook-bold, anim: pop, from: 0, to: 4}
  - {id: fact, en: "{key number}", hi: "{key number}", pos: center, style: number-xl, anim: bounce, from: 19, to: 23}
transitions:
  - {between: [v1, v2], type: dissolve, dur: 0.3}
  - {between: [v2, v3], type: dissolve, dur: 0.3}
  - {between: [v3, v4], type: dissolve, dur: 0.3}
  - {between: [v4, v5], type: dissolve, dur: 0.3}
  - {between: [v5, v6], type: dissolve, dur: 0.3}
captions: cap-karaoke
whyItWorks: The faceless explainer is the fastest-growing monetised format, and alternating push and pull keeps stock or B-roll from feeling static under the VO.
```

```yaml
id: cb-end-card
name: End Card
pack: creator-basics
pro: false
aspect: "9:16"
duration: 5
musicMood: sting 1s, tail
look: {grade: clean-pop, intensity: 0.3, grain: 0.0, vignette: 0.2, letterbox: none, leak: none, flare: none}
slots:
  - {id: bg, kind: video, from: 0, to: 5, crop: face-center, zoom: "1.00>1.06"}
text:
  - {id: f, en: "Follow for part 2", hi: "Part 2 ke liye follow karo", pos: center, style: hook-bold, anim: bounce, from: 0.3, to: 5}
  - {id: h, en: "@{handle}", hi: "@{handle}", pos: lower-third, style: label-pill, anim: slide-up, from: 0.8, to: 5}
transitions: []
captions: none
sfx: [{at: 0.3, cue: pop}]
whyItWorks: A reusable 5-second outro adds a consistent CTA to any edit, and "part 2" gives a concrete reason to follow.
```

```yaml
id: cb-photo-dump-beat
name: Photo Dump Beat
pack: creator-basics
pro: true
aspect: "4:5"
duration: 9
musicMood: indie-pop 124bpm (cuts on every beat)
look: {grade: warm-film, intensity: 0.4, grain: 0.18, vignette: 0.15, letterbox: none, leak: {preset: gold-flash, opacity: 0.35, at: [4.5]}, flare: none}
slots:
  - {id: p1, kind: photo, from: 0.0, to: 1.0, crop: full-bleed}
  - {id: p2, kind: photo, from: 1.0, to: 2.0, crop: full-bleed}
  - {id: p3, kind: photo, from: 2.0, to: 3.0, crop: full-bleed}
  - {id: p4, kind: photo, from: 3.0, to: 4.0, crop: full-bleed}
  - {id: p5, kind: photo, from: 4.0, to: 5.0, crop: full-bleed}
  - {id: p6, kind: photo, from: 5.0, to: 6.0, crop: full-bleed}
  - {id: p7, kind: photo, from: 6.0, to: 7.0, crop: full-bleed}
  - {id: p8, kind: photo, from: 7.0, to: 9.0, crop: full-bleed, zoom: "1.00>1.10"}
text:
  - {id: t, en: "october, mostly", hi: "october, zyada tar", pos: bottom-safe, style: handwritten, anim: typewriter, from: 0.2, to: 3}
transitions:
  - {between: [p4, p5], type: dissolve, dur: 0.2}
captions: none
whyItWorks: Beat-synced photos turn a camera roll into a Reel in seconds, and auto-snapping to the beat grid does the timing work.
```

### 3.5 Festive India pack (8)

**Respect guidelines (apply to all festive templates):** Users supply their own photos of rituals and deities; Verso ships no deity imagery. No comic stickers, glitch, shake or speed-ramp effects over religious images, idols or prayer moments; the engine should block `ramp` and `punch` on slots tagged `sacred: true`. Keep each festival's motifs to that festival and never mix symbols across faiths. Greetings ship in the festival's own language plus English and Hindi, checked by native speakers. Palettes take cues from the festival (Eid: emerald, ivory, gold; Onam: cream and kasavu gold; Durga Puja: red and white) without stereotyping.

```yaml
id: fe-rangoli-lights
name: Rangoli Lights
pack: festive-india
pro: true
aspect: "9:16"
duration: 15
musicMood: festive-instrumental, shehnai or flute over soft dhol, 92bpm
look: {grade: warm-film, intensity: 0.6, grain: 0.15, vignette: 0.3, letterbox: none, leak: {preset: gold-flash, opacity: 0.45, at: [5.0, 10.0]}, flare: {preset: amber-streak, intensity: 0.35}}
slots:
  - {id: diya, kind: video, from: 0, to: 5, crop: product-center, zoom: "1.00>1.12"}
  - {id: family, kind: video, from: 5, to: 10, crop: full-bleed}
  - {id: rangoli, kind: photo, from: 10, to: 15, crop: full-bleed, zoom: "1.00>1.08"}
text:
  - {id: g, en: "Happy Diwali", hi: "शुभ दीपावली", pos: center, style: deva-display, anim: blur-in, from: 10.5, to: 15}
  - {id: from, en: "from the {Family name} family", hi: "{Family name} परिवार की ओर से", pos: lower-third, style: serif-sub, anim: slide-up, from: 11.5, to: 15}
transitions:
  - {between: [diya, family], type: dissolve, dur: 0.6}
  - {between: [family, rangoli], type: dissolve, dur: 0.6}
captions: cap-bilingual
whyItWorks: Diwali is India's biggest creator and brand season, and warm flicker with gold leaks fits the mood of the lamps without kitsch.
```

```yaml
id: fe-colour-burst
name: Colour Burst
pack: festive-india
pro: false
aspect: "9:16"
duration: 10
musicMood: high-energy dhol fusion 128bpm
look: {grade: clean-pop, intensity: 0.65, grain: 0.05, vignette: 0.1, letterbox: none, leak: none, flare: none}
slots:
  - {id: throw, kind: video, from: 0, to: 4, crop: full-bleed, ramp: "100>25@1.2>100@2.6"}
  - {id: dance, kind: video, from: 4, to: 7, crop: full-bleed}
  - {id: faces, kind: video, from: 7, to: 10, crop: face-center, zoom: "1.00>1.10"}
text:
  - {id: g, en: "Happy Holi", hi: "होली मुबारक / Happy Holi", pos: upper-third, style: deva-display, anim: bounce, from: 7.3, to: 10}
transitions:
  - {between: [throw, dance], type: zoom, dur: 0.2}
  - {between: [dance, faces], type: cut, dur: 0}
captions: none
sfx: [{at: 1.2, cue: whoosh}]
whyItWorks: Slowing down at the moment colour is thrown shows the powder cloud, which is the most shareable moment of Holi.
```

```yaml
id: fe-chand-raat
name: Chand Raat Greetings
pack: festive-india
pro: false
aspect: "9:16"
duration: 12
musicMood: gentle-oud or soft strings, no vocals, 70bpm
look: {grade: cool-night, intensity: 0.4, grain: 0.1, vignette: 0.3, letterbox: none, leak: {preset: gold-flash, opacity: 0.3, at: [6.0]}, flare: none}
slots:
  - {id: moon, kind: video, from: 0, to: 4, crop: full-bleed, zoom: "1.00>1.08"}
  - {id: gather, kind: video, from: 4, to: 8, crop: full-bleed}
  - {id: feast, kind: photo, from: 8, to: 12, crop: product-center, zoom: "1.00>1.06"}
text:
  - {id: g, en: "Eid Mubarak", hi: "ईद मुबारक", pos: center, style: serif-title, anim: blur-in, from: 8.3, to: 12}
  - {id: wish, en: "Wishing you peace and plenty", hi: "आपको अमन और खुशियाँ मुबारक", pos: lower-third, style: serif-sub, anim: slide-up, from: 9, to: 12}
transitions:
  - {between: [moon, gather], type: dissolve, dur: 0.6}
  - {between: [gather, feast], type: dissolve, dur: 0.6}
captions: cap-bilingual
whyItWorks: The night grade fits the moon-sighting story, and the emerald-gold palette with serif type feels respectful and elegant.
```

```yaml
id: fe-pookalam-morning
name: Pookalam Morning
pack: festive-india
pro: false
aspect: "9:16"
duration: 12
musicMood: chenda or soft Carnatic-inspired instrumental, 96bpm
look: {grade: golden-hour, intensity: 0.5, grain: 0.1, vignette: 0.2, letterbox: none, leak: none, flare: none}
slots:
  - {id: flowers, kind: video, from: 0, to: 4, crop: product-center, zoom: "1.00>1.10"}
  - {id: sadya, kind: video, from: 4, to: 8, crop: full-bleed}
  - {id: family, kind: photo, from: 8, to: 12, crop: full-bleed, zoom: "1.00>1.06"}
text:
  - {id: g, en: "Happy Onam", hi: "ओणम की शुभकामनाएँ", ml: "ഓണാശംസകൾ", pos: center, style: serif-title, anim: blur-in, from: 8.3, to: 12}
transitions:
  - {between: [flowers, sadya], type: slide, dur: 0.3}
  - {between: [sadya, family], type: dissolve, dur: 0.5}
captions: cap-bilingual
whyItWorks: A Kerala festival with a Malayalam-first greeting serves South Indian creators who are underserved by Hindi-only template packs.
```

```yaml
id: fe-harvest-sun
name: Harvest Sun
pack: festive-india
pro: true
aspect: "9:16"
duration: 14
musicMood: folk-percussion, bright, 104bpm
look: {grade: golden-hour, intensity: 0.6, grain: 0.15, vignette: 0.25, letterbox: none, leak: {preset: amber-edge, opacity: 0.4, at: [0.0]}, flare: {preset: amber-streak, intensity: 0.3}}
slots:
  - {id: sun, kind: video, from: 0, to: 4, crop: full-bleed, zoom: "1.00>1.08"}
  - {id: pot, kind: video, from: 4, to: 9, crop: product-center}
  - {id: people, kind: video, from: 9, to: 14, crop: full-bleed}
text:
  - {id: g, en: "Happy Pongal · Sankranti · Lohri · Bihu", hi: "मकर संक्रांति, लोहड़ी और पोंगल की शुभकामनाएँ", ta: "இனிய பொங்கல் நல்வாழ்த்துக்கள்", pos: center, style: serif-title, anim: blur-in, from: 9.3, to: 14}
transitions:
  - {between: [sun, pot], type: dissolve, dur: 0.5}
  - {between: [pot, people], type: dissolve, dur: 0.5}
captions: cap-bilingual
whyItWorks: One harvest template with swappable greeting layers covers mid-January celebrations across Tamil Nadu, Punjab, Assam and the rest of India.
```

```yaml
id: fe-pujo-dhak
name: Pujo Dhak Beats
pack: festive-india
pro: true
aspect: "9:16"
duration: 15
musicMood: dhak-rhythm 112bpm (beat grid)
look: {grade: warm-film, intensity: 0.55, grain: 0.18, vignette: 0.3, letterbox: "1.85", leak: none, flare: none}
slots:
  - {id: pandal, kind: video, from: 0, to: 5, crop: full-bleed, zoom: "1.00>1.08"}
  - {id: dhak, kind: video, from: 5, to: 10, crop: full-bleed}
  - {id: friends, kind: video, from: 10, to: 15, crop: full-bleed}
text:
  - {id: g, en: "Shubho Sharodiya", hi: "शुभ शारदीया", bn: "শুভ শারদীয়া", pos: center, style: serif-title, anim: blur-in, from: 0.5, to: 4.5}
  - {id: loc, en: "{pandal name}, Kolkata", hi: "{pandal name}, कोलकाता", pos: lower-third, style: serif-sub, anim: typewriter, from: 5.5, to: 9.5}
transitions:
  - {between: [pandal, dhak], type: cut, dur: 0}
  - {between: [dhak, friends], type: cut, dur: 0}
captions: cap-bilingual
whyItWorks: Cuts on the dhak beat match the festival's sound, and pandal-hopping footage is the core Pujo content in Bengal.
```

```yaml
id: fe-bappa-arrival
name: Bappa Arrival
pack: festive-india
pro: false
aspect: "9:16"
duration: 12
musicMood: dhol-tasha 118bpm
look: {grade: warm-film, intensity: 0.5, grain: 0.1, vignette: 0.25, letterbox: none, leak: {preset: gold-flash, opacity: 0.3, at: [8.0]}, flare: none}
slots:
  - {id: procession, kind: video, from: 0, to: 4, crop: full-bleed}
  - {id: decor, kind: video, from: 4, to: 8, crop: full-bleed, zoom: "1.00>1.06"}
  - {id: aarti, kind: video, from: 8, to: 12, crop: full-bleed, zoom: "1.00>1.05"}
text:
  - {id: g, en: "Ganpati Bappa Morya", hi: "गणपति बप्पा मोरया", mr: "गणपती बाप्पा मोरया", pos: upper-third, style: deva-display, anim: blur-in, from: 8.3, to: 12}
transitions:
  - {between: [procession, decor], type: cut, dur: 0}
  - {between: [decor, aarti], type: dissolve, dur: 0.6}
captions: cap-bilingual
whyItWorks: Energetic procession cuts give way to a calm aarti close (tagged sacred, no ramps), matching how the festival feels in Maharashtra.
```

```yaml
id: fe-star-and-plum
name: Star & Plum Cake
pack: festive-india
pro: false
aspect: "9:16"
duration: 12
musicMood: acoustic-carol instrumental 88bpm
look: {grade: warm-film, intensity: 0.5, grain: 0.15, vignette: 0.3, letterbox: none, leak: {preset: amber-edge, opacity: 0.35, at: [4.0]}, flare: {preset: amber-streak, intensity: 0.3}}
slots:
  - {id: star, kind: video, from: 0, to: 4, crop: full-bleed, zoom: "1.00>1.08"}
  - {id: cake, kind: video, from: 4, to: 8, crop: product-center}
  - {id: gather, kind: photo, from: 8, to: 12, crop: full-bleed, zoom: "1.00>1.06"}
text:
  - {id: g, en: "Merry Christmas", hi: "क्रिसमस की शुभकामनाएँ", pos: center, style: serif-title, anim: blur-in, from: 8.3, to: 12}
transitions:
  - {between: [star, cake], type: dissolve, dur: 0.5}
  - {between: [cake, gather], type: dissolve, dur: 0.5}
captions: cap-bilingual
whyItWorks: Paper stars and plum cake reflect how Christmas looks in Goa, Kerala and the Northeast, so it reads Indian rather than generic snow.
```

### 3.6 Business / promo pack (7)

```yaml
id: bz-shelf-to-spotlight
name: Shelf to Spotlight
pack: business
pro: false
aspect: "9:16"
duration: 12
musicMood: sleek-electronic 115bpm
look: {grade: clean-pop, intensity: 0.45, grain: 0.0, vignette: 0.25, letterbox: none, leak: none, flare: none}
slots:
  - {id: tease, kind: video, from: 0, to: 3, crop: product-center, ramp: "100>30@1.5>100@2.5"}
  - {id: hero, kind: video, from: 3, to: 8, crop: product-center, zoom: "1.00>1.15"}
  - {id: use, kind: video, from: 8, to: 12, crop: full-bleed}
text:
  - {id: h, en: "Made by hand in Jaipur", hi: "Jaipur mein haath se bana", pos: upper-third, style: hook-bold, anim: pop, from: 0, to: 3}
  - {id: price, en: "₹{price}", hi: "₹{price}", pos: center, style: price-tag, anim: bounce, from: 6, to: 8}
  - {id: cta, en: "Order on WhatsApp", hi: "WhatsApp pe order karo", pos: upper-third, style: label-pill, anim: slide-up, from: 9, to: 12}
transitions:
  - {between: [tease, hero], type: zoom, dur: 0.25}
  - {between: [hero, use], type: slide, dur: 0.2}
captions: cap-minimal
whyItWorks: Tease, hero shot and in-use shot is a complete product story in 12 s, and a WhatsApp CTA matches how Indian small businesses sell.
```

```yaml
id: bz-offer-countdown
name: Offer Countdown
pack: business
pro: false
aspect: "9:16"
duration: 10
musicMood: urgent-pop 128bpm
look: {grade: clean-pop, intensity: 0.5, grain: 0.0, vignette: 0.15, letterbox: none, leak: none, flare: none}
slots:
  - {id: p1, kind: photo, from: 0, to: 3.5, crop: product-center, zoom: "1.00>1.06"}
  - {id: p2, kind: photo, from: 3.5, to: 7, crop: product-center, zoom: "1.00>1.06"}
  - {id: store, kind: video, from: 7, to: 10, crop: full-bleed}
text:
  - {id: off, en: "FLAT 30% OFF", hi: "FLAT 30% OFF", pos: upper-third, style: number-xl, anim: bounce, from: 0, to: 7}
  - {id: was, en: "~~₹1,999~~ ₹1,399", hi: "~~₹1,999~~ ₹1,399", pos: center, style: price-tag, anim: pop, from: 1, to: 7}
  - {id: ends, en: "Ends Sunday", hi: "Sunday tak hi", pos: upper-third, style: label-pill, anim: slide-up, from: 7, to: 10}
transitions:
  - {between: [p1, p2], type: slide, dur: 0.2}
  - {between: [p2, store], type: zoom, dur: 0.25}
captions: none
whyItWorks: A strike-through price and a clear deadline give urgency, and product photos are enough, so no video shoot is needed.
```

```yaml
id: bz-customer-says
name: Customer Says
pack: business
pro: false
aspect: "9:16"
duration: 20
musicMood: warm-acoustic bed −26 dB
look: {grade: warm-film, intensity: 0.3, grain: 0.06, vignette: 0.15, letterbox: none, leak: none, flare: none}
slots:
  - {id: face, kind: video, from: 0, to: 14, crop: face-center, zoom: "punch 1.15@6.0"}
  - {id: product, kind: video, from: 14, to: 20, crop: product-center}
text:
  - {id: stars, en: "★★★★★ {Customer}, {City}", hi: "★★★★★ {Customer}, {City}", pos: top, style: label-pill, anim: pop, from: 0, to: 14}
  - {id: shop, en: "{Shop name} · link in bio", hi: "{Shop name} · bio mein link", pos: upper-third, style: label-pill, anim: slide-up, from: 14, to: 20}
transitions:
  - {between: [face, product], type: dissolve, dur: 0.4}
captions: cap-boxed
whyItWorks: A real customer on camera in UGC style converts better than a polished ad, and the city tag adds local trust.
```

```yaml
id: bz-behind-the-counter
name: Behind the Counter
pack: business
pro: false
aspect: "9:16"
duration: 18
musicMood: cosy-lofi 88bpm
look: {grade: warm-film, intensity: 0.4, grain: 0.12, vignette: 0.2, letterbox: none, leak: none, flare: none}
slots:
  - {id: open, kind: video, from: 0, to: 3, crop: full-bleed}
  - {id: make1, kind: video, from: 3, to: 8, crop: product-center, ramp: "200>200@0>100@4"}
  - {id: make2, kind: video, from: 8, to: 13, crop: product-center}
  - {id: pack, kind: video, from: 13, to: 18, crop: product-center, zoom: "1.00>1.10"}
text:
  - {id: h, en: "How we pack 200 orders a day", hi: "Roz 200 orders kaise pack karte hain", pos: upper-third, style: hook-bold, anim: pop, from: 0, to: 3}
  - {id: step, en: "{step}", hi: "{step}", pos: top-left, style: label-pill, anim: typewriter, from: 3, to: 18}
transitions:
  - {between: [open, make1], type: cut, dur: 0}
  - {between: [make1, make2], type: cut, dur: 0}
  - {between: [make2, pack], type: cut, dur: 0}
captions: cap-minimal
whyItWorks: Showing the real process builds trust in a small brand, and sped-up process shots are satisfying to watch.
```

```yaml
id: bz-menu-walk
name: Menu Walk
pack: business
pro: true
aspect: "9:16"
duration: 16
musicMood: jazzy-hop 92bpm
look: {grade: golden-hour, intensity: 0.45, grain: 0.08, vignette: 0.25, letterbox: none, leak: none, flare: none}
slots:
  - {id: d1, kind: video, from: 0, to: 4, crop: product-center, zoom: "1.00>1.10"}
  - {id: d2, kind: video, from: 4, to: 8, crop: product-center, zoom: "1.00>1.10"}
  - {id: d3, kind: video, from: 8, to: 12, crop: product-center, zoom: "1.00>1.10"}
  - {id: front, kind: video, from: 12, to: 16, crop: full-bleed}
text:
  - {id: dish, en: "{Dish} · ₹{price}", hi: "{Dish} · ₹{price}", pos: lower-third, style: price-tag, anim: slide-up, from: 0, to: 12}
  - {id: addr, en: "{Café name} · {Area}, open till 11", hi: "{Café name} · {Area}, raat 11 baje tak", pos: upper-third, style: label-pill, anim: pop, from: 12, to: 16}
transitions:
  - {between: [d1, d2], type: slide, dur: 0.2}
  - {between: [d2, d3], type: slide, dur: 0.2}
  - {between: [d3, front], type: zoom, dur: 0.25}
captions: none
whyItWorks: Close-up food with a price on screen answers the viewer's first question, and the storefront close tells them where to go.
```

```yaml
id: bz-find-us
name: Find Us
pack: business
pro: false
aspect: "9:16"
duration: 10
musicMood: friendly-ukulele 105bpm
look: {grade: clean-pop, intensity: 0.35, grain: 0.0, vignette: 0.1, letterbox: none, leak: none, flare: none}
slots:
  - {id: street, kind: video, from: 0, to: 3.5, crop: full-bleed}
  - {id: inside, kind: video, from: 3.5, to: 7, crop: full-bleed, zoom: "1.00>1.06"}
  - {id: owner, kind: video, from: 7, to: 10, crop: face-center}
text:
  - {id: lm, en: "Next to {landmark}", hi: "{landmark} ke bagal mein", pos: upper-third, style: label-pill, anim: pop, from: 0, to: 3.5}
  - {id: hrs, en: "Open 10 AM – 9 PM · Closed Tue", hi: "Subah 10 se raat 9 · Mangal band", pos: upper-third, style: label-pill, anim: slide-up, from: 3.5, to: 7}
  - {id: cta, en: "Call / WhatsApp {number}", hi: "Call / WhatsApp {number}", pos: upper-third, style: label-pill, anim: bounce, from: 7, to: 10}
transitions:
  - {between: [street, inside], type: slide, dur: 0.2}
  - {between: [inside, owner], type: cut, dur: 0}
captions: none
whyItWorks: Landmark-based directions are how Indians navigate locally, and hours plus a WhatsApp number remove every barrier to a visit.
```

```yaml
id: bz-launch-day-drop
name: Launch Day Drop
pack: business
pro: true
aspect: "9:16"
duration: 15
musicMood: cinematic-build into drop at 9s, 120bpm
look: {grade: teal-orange, intensity: 0.5, grain: 0.1, vignette: 0.35, letterbox: "2.39", leak: none, flare: {preset: cine-blue, intensity: 0.4}}
slots:
  - {id: dark, kind: video, from: 0, to: 4, crop: product-center, zoom: "1.00>1.10"}
  - {id: detail, kind: video, from: 4, to: 9, crop: product-center, ramp: "100>30@2.0>100@3.5"}
  - {id: reveal, kind: video, from: 9, to: 15, crop: product-center, zoom: "1.00>1.08"}
text:
  - {id: t1, en: "Something new is coming", hi: "Kuch naya aa raha hai", pos: center, style: serif-title, anim: blur-in, from: 0.5, to: 4}
  - {id: name, en: "{PRODUCT NAME}", hi: "{PRODUCT NAME}", pos: center, style: serif-title, anim: blur-in, from: 9.2, to: 12.5}
  - {id: date, en: "Live {date} · {site}", hi: "{date} se live · {site}", pos: lower-third, style: label-pill, anim: slide-up, from: 12.5, to: 15}
transitions:
  - {between: [dark, detail], type: dip-to-black, dur: 0.4}
  - {between: [detail, reveal], type: zoom, dur: 0.25}
captions: none
sfx: [{at: 7.5, cue: riser}, {at: 9.0, cue: bass-hit}]
whyItWorks: Using cinematic grammar for a small brand's launch makes it feel like an event, and the scope bars set it apart from the usual promo look.
```

---

## 4. Template counts

| Pack | Templates | Pro |
|---|---|---|
| Trending | 13 | 4 |
| Cinematic | 10 | 6 |
| Podcast | 6 | 2 |
| Creator basics | 6 | 1 |
| Festive India | 8 | 3 |
| Business / promo | 7 | 2 |
| **Total** | **50** | **18 (36%)** |

---

## 5. Engine checklist

Verify each item against the template set before shipping.

**Timeline and slots**
- [ ] Slot model: `video` and `photo` slots with `from`/`to`; photos render as stills with Ken Burns
- [ ] Gaps between slots render title-card-only segments on black (`ci-coming-soon-cut`, `ci-chapter-cards`)
- [ ] Auto-trim user clips to slot length; pick the best segment (face present, motion peak) when a clip is longer than its slot
- [ ] Crop hints: `face-center` (face detection), `product-center` (saliency), `thirds-left/right`, `top-half`/`bottom-half`, `wide-fit` (letterboxed over a blurred, darkened fill)
- [ ] Layouts: `full`, `split-v`, `split-h`, `triptych-v` (staggered start), `pip`
- [ ] Zoom: keyframed scale `a>b` with ease-in-out; `punch s@t` (instant scale jump at an absolute time)
- [ ] Speed ramps: multi-point speed curve parsed from `"100>30@t1>100@t2"`; optical-flow or frame-blend interpolation; constant speeds above 100% (200% timelapse)
- [ ] Freeze-frame hold with animated grain kept running
- [ ] `sacred: true` slot flag blocks ramp, punch, shake and sticker overlays

**Look**
- [ ] Grade presets as LUT or parametric: `neutral`, `clean-pop`, `teal-orange`, `warm-film`, `bleach-bypass`, `cool-night`, `golden-hour`, `monsoon-green`, `mono-silver`, `pastel-fade`, plus an `intensity` blend
- [ ] Animated film grain (size and strength), luma-weighted
- [ ] Vignette (strength, feather)
- [ ] Letterbox mattes `2.39`/`2.00`/`1.85` that work in vertical frames, with an animate-in option
- [ ] Light-leak overlays (`amber-edge`, `rose-sweep`, `gold-flash`) in screen blend, placed at given times
- [ ] Anamorphic flare (`cine-blue`, `amber-streak`) that tracks the brightest point or is keyframed

**Text**
- [ ] Style presets: `hook-bold`, `kinetic-caps`, `serif-title`, `serif-sub`, `quote-serif`, `number-xl`, `label-pill`, `sticker`, `lower-third`, `handwritten`, `price-tag`, `deva-display`
- [ ] Animations: `pop`, `typewriter`, `slide-up`, `blur-in`, `bounce`, `word-by-word` (beat-synced when a beat grid exists)
- [ ] Placeholder tokens `{name}`, `{n}` (auto-increments per slot), `{price}` and similar, with inline editing
- [ ] Strike-through markup (`~~₹1,999~~`) in `price-tag`
- [ ] Language toggle EN / HI and optional regional keys `ta`, `ml`, `bn`, `mr`; correct Indic shaping (HarfBuzz) and bundled fonts for Devanagari, Tamil, Malayalam and Bengali scripts
- [ ] Safe-zone guides for 9:16 (bottom 20%, right 12%); auto-nudge text out of UI zones

**Transitions**
- [ ] `cut`, `fade`, `dissolve`, `slide`, `zoom`, `dip-to-black` with duration; transitions between a slot and a text-only card

**Audio**
- [ ] `musicMood` tag search in a licensed library; no bundled trending audio
- [ ] Beat detection producing a beat grid; snap cuts and word-by-word text to beats (`tr-beat-typist`, `cb-photo-dump-beat`, `fe-pujo-dhak`)
- [ ] Music ducking under speech (−24 to −30 dB beds)
- [ ] SFX library cues: `bass-hit`, `riser`, `whoosh`, `tape-stop`, `pop`, `ding`, `buzzer-soft`, `room-tone`, `film-projector`, `city-ambience`, `rain-loop`, `thunder-distant`
- [ ] Silence removal / jump-cut tool (`cb-clean-talker`)
- [ ] Live audio waveform visual for audio-only input (`pc-waveform-card`)

**Captions**
- [ ] Word-level ASR for English, Hindi and Hinglish (code-mixed); regional languages as a stretch goal
- [ ] Caption styles: `cap-bold-highlight`, `cap-karaoke` (active-word fill), `cap-minimal`, `cap-boxed`, `cap-serif-cine`, `cap-bilingual` (two lines: original plus translation)
- [ ] Active-speaker detection for split layouts (`pc-two-chairs`)

**Export**
- [ ] Aspect outputs 9:16, 4:5, 1:1 and 16:9; 1080×1920 at 30/60 fps; H.264 high profile, ~12–16 Mbps, so grain survives platform re-encoding
- [ ] Pro gating per template (`pro: true`) and a watermark-free export entitlement
