import { Copy, Lightbulb, Mail } from "lucide-react";
import { useState } from "react";

// Contact of the author, for requests of new features or changes. The
// message is prepared in the user's mail program; nothing from the session
// is included.

export const CONTACT_EMAIL = "ludo47j@gmail.com";

export function feedbackLink(topic = "") {
  const subject = `orion aic · idée${topic ? ` (${topic})` : ""}`;
  const body = [
    "Bonjour,",
    "",
    `J’utilise orion aic${topic ? `, module « ${topic} »` : ""}.`,
    "",
    "Ce que je voudrais ajouter ou changer :",
    "",
    "",
    "Dans quelle situation cela m’aiderait :",
    "",
    "",
    "Merci !",
  ].join("\n");
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** "Une idée, un besoin ?" card with the e-mail address. */
export function ContactCard({ topic = "" }: { topic?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="contact-card">
      <div className="contact-icon">
        <Lightbulb size={22} />
      </div>
      <div>
        <h3>Une idée, un besoin, quelque chose à changer ?</h3>
        <p>
          orion aic évolue avec ceux qui l’utilisent. Écrivez-moi pour demander
          une fonction, signaler un souci ou proposer ce qui vous faciliterait
          la vie : chaque message est lu.
        </p>
        <div className="contact-actions">
          <a className="button primary" href={feedbackLink(topic)}>
            <Mail size={14} />
            Écrire à {CONTACT_EMAIL}
          </a>
          <button
            onClick={() => {
              void navigator.clipboard
                ?.writeText(CONTACT_EMAIL)
                .then(() => setCopied(true))
                .catch(() => {});
            }}
          >
            <Copy size={14} />
            {copied ? "Adresse copiée" : "Copier l’adresse"}
          </button>
        </div>
        <small className="muted">
          N’envoyez jamais le contenu d’un journal réel par e-mail : décrivez le
          besoin, pas les données.
        </small>
      </div>
    </section>
  );
}
