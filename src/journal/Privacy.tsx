import { ExternalLink } from "lucide-react";
import { Modal } from "./Modal";

export function Privacy({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Sécurité et données" onClose={onClose}>
      <dl className="spec">
        <div>
          <dt>Session temporaire</dt>
          <dd>Mémoire de l’onglet uniquement. Perdue à la fermeture.</dd>
        </div>
        <div>
          <dt>Sauvegarde locale</dt>
          <dd>
            IndexedDB de ce navigateur, chiffrée. Phrase et clé jamais
            enregistrées.
          </dd>
        </div>
        <div>
          <dt>Archive .orionaic</dt>
          <dd>AES-256-GCM · PBKDF2-SHA-256, 600 000 itérations.</dd>
        </div>
        <div>
          <dt>Autres formats</dt>
          <dd>En clair : PDF, Excel, Word, CSV, JSON, HTML, texte.</dd>
        </div>
        <div>
          <dt>Réseau</dt>
          <dd>
            Aucun contenu transmis. Ni IA, ni statistiques, ni police distante.
            L’hébergeur voit les requêtes de chargement (adresse IP).
          </dd>
        </div>
        <div>
          <dt>Identité</dt>
          <dd>Noms d’opérateur déclaratifs. Historique non signé.</dd>
        </div>
      </dl>
      <h3 className="section-label">Limites</h3>
      <ul className="plain">
        <li>
          Un poste compromis ou une session déverrouillée expose les données.
        </li>
        <li>Effacer les données du navigateur efface la sauvegarde locale.</li>
        <li>Aucune synchronisation entre postes : transfert par fichier.</li>
        <li>
          Conservation, destinataires et autorisation de traiter des données
          réelles : responsabilité de l’organisation.
        </li>
        <li>
          Logiciel indépendant, sans homologation OFPP ni État de Genève. Les
          numéros de groupes et RFSI viennent du plan de flotte cantonal.
        </li>
      </ul>
      <div className="action-row">
        <a className="button" href="/source/orion-aic-source.tar.gz" download>
          Code source · AGPL-3.0
        </a>
        <a
          className="link"
          href="https://www.babs.admin.ch/fr/documents-de-formation"
          target="_blank"
          rel="noreferrer"
        >
          Documents OFPP
          <ExternalLink size={12} />
        </a>
      </div>
    </Modal>
  );
}
