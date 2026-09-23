# Sécurité et confidentialité — ORION 1.1

## Flux réels

ORION n’a aucun compte, API de journal, base serveur, télémétrie, IA ou service de synchronisation. Les champs saisis et imports sont traités dans le navigateur. Polices, icônes, code et modules d’export sont servis par la même origine. L’hébergeur reçoit les requêtes de chargement du site et peut journaliser l’adresse IP et les métadonnées HTTP : « local » ne signifie pas navigation anonyme.

Le choix d’une installation institutionnelle, d’un poste autorisé et du droit de traiter les données appartient à l’organisation. Ce logiciel n’est pas certifié ou homologué. Le chiffrement ne constitue pas à lui seul une conformité à la LIPAD/LPD, un plan d’archivage ou une analyse d’impact.

## Reprise après crash

La reprise locale est proposée par défaut pour une nouvelle session. AES-256-GCM avec IV aléatoire de 96 bits par écriture ; clé dérivée par PBKDF2-SHA-256, 600 000 itérations, sel aléatoire de 128 bits, Web Crypto. La phrase secrète n’est jamais stockée et la clé est non extractible, en mémoire uniquement. IndexedDB reçoit uniquement une enveloppe chiffrée, pas les noms ou contenus du journal. L’enveloppe est authentifiée ; ses paramètres sont strictement validés avant dérivation.

Les écritures sont sérialisées, avec un délai de 250 ms pour regrouper les frappes. Le brouillon de nouvelle entrée est inclus dans la reprise chiffrée. Un verrou Web Locks refuse l’ouverture simultanée de la session sauvegardée dans deux onglets. Le refus du stockage est affiché et impose l’export avant fermeture volontaire. Un statut « sauvegardé » signifie transaction IndexedDB terminée ; aucune application ne peut garantir les dernières frappes pendant une coupure électrique ou la survie d’un disque.

Le mode temporaire reste uniquement en mémoire et est perdu si l’onglet est fermé/rechargé ou le processus arrêté. La navigation privée, l’éviction du stockage et son effacement peuvent supprimer la reprise. Conserver des archives sur les supports autorisés. Pas de récupération de phrase secrète, de compte administrateur ou de porte dérobée.

La commande de fin de session est explicite et demande une archive récente de chaque journal. Elle efface l’enveloppe locale de reprise, mais pas les fichiers téléchargés, copies externes, anciennes sauvegardes du disque ou caches système. Un effacement cryptographique n’est pas une garantie d’effacement physique des supports.

## Imports et exports

- Les fichiers ORION et JSON ont un schéma strict et versionné, des limites (32 Mo / 10 000 entrées par journal), des identifiants et des numéros uniques.
- Un import est prévisualisé avant mutation. Une fusion ignore les doublons exacts et refuse les identifiants dont les versions divergent. Le choix d’une copie séparée conserve les deux versions.
- CSV/TSV : syntaxe vérifiée, cellules et lignes bornées, formules neutralisées dans les exports. XLSX/ODS écrivent uniquement des cellules texte, sans macro ni formule ni lien externe.
- Les textes importés sont affichés par React. Les exports XML/HTML échappent les caractères spéciaux ; le document HTML interdit les scripts et connexions par CSP.
- Le fichier `.orion` est chiffré. Tous les autres formats sont en clair, avec reconnaissance explicite dans l’interface. Une requête de téléchargement réussie n’atteste pas de la présence durable du fichier sur disque.
- Les exports de lecture ne sont pas des archives d’audit complètes. Seuls ORION/JSON gardent toutes les versions.

## Suppression d’une entrée

La suppression retire le contenu et l’historique de l’entrée du journal et de la sauvegarde locale ; seuls le numéro, l’auteur, l’heure et le motif restent. Elle n’atteint pas les archives, PDF ou copies exportés auparavant, ni d’éventuelles copies sur d’autres postes tant qu’elles n’ont pas été fusionnées avec une archive postérieure à la suppression.

## Limites du modèle

Le nom de l’opérateur est déclaratif. L’historique préserve les corrections via l’application, mais ce n’est ni un registre inviolable ni une signature électronique. Une personne avec accès au poste déverrouillé ou à la phrase de récupération peut lire/modifier les données. Le chiffrement local ne protège pas d’un logiciel malveillant, d’une extension intrusive, d’une capture d’écran, d’un script compromis sur l’origine ou de l’accès à la mémoire du navigateur.

Le verrouillage est manuel : verrouiller avant de quitter le poste. Pas de collaboration en temps réel. Deux fichiers modifiés séparément ne sont pas fusionnés automatiquement lorsqu’ils divergent. La classification est une indication de diffusion, pas un contrôle d’habilitation.

L’exploitant doit maîtriser le code servi, HTTPS, les postes, les extensions, les sauvegardes, les droits d’accès aux fichiers et les délais de conservation. Aucun logiciel ne rend un ordinateur public non fiable approprié au traitement de données sensibles.

## Signaler un problème

Transmettre un signalement privé au mainteneur du dépôt avec des données fictives et les étapes de reproduction. Ne pas joindre de journal réel, de phrase de récupération ni de sauvegarde contenant des données personnelles à une issue publique.
