# Keyboard shortcuts

The single list of Verso's shortcuts, taken from the handlers in the code. On macOS, Cmd works wherever Ctrl is
listed.

## Editor (`src/screens/Editor.tsx`)

Ignored while typing in a text field or while a dialog is open.

| Keys | Action |
| --- | --- |
| Space | Play / pause |
| Ctrl+Z | Undo |
| Ctrl+Y or Ctrl+Shift+Z | Redo |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save as |
| S | Split the selected clip at the playhead |
| Delete or Backspace | Delete the selected clip |
| Shift+Delete or Shift+Backspace | Delete and close the gap (ripple delete) |
| Left / Right arrow | Move the playhead one frame (1/30 s) |
| Shift+Left / Shift+Right | Move the playhead one second |
| Home | Go to the start |
| End | Go to the end |

## Dialogs and menus

| Keys | Where | Action |
| --- | --- | --- |
| Esc | Export (when not exporting), Settings, About, account dialogs, context menus | Close |
| Enter | Project name, caption text, Surecast URL/key fields | Confirm the field |
| Enter | Auto-cut moment card | Open that moment as a reel |

## Timeline mouse modifiers

Dragging a clip snaps to clip edges and the playhead within 8 px, otherwise to whole frames.
