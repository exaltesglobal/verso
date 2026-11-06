// Offline caption + hashtag writer. No network, no model: keyword extraction (TF-IDF
// against a small built-in list of everyday words), extractive summary, templates in
// English, Hindi and Hinglish, and niche tag sets. A local LLM can replace it later
// through setCaptionWriter() without touching the UI.

export type WriterLanguage = "en" | "hi" | "hinglish";

export interface CaptionInput {
  transcript: string;
  /** Moment or project title. */
  title?: string;
  /** Force a language; detected from the transcript otherwise. */
  language?: WriterLanguage;
}

export interface CaptionOption {
  hook: string;
  summary: string;
  cta: string;
  /** hook + summary + cta, ready to paste. */
  text: string;
}

export interface CaptionDraft {
  language: WriterLanguage;
  options: CaptionOption[];
  hashtags: string[];
  keywords: string[];
  niches: string[];
}

export interface CaptionWriter {
  write(input: CaptionInput): Promise<CaptionDraft>;
}

// ---------- language ----------

const HINGLISH = new Set(
  "hai hain kya nahi nahin aur mein main toh yaar bhai ki ka ke ko se par bhi ho kar karo karna raha rahi rahe tha thi the apna apni apne mera meri mere tera teri tum aap hum bahut accha acha sab kuch kaise kyun kab jab wala wali log matlab bas abhi phir chalo dekho samjho aaj baat baare karenge karte karta sochte sakte sakta log thoda mahine lekin agar jaise liye saath wahi yahi isko usko unko".split(
    " ",
  ),
);

export function detectLanguage(text: string): WriterLanguage {
  const deva = (text.match(/[ऀ-ॿ]/g) ?? []).length;
  const latin = (text.match(/[a-zA-Z]/g) ?? []).length;
  if (deva > latin) return "hi";
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const hits = words.filter((w) => HINGLISH.has(w)).length;
  return words.length && hits / words.length > 0.08 ? "hinglish" : "en";
}

// ---------- keywords ----------

/** Everyday words (English, Hinglish, Hindi) that say little about the topic: low IDF. */
const COMMON = new Set(
  (
    "the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were been has had did said very really thing things going gonna got let lets yeah okay ok actually basically right here where why much more many every each something anything everything nothing always never maybe should need still same own sure too done does doing being am those such through again off down while last long great little world life man woman guys guy video today hello hi hey thank thanks please welcome stuff kind lot lots"
      + " " + [...HINGLISH].join(" ") +
      " है हैं का की के को में से और तो भी ही यह वह था थी थे हो कर कि पर नहीं क्या एक जो लिए आप हम मैं तुम बहुत अब सब कुछ करेंगे करना करते बात बारे ज़रूरी सबसे आज इस उस"
  ).split(/\s+/),
);

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{M}][\p{L}\p{M}\p{N}']*/gu) ?? []).map((w) => w.replace(/'s$|'/g, ""));
}

