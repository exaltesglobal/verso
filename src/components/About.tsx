import { useEffect, useRef, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import versoMark from "../assets/brand/verso-mark.svg";
import agapeLockup from "../assets/brand/agape-labs-lockup-dark.svg";

/** About Verso: mark, version and developer credit. */
export function About({ onClose }: { onClose: () => void }) {
  const [version, setVersion] = useState("0.1.0");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {
        /* running in a plain browser (pnpm dev): keep the fallback */
      });
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="about"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <img src={versoMark} alt="" width={64} height={64} />
        <h2 id="about-title" className="about__name">
          Verso
        </h2>
        <p className="about__tagline">Long videos in. Reels out.</p>
        <p className="about__version">Version {version} beta</p>

        <div className="about__divider" />

        <img src={agapeLockup} alt="Agape Labs" className="about__agape" />
        <p className="about__credit">Developed by Agape Labs, Exaltes Global Private Limited</p>
        <p className="about__copy">© 2026 Exaltes Global Private Limited. All rights reserved.</p>

        <button ref={closeRef} type="button" className="btn btn--secondary about__close" onClick={onClose}>
          <span>Close</span>
        </button>
      </div>
    </div>
  );
}
