/** Thin ticks on the timeline at each beat (timeline seconds). Decorative. */
export function BeatMarkers({ beats, pps, offset = 0 }: { beats: number[]; pps: number; offset?: number }) {
  if (!beats.length) return null;
  return (
    <div className="beat-markers" aria-hidden="true">
      {beats.map((b) => (
        <span key={b} className="beat-marker" style={{ left: offset + b * pps }} />
      ))}
    </div>
  );
}
