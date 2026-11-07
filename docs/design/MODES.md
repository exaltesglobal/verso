# Workspaces: Quick, Craft, Studio

Verso has three workspaces over one project. The switch sits in the middle of
the title bar. Switching never touches the project: the project, undo history,
selection and playhead live in `Editor.tsx`, and the workspace only arranges
what is on screen. The choice is saved with the other app settings
(`verso.settings` in localStorage, `src/lib/settings.ts`).

- New users start in **Quick**. People who used Verso before modes existed
  start in **Craft**, which is the editor they know.
- The first time someone moves up to Craft or Studio, a one-line toast says
  "Craft shows more controls. Switch back any time." (Studio has its own line).
  It shows once per mode.
- A switch crossfades the panels for 200 ms. This is off under reduced motion.

## The three workspaces

|                                                        | Quick                                                                        | Craft                                 | Studio                      |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------- | --------------------------- |
| Left                                                   | Big list of steps, then one panel with "All steps" to go back                | Icon rail + panel                     | Icon rail + panel           |
| Panels offered                                         | Add video, Auto-cut, Captions, Template, Text, Music                         | All                                   | All                         |
| Centre                                                 | "Make it better" row, big preview, clip strip                                | Preview                               | Preview                     |
| Right                                                  | Do it all + one-tap options for the selected clip                            | Effect Controls inspector             | Effect Controls inspector   |
| Timeline                                               | Clip strip: Video, Sound, Captions lanes, no lane names; split, delete, mute | All lanes, lane names, snapping, zoom | Same, plus resizable height |
| Preview bar                                            | Play + reel shape                                                            | Full transport                        | Full transport              |
| Panel sizes                                            | Fixed                                                                        | Fixed                                 | Drag to resize              |
| "More settings" rows                                   | Closed                                                                       | Open                                  | Open                        |
| Speed ramp (keyframed)                                 | No                                                                           | No                                    | Yes                         |
| Pro keys (J/K/L, frame step, zoom, ripple delete, `\`) | No                                                                           | Yes                                   | Yes                         |

Space, undo/redo, save, split (S), delete and export work in every mode.

Layouts live in `src/components/workspaces/Workspaces.tsx`
(`QuickWorkspace`, `CraftWorkspace`, `StudioWorkspace`). The Editor builds
each piece once (title bar, left, preview, right, timeline, menus) and hands
them to the workspace for the current mode. Styles are in `src/styles/modes.css`.

## The visibility map

`src/lib/modes.ts` has one `VISIBILITY` record per mode. Components read it
with `useVisibility()` and never check the mode name themselves, so the three
modes stay consistent:

| Key                | Read by                   | Meaning                                     |
| ------------------ | ------------------------- | ------------------------------------------- |
| `left`             | LeftPanel                 | `"rail"` or `"steps"`                       |
| `tabs`             | LeftPanel                 | Panels offered in the rail or steps list    |
| `right`            | Editor                    | `"inspector"` or `"oneTap"`                 |
| `makeItBetter`     | Editor                    | Show the one-tap row above the preview      |
| `resizable`        | Editor (Studio workspace) | Drag handles between panels                 |
| `tracks`           | Timeline                  | Lanes shown, or all of them when null       |
| `trackHeaders`     | Timeline                  | Lane names on the left                      |
| `timelineTools`    | Timeline                  | `"strip"` (split, delete, mute) or `"full"` |
| `previewBar`       | Preview                   | `"ratio"` or `"full"`                       |
| `moreSettingsOpen` | MoreSettings              | Whether "More settings" starts open         |
| `scrubFields`      | (reserved)                | Drag-to-change number fields                |
| `keyframes`        | Inspector                 | Keyframed controls such as speed ramps      |
| `proShortcuts`     | Editor keyboard           | Pro transport, zoom and ripple keys         |

## Panels: one primary action, a few big choices, one "More settings"

Every left panel opens on one obvious primary action and at most 3-4 big
choices. Advanced controls sit behind one shared `MoreSettings` row
(`src/components/MoreSettings.tsx`). It is closed in Quick, open in Craft and
Studio, and resets when the mode changes.

## One-tap edits

`src/lib/oneTap.ts` is the single registry of one-tap actions. Each entry has:

- an id, a label, an icon and a hint;
- `aiCost`: the credit price key, or null for free actions;
- `appliesTo`: the clip kinds it shows for, or `"project"`;
- `blocked(project)`: a plain reason it can't run yet;
- `run({ project, clip, charge })`, which returns a new project.

Every action calls the existing editing functions: captions engine,
`removeSilences`, `snapCutsToBeats`, `applyEnhanced`, `applyHookTitle` with
`hookIdeas`, `addTextClip`, `applyPunchIns`, `withGrade`, and so on. Nothing is
re-implemented.

Three surfaces read the registry:

- **Make it better** (top of Quick): Auto captions, Remove pauses, Cut to beat,
  Fit to 9:16, Clean voice, Add hook title, Add end card, Punch-ins, Warm look,
  Loudness fix.
- **Clip right-click menus** in every mode, filtered by `appliesTo`.
- **Quick's right column**: up to four actions for the selected clip, plus
  Delete.

`useOneTapRunner` (`src/components/workspaces/useOneTapRunner.ts`) runs them.
It charges AI actions through `useCharged()`, which spends and refunds on
failure. When credits run out it opens the existing Out of credits dialog. It
applies the result as one history entry and shows a toast with Undo. AI
actions show a small credit chip (`CostChip`) priced by `estimate()` from the
server pricing. Free actions show nothing.

### Do it all

The Do it all button in Quick's right column:

1. Guesses the kind of video from what is already known: sound, speech density
   from caption words per second, shape and length, and whether a speaker crop
   found more than one face. The result is talking to camera, podcast or
   interview, or footage without much talking.
2. Picks the usual steps for that kind, skipping any that are blocked or
   already done.
3. Shows the list, with the existing `CostConfirm` when captions will spend
   credits.
4. Runs the steps in order. Captions run first so later cuts carry the words
   along.
5. Applies everything as one undo step and shows a short summary with one
   "Undo all".

### Panel presets

Some panels have their own one-tap presets:

- Captions: 7 style tiles.
- Text: preset tiles.
- Audio: Louder, Balanced, Music under voice.
- Templates: one tap applies.
- Export: Reel, Short, Story, YouTube 16:9 ("Made for").

## Time saved

`src/lib/timeSaved.ts` holds conservative estimates of the editing time each
one-tap action replaces in a pro editor. For example, captions save 25 minutes
per 10 minutes of speech, Remove pauses 12 minutes, Fit to 9:16 20 minutes and
Auto-cut 45 minutes. A server config can override the table with
`setTimeSavedTable`.

A one-tap run adds its minutes to today's total and the lifetime total, both
kept in settings. Undo from the toast or the Do it all summary takes them back.
Ctrl+Z after the toast has gone does not.

The title bar shows "Saved about 1 h 20 min today". It is hidden below 1360 px
wide. Settings > Editing shows the lifetime total.

## First run

The Welcome screen offers three choices:

- Make reels from a long video: pick a file, then Auto-cut.
- Edit a clip.
- Use a template.

Dropping a file anywhere on the Welcome screen starts the right flow. A
landscape video longer than 2 minutes opens Auto-cut; anything else opens for
editing. In Quick, Auto-cut shows only candidate reel cards, each with "Make
this reel".