/** Top keywords: frequency in this transcript weighted up for words that aren't everyday words. */
export function keywords(text: string, n = 12): string[] {
  const counts = new Map<string, number>();
  for (const w of tokens(text)) {
    if (w.length < 3 || COMMON.has(w) || /^\d+$/.test(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  return [...counts.entries()]
    .map(([w, c]) => [w, (c / total) * Math.log(1 + 4 + Math.min(w.length, 12) / 3)] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

// ---------- niches ----------

const NICHES: Record<string, { words: string[]; tags: string[] }> = {
  podcast: {
    words: ["podcast", "episode", "guest", "interview", "conversation", "host"],
    tags: ["#podcast", "#podcastclips", "#podcastindia", "#conversation", "#interview"],
  },
  fitness: {
    words: ["gym", "workout", "fitness", "protein", "muscle", "weight", "diet", "exercise", "cardio", "yoga", "fat"],
    tags: ["#fitness", "#workout", "#gymmotivation", "#fitindia", "#healthylifestyle"],
  },
  food: {
    words: ["recipe", "food", "cook", "cooking", "taste", "chef", "eat", "kitchen", "masala", "khana", "spicy", "chai", "खाना", "रेसिपी", "मिठाई"],
    tags: ["#food", "#recipe", "#foodie", "#indianfood", "#homecooking"],
  },
  finance: {
    words: ["money", "invest", "investing", "stock", "stocks", "market", "finance", "savings", "mutual", "fund", "tax", "loan", "sip", "crypto", "paisa", "पैसा", "निवेश"],
    tags: ["#finance", "#investing", "#personalfinance", "#moneytips", "#stockmarketindia"],
  },
  tech: {
    words: ["tech", "phone", "app", "software", "code", "coding", "laptop", "gadget", "android", "iphone", "startup", "computer"],
    tags: ["#tech", "#technology", "#gadgets", "#techtips", "#startup"],
  },
  travel: {
    words: ["travel", "trip", "flight", "hotel", "beach", "mountain", "visit", "explore", "journey", "goa", "manali", "himalaya"],
    tags: ["#travel", "#travelgram", "#incredibleindia", "#wanderlust", "#travelreels"],
  },
  festive: {
    words: ["diwali", "holi", "eid", "navratri", "durga", "ganesh", "ganpati", "christmas", "rakhi", "pongal", "onam", "festival", "puja", "दिवाली", "होली", "ईद", "नवरात्रि", "गणेश", "त्योहार", "पूजा"],
    tags: ["#festival", "#festivevibes", "#indianfestival", "#celebration", "#happydiwali"],
  },
  business: {
    words: ["business", "customer", "sales", "marketing", "brand", "founder", "entrepreneur", "growth", "client"],
    tags: ["#business", "#entrepreneur", "#marketing", "#smallbusiness", "#growth"],
  },
  education: {
    words: ["learn", "study", "exam", "student", "school", "college", "teacher", "lesson", "tips", "upsc"],
    tags: ["#education", "#learning", "#studytips", "#students", "#knowledge"],
  },
};

const GENERAL_TAGS = ["#reels", "#reelsindia", "#explore", "#viral", "#trending", "#shorts", "#instagood", "#foryou"];

export function detectNiches(text: string): string[] {
  const words = new Set(tokens(text));
  return Object.entries(NICHES)
    .map(([name, n]) => [name, n.words.filter((w) => words.has(w)).length] as const)
    .filter(([, hits]) => hits > 0)
    .sort((a, b) => b[1] - a[1])
    // A second niche needs real evidence; one stray word ("growth") is not enough.
    .filter(([, hits], i) => i === 0 || hits >= 2)
    .slice(0, 2)
    .map(([name]) => name);
}

/** 8 to 15 hashtags: topic keywords first, then niche sets, then general reach tags. */
export function hashtags(text: string, kw = keywords(text), niches = detectNiches(text)): string[] {
  const out: string[] = [];
  const add = (t: string) => {
    const tag = t.startsWith("#") ? t : `#${t}`;
    if (/^#[\p{L}\p{M}\p{N}_]{2,30}$/u.test(tag) && !out.includes(tag.toLowerCase())) out.push(tag.toLowerCase());
  };
  kw.slice(0, 6).forEach(add);
  niches.forEach((n) => NICHES[n].tags.forEach(add));
  for (const t of GENERAL_TAGS) if (out.length < 8) add(t);
  return out.slice(0, 15);
}

// ---------- captions ----------

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?।])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(" ").length >= 4);
}

/** The 1-2 sentences that carry the most keywords, in their original order, trimmed. */
function summaryOf(text: string, kw: string[], skip = 0): string {
  const set = new Set(kw);
  const ranked = sentences(text)
    .map((s, i) => ({ s, i, score: tokens(s).filter((w) => set.has(w)).length / Math.sqrt(tokens(s).length || 1) }))
    .sort((a, b) => b.score - a.score)
    .slice(skip, skip + 2)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s);
  let out = ranked.join(" ");
  if (out.length > 220) out = `${out.slice(0, 217).replace(/\s+\S*$/, "")}…`;
  return out;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const HOOKS: Record<WriterLanguage, ((topic: string) => string)[]> = {
  en: [
    (t) => `Nobody talks about this side of ${t}.`,
    (t) => `Watch this before you think about ${t} again.`,
    (t) => `The ${t} lesson I wish I'd heard sooner.`,
  ],
  hinglish: [
    (t) => `${cap(t)} ke baare mein ye koi nahi batata.`,
    (t) => `${cap(t)} samajhna hai? Ye dekho.`,
    (t) => `Kaash ${t} ki ye baat pehle pata hoti.`,
  ],
  hi: [
    (t) => `${t} के बारे में ये बात कोई नहीं बताता।`,
    (t) => `${t} समझना है? ये ज़रूर देखिए।`,
    (t) => `काश ${t} की ये बात पहले पता होती।`,
  ],
};

const CTAS: Record<WriterLanguage, string[]> = {
  en: ["Save this for later and share it with someone who needs it.", "Follow for more like this.", "Tell me in the comments: agree or not?"],
  hinglish: ["Save karo aur us dost ko bhejo jise ye chahiye.", "Aise aur videos ke liye follow karo.", "Comments mein batao, aap kya sochte ho?"],
  hi: ["इसे सेव करें और उन्हें भेजें जिन्हें इसकी ज़रूरत है।", "ऐसे और वीडियो के लिए फ़ॉलो करें।", "कमेंट में बताइए, आपकी क्या राय है?"],
};

/** The default, fully offline writer. */
export const heuristicWriter: CaptionWriter = {
  async write({ transcript, title, language }) {
    const text = `${title ?? ""}. ${transcript}`.trim();
    const lang = language ?? detectLanguage(transcript || title || "");
    const kw = keywords(text);
    const niches = detectNiches(text);
    const pair = kw.length > 1 && text.toLowerCase().includes(`${kw[0]} ${kw[1]}`) ? `${kw[0]} ${kw[1]}` : kw[0];
    const topic = (title?.trim() && title.trim().split(/\s+/).length <= 5 ? title.trim() : pair) || (lang === "hi" ? "इस" : "this");
    const options = HOOKS[lang].map((hook, i) => {
      const h = hook(lang === "en" ? topic.toLowerCase() : topic);
      const summary = summaryOf(transcript, kw, i % 2) || (title ?? "");
      const cta = CTAS[lang][i];
      return { hook: h, summary, cta, text: [h, summary, cta].filter(Boolean).join("\n\n") };
    });
    return { language: lang, options, hashtags: hashtags(text, kw, niches), keywords: kw, niches };
  },
};

let current: CaptionWriter = heuristicWriter;

/** Swap in another writer (for example a local LLM). Pass nothing to go back to the offline one. */
export function setCaptionWriter(w?: CaptionWriter) {
  current = w ?? heuristicWriter;
}

export function writeCaptions(input: CaptionInput): Promise<CaptionDraft> {
  return current.write(input);
}
