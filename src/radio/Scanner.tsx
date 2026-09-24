import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { findTerminal, type Radio, type Terminal } from "../../shared/radio";
import { Modal } from "../journal/Modal";

type Detector = {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};
type DetectorClass = new (options: { formats: string[] }) => Detector;

/** Reads a terminal QR label with the camera, or accepts a typed number. */
export function Scanner({
  radio,
  onClose,
  onFound,
}: {
  radio: Radio;
  onClose: () => void;
  onFound: (terminal: Terminal) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<"starting" | "on" | "none">("starting");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const found = useRef(false);
  const found$ = useRef(onFound);
  found$.current = onFound;
  useEffect(() => {
    const Barcode = (window as unknown as { BarcodeDetector?: DetectorClass })
      .BarcodeDetector;
    if (!Barcode || !navigator.mediaDevices?.getUserMedia) {
      setCamera("none");
      return;
    }
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let live = true;
    const detector = new Barcode({ formats: ["qr_code"] });
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(async (media) => {
        if (!live) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = media;
        const el = video.current!;
        el.srcObject = media;
        await el.play();
        setCamera("on");
        timer = setInterval(async () => {
          if (found.current || el.readyState < 2) return;
          const codes = await detector.detect(el).catch(() => []);
          for (const code of codes) {
            const terminal = findTerminal(radio, code.rawValue);
            if (terminal) {
              found.current = true;
              found$.current(terminal);
              return;
            }
            setError(`QR lu, terminal inconnu : ${code.rawValue}`);
          }
        }, 300);
      })
      .catch(() => live && setCamera("none"));
    return () => {
      live = false;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [radio]);
  return (
    <Modal title="Scanner un terminal" onClose={onClose}>
      {camera !== "none" ? (
        <div className="scanner">
          <video ref={video} muted playsInline />
          <span className="scanner-frame" aria-hidden="true" />
          {camera === "starting" && (
            <p className="muted">Ouverture de la caméra…</p>
          )}
        </div>
      ) : (
        <p className="hint">
          Lecture de QR indisponible dans ce navigateur. Saisir le numéro, ou
          scanner l’étiquette avec l’appareil photo du téléphone : le lien ouvre
          ce terminal dans orion aic.
        </p>
      )}
      <form
        className="inline-field scanner-manual"
        onSubmit={(e) => {
          e.preventDefault();
          const terminal = findTerminal(radio, typed);
          if (terminal) onFound(terminal);
          else setError(`Aucun terminal « ${typed} ».`);
        }}
      >
        <input
          aria-label="N° du terminal"
          placeholder="N° du terminal, ex. R-04"
          value={typed}
          autoFocus={camera === "none"}
          onChange={(e) => setTyped(e.target.value)}
        />
        <button className="primary" disabled={!typed.trim()}>
          <ScanLine size={14} />
          Ouvrir
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
