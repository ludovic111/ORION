import { useContext, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Ctx } from "../app/context";
import {
  applyVoiceCommands,
  insertAt,
  pickLang,
  recognitionClass,
  speechSupported,
} from "./dictation";
import "./dictation.css";

// Minimal shape of the Web Speech API (not in every TypeScript DOM lib).
type Alternative = { transcript: string };
type Result = { isFinal: boolean; length: number; [i: number]: Alternative };
type ResultEvent = {
  resultIndex: number;
  results: { length: number; [i: number]: Result };
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: ResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionClass = new () => Recognition;

const ERRORS: Record<string, string> = {
  "not-allowed": "Micro refusé : autorisez-le pour ce site dans le navigateur.",
  "service-not-allowed": "Dictée refusée par le navigateur ou l’organisation.",
  network: "Pas de connexion : la dictée de ce navigateur passe par internet.",
  "no-speech": "Rien entendu. Appuyez sur le micro, puis parlez.",
  "audio-capture": "Aucun micro trouvé sur ce poste.",
  "language-not-supported":
    "Le français n’est pas disponible pour la dictée ici.",
};

/** Keeps the last words of a long interim transcript. */
const tail = (text: string, max = 60) =>
  text.length > max ? `…${text.slice(-max)}` : text;

/**
 * Inserts dictated text in a textarea at its caret, then puts the caret
 * after it. `set` writes the new value into the form state.
 */
export function insertDictation(
  area: HTMLTextAreaElement | null,
  text: string,
  set: (value: string) => void,
  maxLength = area?.maxLength && area.maxLength > 0 ? area.maxLength : Infinity,
) {
  if (!area) return;
  const { value, caret } = insertAt(
    area.value,
    area.selectionStart,
    area.selectionEnd,
    text,
    maxLength,
  );
  set(value);
  requestAnimationFrame(() => area.setSelectionRange(caret, caret));
}

/**
 * Microphone button for voice dictation. Hidden where the browser has no
 * speech recognition or when « Dictée vocale » is off for this post.
 */
export function DictationButton({
  onText,
  disabled = false,
  label = "Dicter le texte",
}: {
  onText: (text: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const app = useContext(Ctx);
  const [supported] = useState(
    () => typeof window !== "undefined" && speechSupported(window),
  );
  const enabled = supported && !!app?.prefs.dictation;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const sink = useRef(onText);
  sink.current = onText;

  function stop() {
    recognition.current?.stop();
  }

  function start(lang = pickLang(navigator.languages)) {
    const Class = recognitionClass(window) as RecognitionClass;
    const rec = new Class();
    rec.lang = lang;
    // Chrome on Android repeats the results of a continuous recognition:
    // there, one sentence per press.
    rec.continuous = !/Android/i.test(navigator.userAgent);
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let retried = false;
    rec.onresult = (event) => {
      let final = "";
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) final += ` ${text}`;
        else pending += ` ${text}`;
      }
      setInterim(pending.trim());
      const text = applyVoiceCommands(final.trim());
      if (text) sink.current(text);
    };
    rec.onerror = (event) => {
      if (event.error === "aborted") return;
      // Browsers without Swiss French: French of France instead.
      if (event.error === "language-not-supported" && lang !== "fr-FR") {
        retried = true;
        return;
      }
      // Brave exposes the API without Google's transcription service.
      const brave = "brave" in navigator && event.error === "network";
      setError(
        brave
          ? "Brave ne transcrit pas la voix : utilisez Chrome, Edge ou Safari."
          : (ERRORS[event.error] ?? "La dictée s’est arrêtée."),
      );
    };
    rec.onend = () => {
      if (recognition.current !== rec) return;
      recognition.current = null;
      setListening(false);
      setInterim("");
      if (retried) start("fr-FR");
    };
    setError("");
    try {
      rec.start();
    } catch {
      setError("La dictée n’a pas pu démarrer.");
      return;
    }
    recognition.current = rec;
    setListening(true);
  }

  // While listening: Escape, hiding the tab or leaving the page stop.
  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Stops the dictation only, not the dialog around the form.
      e.preventDefault();
      e.stopPropagation();
      stop();
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") stop();
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pagehide", stop);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pagehide", stop);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [listening]);

  // Off, disabled or gone: the microphone is released at once.
  useEffect(() => {
    if (enabled && !disabled) return;
    recognition.current?.abort();
  }, [enabled, disabled]);
  useEffect(
    () => () => {
      const rec = recognition.current;
      recognition.current = null;
      rec?.abort();
    },
    [],
  );

  if (!enabled) return null;
  const status = listening ? tail(interim) || "Écoute…" : error;
  return (
    <span className="dictation">
      <span
        className={`dictation-status ${error && !listening ? "error" : ""}`}
        role="status"
        aria-live="polite"
      >
        {listening && <i className="dictation-dot" aria-hidden="true" />}
        {status && <span className="dictation-text">{status}</span>}
      </span>
      <button
        type="button"
        className="icon-button dictation-button"
        aria-pressed={listening}
        aria-label={listening ? "Arrêter la dictée" : label}
        title={listening ? "Arrêter la dictée (Échap)" : label}
        disabled={disabled}
        // Keeps the focus (and the caret) in the text field.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => (listening ? stop() : start())}
      >
        {listening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
    </span>
  );
}
