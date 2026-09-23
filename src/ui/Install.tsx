import { useEffect, useState } from "react";
import { Modal } from "../journal/Modal";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const standalone = () =>
  matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Browser install prompt when offered; instructions otherwise. */
export function useInstall() {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(standalone);
  useEffect(() => {
    const offer = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", offer);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", offer);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  return {
    installed,
    install: prompt
      ? async () => {
          await prompt.prompt();
          if ((await prompt.userChoice).outcome === "accepted") done();
          setPrompt(null);
        }
      : null,
  };
  function done() {
    setInstalled(true);
  }
}

export function InstallHelp({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Installer ORION" onClose={onClose}>
      <dl className="spec">
        <div>
          <dt>iPhone · iPad</dt>
          <dd>Safari → Partager → « Sur l’écran d’accueil ».</dd>
        </div>
        <div>
          <dt>Android</dt>
          <dd>Chrome → menu ⋮ → « Installer l’application ».</dd>
        </div>
        <div>
          <dt>Ordinateur</dt>
          <dd>
            Chrome, Edge ou Brave → icône d’installation dans la barre
            d’adresse.
          </dd>
        </div>
      </dl>
      <p className="hint">
        L’app installée s’ouvre en plein écran et fonctionne hors ligne. Ses
        données restent propres à ce navigateur : une session ouverte dans
        Safari n’apparaît pas dans l’app installée, et inversement. Transférer
        par archive .orion si besoin.
      </p>
    </Modal>
  );
}
