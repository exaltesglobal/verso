/** Timeline frame grid: edits land on whole frames at 30 fps (also whole frames at 60). */
export const FPS = 30;

/**
 * `HH:MM:SS:FF`, split in two so the leading zero groups can be dimmed:
 * `["00:00:", "12:15"]`. Seconds and frames always stay in the bright part.
 */
export function timecodeParts(t: number, fps = FPS): [string, string] {
  const total = Math.max(0, Math.round(t * fps));
  const s = Math.floor(total / fps);
  const parts = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60, total % fps].map((n) =>
    String(n).padStart(2, "0"),
  );
  let lead = 0;
  while (lead < 2 && parts[lead] === "00") lead++;
  const full = parts.join(":");
  return [full.slice(0, lead * 3), full.slice(lead * 3)];
}

export const formatTimecode = (t: number, fps = FPS) => timecodeParts(t, fps).join("");

/** Plain seconds for the "Show time as: Seconds" setting: `0:12.5`, `1:02:03.0`. */
export function formatSeconds(t: number): string {
  const tenths = Math.max(0, Math.round(t * 10));
  const h = Math.floor(tenths / 36000);
  const m = Math.floor(tenths / 600) % 60;
  const s = ((tenths % 600) / 10).toFixed(1).padStart(4, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/**
 * Reads what someone types into the timecode field. Absolute: `83` or `83s`
 * (seconds), `1:23` (m:s), `1:23:10` (m:s:frames), `00:01:23:10`, `45f`.
 * Relative to `current`: `+2s`, `-10f`, `+1.5`. Returns null when unreadable.
 */
export function parseTime(input: string, current: number, fps = FPS): number | null {
  const raw = input.trim().toLowerCase().replace(/;/g, ":");
  const m = /^([+-]?)(.*)$/.exec(raw);
  if (!m || !m[2]) return null;
  const [, sign, body] = m;
  let secs: number;
  if (/^\d+(\.\d+)?f$/.test(body)) secs = parseFloat(body) / fps;
  else if (/^\d+(\.\d+)?s?$/.test(body)) secs = parseFloat(body);
  else if (/^\d+(:\d+){1,3}$/.test(body)) {
    const g = body.split(":").map(Number);
    const [h, mi, s, f] = g.length === 4 ? g : g.length === 3 ? [0, ...g] : [0, g[0], g[1], 0];
    secs = h * 3600 + mi * 60 + s + f / fps;
  } else return null;
  const t = sign === "+" ? current + secs : sign === "-" ? current - secs : secs;
  return Math.max(0, Math.round(t * fps) / fps);
}
