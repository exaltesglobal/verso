import { useState } from "react";
import { Modal } from "./Modal";

/** Every editor shortcut, grouped the way Premiere's sheet is. Keep in step with Editor.tsx's key handler. */
const GROUPS: [string, [string, string][]][] = [
  [
    "Playback",
    [
      ["Play or pause", "Space"],
      ["Play", "L"],
      ["Pause", "K"],
      ["Back 1 second", "J"],
      ["Back or forward 1 frame", "← →"],
      ["Back or forward 1 second", "Shift+← →"],
      ["Go to start or end", "Home End"],
      ["Full screen preview", "F"],
    ],
  ],
  [
    "Editing",
    [
      ["Split at playhead", "S"],
      ["Delete clip", "Del"],
      ["Delete and close the gap", "Shift+Del"],
      ["Undo", "Ctrl+Z"],
      ["Redo", "Ctrl+Shift+Z"],
      ["Save to a file", "Ctrl+S"],
      ["Export reel", "Ctrl+E"],
    ],
  ],
  [
    "Timeline and view",
    [
      ["Zoom in or out", "= -"],
      ["Zoom around the cursor", "Ctrl+scroll"],
      ["Zoom to fit", "\\"],
      ["Snapping on or off", "N"],
      ["Drag without snapping", "Alt+drag"],
      ["Hide or show side panels", "Ctrl+\\"],
      ["Keyboard shortcuts", "?"],
    ],
  ],
];

export function ShortcutSheet({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const match = (label: string, keys: string) =>
    (label + " " + keys).toLowerCase().includes(q.trim().toLowerCase());
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose} size="lg" className="shortcuts">
      <input
        className="field__input shortcuts__search"
        placeholder="Search shortcuts"
        aria-label="Search shortcuts"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      <div className="shortcuts__cols">
        {GROUPS.map(([group, rows]) => (
          <section key={group}>
            <h3 className="shortcuts__group">{group}</h3>
            <ul>
              {rows
                .filter(([l, k]) => match(l, k))
                .map(([label, keys]) => (
                  <li key={label} className="shortcuts__row">
                    <span>{label}</span>
                    <span className="shortcuts__keys">
                      {keys.split(" ").map((k) => (
                        <kbd key={k} className="kbd">
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
