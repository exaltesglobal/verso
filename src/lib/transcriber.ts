// Adapter: the on-device captions engine as a simple "file in, words out"
// function for Auto-cut. Downloads the chosen speech model first if needed.
import type { TranscriptWord } from "./autoclips";
import {
  ACCURACY,
  CAPTION_LANGUAGES,
  downloadModel,
  listModels,
  onModelProgress,
  transcribe,
  type CaptionLanguage,
} from "./captions";
import type { MediaInfo } from "./media";
import { getSettings } from "./settings";

/** The Settings default; older saved values the engine rejects fall back to auto. */
function settingsLanguage(): CaptionLanguage {
  const saved = getSettings().captionLanguage;
  return CAPTION_LANGUAGES.find((l) => l.id === saved)?.id ?? "auto";
}

export async function transcribeFile(
  media: MediaInfo,
  onProgress: (percent: number, stage: string) => void,
  language: CaptionLanguage = settingsLanguage(),
  accuracy: "fast" | "balanced" | "best" = "balanced",
): Promise<TranscriptWord[]> {
  const modelId = ACCURACY.find((a) => a.id === accuracy)?.modelId ?? ACCURACY[0].modelId;
  const models = await listModels();
  if (!models.find((m) => m.id === modelId)?.present) {
    onProgress(0, "Getting the speech engine ready (one time)…");
    const stop = await onModelProgress((p) => {
      if (p.id === modelId)
        onProgress(
          Math.round((p.total ? p.downloaded / p.total : 0) * 30),
          "Getting the speech engine ready (one time)…",
        );
    });
    try {
      await downloadModel(modelId);
    } finally {
      stop();
    }
  }

  return new Promise<TranscriptWord[]>((resolve, reject) => {
    let stop: (() => void) | undefined;
    transcribe(
      { path: media.path, inPoint: 0, outPoint: media.durationSec, language, modelId },
      {
        onProgress: (p) => onProgress(30 + Math.round(p.percent * 0.68), "Listening to your video…"),
        onDone: (segments) => {
          stop?.();
          resolve(
            segments.flatMap((s) => s.words.map((w) => ({ text: w.text, start: w.start, end: w.end }))),
          );
        },
        onError: (message) => {
          stop?.();
          reject(new Error(message));
        },
      },
    )
      .then((h) => {
        stop = h.stop;
      })
      .catch(reject);
  });
}
