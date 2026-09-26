import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { findTerminal, type Radio, type Terminal } from "../../shared/radio";
import { Modal } from "../journal/Modal";

type Detector = {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};
type DetectorClass = new (options: { formats: string[] }) => Detector;

/**
 * Reads a QR code with the camera (BarcodeDetector), or accepts a typed
 * value. `find` turns what was read into the thing looked for. With
 * `continuous`, the camera stays open for the next code (roll-call).
 */
export function CodeScanner<T>({
  title,
  placeholder,
  manualLabel,
  help,
  find,
  unknown,
  onFound,
  onClose,
  continuous = false,
}: {
  title: string;
  placeholder: string;
  manualLabel: string;
  /** Shown when the camera cannot read codes. */
  help: string;
  find: (value: string) => T | undefined;
  /** Message for a code read that matches nothing. */
  unknown: (value: string) => string;
  /** Returns a message to show (continuous mode). */
  onFound: (found: T) => string | void;
  onClose: () => void;
  continuous?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<"starting" | "on" | "none">("starting");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const found = useRef(false);
  // The same code is not taken twice in a row within a few seconds.
  const last = useRef({ value: "", at: 0 });
  const handlers = useRef({ find, onFound, unknown, continuous });
  handlers.current = { find, onFound, unknown, continuous };
  const accept = (raw: string) => {
    const { find: look, onFound: found$, unknown: none } = handlers.current;
    const value = look(raw);
    if (value === undefined) {
      setError(none(raw));
      return false;
    }
    setError("");
    const message = found$(value);
    if (message) setDone(message);
    return true;
  };
  const accept$ = useRef(accept);
  accept$.current = accept;
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
            const now = Date.now();
            if (
              code.rawValue === last.current.value &&
              now - last.current.at < 4000
            )
              continue;
            last.current = { value: code.rawValue, at: now };
            if (accept$.current(code.rawValue)) {
              if (!handlers.current.continuous) found.current = true;
              return;
            }
          }
        }, 300);
      })
      .catch(() => live && setCamera("none"));
    return () => {
      live = false;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  return (
    <Modal title={title} onClose={onClose}>
      {camera !== "none" ? (
        <div className="scanner">
          <video ref={video} muted playsInline />
          <span className="scanner-frame" aria-hidden="true" />
          {camera === "starting" && (
            <p className="muted">Ouverture de la caméra…</p>
          )}
        </div>
      ) : (
        <p className="hint">{help}</p>
      )}
      <form
        className="inline-field scanner-manual"
        onSubmit={(e) => {
          e.preventDefault();
          if (accept(typed.trim())) setTyped("");
        }}
      >
        <input
          aria-label={manualLabel}
          placeholder={placeholder}
          value={typed}
          autoFocus={camera === "none"}
          data-autofocus={camera === "none" || undefined}
          onChange={(e) => setTyped(e.target.value)}
        />
        <button className="primary" disabled={!typed.trim()}>
          <ScanLine size={14} />
          Valider
        </button>
      </form>
      {done && !error && (
        <p className="hint" role="status">
          {done}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}

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
  return (
    <CodeScanner<Terminal>
      title="Scanner un terminal"
      placeholder="N° du terminal, ex. R-04"
      manualLabel="N° du terminal"
      help="Lecture de QR indisponible dans ce navigateur. Saisir le numéro, ou scanner l’étiquette avec l’appareil photo du téléphone : le lien ouvre ce terminal dans orion aic."
      find={(value) => findTerminal(radio, value)}
      unknown={(value) =>
        value.includes("/") || value.includes("#")
          ? `QR lu, terminal inconnu : ${value}`
          : `Aucun terminal « ${value} ».`
      }
      onFound={(terminal) => {
        onFound(terminal);
      }}
      onClose={onClose}
    />
  );
}
