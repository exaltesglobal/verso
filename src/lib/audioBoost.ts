// Preview loudness above 100%. A media element's `volume` stops at 1, so a
// clip set to "Louder" (150%) routes its element through a Web Audio GainNode.
// Export applies the same gain with FFmpeg's `volume` filter (export/mod.rs).

let ctx: AudioContext | null = null;
const gains = new WeakMap<HTMLMediaElement, GainNode>();

/** Sets the element's loudness; `gain` may go above 1 (capped at 4). */
export function setElementGain(el: HTMLMediaElement, gain: number, playing = false) {
  const g = Math.max(0, Math.min(4, gain));
  let node = gains.get(el);
  if (!node && g <= 1) {
    el.volume = g;
    return;
  }
  try {
    if (!node) {
      ctx ??= new AudioContext();
      // An element can only be wrapped once; from now on it always plays through the graph.
      node = ctx.createGain();
      ctx.createMediaElementSource(el).connect(node).connect(ctx.destination);
      gains.set(el, node);
    }
    el.volume = 1;
    node.gain.value = g;
    if (playing && ctx?.state === "suspended") void ctx.resume();
  } catch {
    // No Web Audio (or the element was already wrapped elsewhere): play at 100%.
    el.volume = Math.min(1, g);
  }
}
