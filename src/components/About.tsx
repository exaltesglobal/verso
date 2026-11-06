import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import versoMark from "../assets/brand/verso-mark.svg";
import agapeLockup from "../assets/brand/agape-labs-lockup-dark.svg";
import { Modal } from "./Modal";
import { Button } from "./ui";

/** About Verso: mark, version and developer credit. */
export function About({ onClose }: { onClose: () => void }) {
  const [version, setVersion] = useState("0.1.0");

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {
        /* running in a plain browser (pnpm dev): keep the fallback */
      });
  }, []);

  return (
    <Modal
      title="About Verso"
      onClose={onClose}
      size="sm"
      className="about"
      footer={
        <Button onClick={onClose} className="about__close" autoFocus>
          Close
        </Button>
      }
    >
      <img src={versoMark} alt="" width={64} height={64} />
      <p className="about__name">Verso</p>
      <p className="about__tagline">Long videos in. Reels out.</p>
      <p className="about__version">Version {version} beta</p>

      <div className="about__divider" />

      <img src={agapeLockup} alt="Agape Labs" className="about__agape" />
      <p className="about__credit">Developed by Agape Labs, Exaltes Global Private Limited</p>
      <p className="about__copy">© 2026 Exaltes Global Private Limited. All rights reserved.</p>
    </Modal>
  );
}
