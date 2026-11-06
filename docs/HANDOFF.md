# Hand off to a pro editor

Export dialog → **Hand off to a pro editor**. Verso writes project files into a folder you pick, so an editor can keep working in Premiere Pro, DaVinci Resolve or Final Cut Pro without redoing the cut.

| Choice                  | Files written                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Open in Premiere Pro    | `<name>.xml` (FCP7 XML / xmeml v5, Premiere's native XML import), `<name>.fcpxml`, `<name> captions.srt`, `<name> - read me.txt` |
| Open in DaVinci Resolve | `<name>.fcpxml` (FCPXML 1.11; Final Cut Pro opens it too), `<name> captions.srt`, `<name> - read me.txt`                         |
| Just the video (MP4)    | Switches to the normal video export.                                                                                             |

Code: `src/lib/handoff.ts` (pure writers), `src/components/editor/HandoffPanel.tsx` (UI). Files are written with the existing `save_project_as` command (non-JSON text is written as is). Check: `pnpm test:handoff`.

## What transfers

- **Cuts:** every video, sound and music clip at its timeline position with its source in/out, frame-accurate at the source's frame rate (from `probe_media`; 23.976/29.97/59.94 are written as NTSC rates). Sequence size follows the reel's shape (1080×1920, 1080×1080 or 1920×1080).
- **Speed:** constant clip speed. FCPXML uses a `timeMap`; xmeml uses the Time Remap effect with matching source in/out. Linked sound keeps its video's speed.
- **Framing:** zoom and position, and smart reframe moves as position/scale keyframes (FCPXML `adjust-transform`, xmeml Basic Motion). Scale is relative to the source's native pixels (`adjust-conform type="none"` in FCPXML).
- **Fades to black:** clip opacity (FCPXML `adjust-blend`, xmeml Opacity).
- **Levels:** sound and music volume (dB in FCPXML, Audio Levels in xmeml). Cleaned ("enhanced") sound points at the cleaned copy.
- **AI voice / dubbing:** already baked into audio files on the sound or music track, so they transfer as ordinary audio.
- **Text:** FCPXML only, as Basic Title (text, colour, size, vertical position). Premiere's XML import drops titles, so for Premiere the read-me file lists every text line with its times to retype.
- **Captions:** `.srt` sidecar with the caption track's text and timings.

## What does not transfer

- Looks, colour adjustments, LUTs, grain, light leaks, letterbox, dip to black.
- Transitions (straight cuts), speed ramps (one steady speed per clip), punch-in zooms and template push-ins.
- Text and caption styling and animations, stickers.
- Photos (stills) and background removal (the original video is used).
- Split-screen reframe layouts: only the first panel's framing is used.

The read-me file written next to the project lists which of these the reel actually uses.

## Known limits

- Neither Premiere Pro nor Resolve was available when this was built: the files were checked by the self-check (well-formed XML parsed back, frame maths, escaping, FCPXML structure), not by importing them.
- xmeml Basic Motion **Center** is written as a fraction of the sequence frame (0,0 = middle). If Premiere places reframed clips off-centre, that conversion in `toXmeml` is the place to fix.
- Media must stay where it was; the files point at absolute `file:///` URLs.
