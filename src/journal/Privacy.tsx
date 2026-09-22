import {
  ExternalLink,
  HardDrive,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Modal } from "./Modal";
export function Privacy({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Vos données restent sur votre poste" onClose={onClose}>
      <div className="privacy-list">
        <section>
          <HardDrive />
          <div>
            <h3>Vous choisissez ce qui reste</h3>
            <p>
              En mode temporaire, le contenu reste dans la mémoire de cet
              onglet. Exportez avant de fermer ou recharger. Avec la sauvegarde
              locale, l’espace est chiffré dans ce navigateur ; votre phrase
              secrète et la clé ne sont jamais enregistrées.
            </p>
          </div>
        </section>
        <section>
          <LockKeyhole />
          <div>
            <h3>Un fichier pour passer le relais</h3>
            <p>
              L’archive ORION est chiffrée avec AES-256-GCM ; la clé est dérivée
              avec PBKDF2-SHA-256, 600 000 itérations. Les autres formats sont
              en clair. La phrase secrète n’est pas récupérable. Conservez une
              copie sur un support autorisé.
            </p>
          </div>
        </section>
        <section>
          <ShieldCheck />
          <div>
            <h3>Un outil indépendant, à autoriser sur le terrain</h3>
            <p>
              Aucun contenu du journal n’est transmis au serveur. Pas de
              publicité, d’IA, de statistiques de navigation, de police distante
              ou de compte. L’hébergeur reçoit les requêtes nécessaires au
              chargement du site (notamment l’adresse IP). Le logiciel peut être
              hébergé par votre institution.
            </p>
          </div>
        </section>
      </div>
      <div className="inset">
        <h3>Les limites à connaître</h3>
        <p>
          Un poste compromis ou un espace déverrouillé peut exposer les données.
          Le nom de l’opérateur est déclaratif ; l’historique conserve les
          corrections mais ne constitue pas une preuve inviolable. Il n’y a pas
          de synchronisation entre postes.
        </p>
        <p>
          La conservation, les destinataires, les sauvegardes et l’autorisation
          de traiter des données réelles relèvent de votre organisation. La
          suppression des données du navigateur efface aussi la sauvegarde
          locale. ORION ne garantit pas une conformité ou homologation
          institutionnelle.
        </p>
      </div>
      <p className="hint">
        Notez les renseignements utiles à l’intervention. Évitez les données
        personnelles sans nécessité opérationnelle.
      </p>
      <div className="action-row">
        <a className="button" href="/source/orion-source.tar.gz" download>
          Code source · AGPL-3.0
        </a>
        <a
          className="text-link"
          href="https://www.babs.admin.ch/fr/documents-de-formation"
          target="_blank"
          rel="noreferrer"
        >
          Références OFPP
          <ExternalLink size={13} />
        </a>
      </div>
    </Modal>
  );
}
