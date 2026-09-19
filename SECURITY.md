# Sécurité

ORION 0.2 est une base de pilote institutionnel vérifiable. Ce dépôt n’est ni une certification de conformité, ni une autorisation d’utiliser le produit pour une intervention réelle.

## Protections implémentées

- Connexion et MFA TOTP, chiffrement authentifié des secrets, sessions révocables et expirantes.
- Mots de passe hachés avec scrypt (N=131072, r=8, p=1), sel aléatoire par compte et comparaison en temps constant.
- Contrôle des rôles et affectations côté serveur, validation stricte, SQL paramétré.
- CSP même origine, cookies protégés, anti-CSRF et absence de CORS permissif.
- Conflits d’édition explicites, transactions et import atomique.
- Audit en ajout seul, chaîne d’intégrité et export enregistré.
- TLS PostgreSQL avec contrôle de certificat en production ; rejet des paramètres de connexion qui pourraient écraser ce réglage.
- Refus de démarrer en production avec le mode démo, sans PostgreSQL, avec une origine non HTTPS, sans clé forte, ou avec un utilisateur SQL propriétaire/superuser.
- Image de service non root ; exemple Compose sans privilèges, système de fichiers en lecture seule et publication sur loopback.
- Aucun secret ni document original dans le répertoire web. Pas d’API de requête SQL arbitraire, d’URL de connexion éditable dans le navigateur ou de téléchargement distant fourni par un utilisateur.

## Obligations du déploiement

Le chiffrement du disque, des sauvegardes, le certificat HTTPS, les accès réseau, la disponibilité, les correctifs et la gestion des administrateurs appartiennent au déploiement institutionnel. Le code ne doit pas afficher « AES-256 au repos » comme garantie générale : seuls les secrets MFA sont chiffrés par l’application ; le chiffrement du reste dépend de l’hébergement.

Les comptes SQL de migration et de service doivent être distincts. Restreindre les sorties réseau du conteneur au serveur PostgreSQL ; les actifs cartographiques sont préparés séparément. Les comptes et affectations font l’objet de revues périodiques. Le service doit être placé derrière un reverse proxy avec limitation de débit adaptée, sauvegardes et supervision.

Les nouvelles traces de modification contiennent les champs modifiés et des empreintes avant/après, sans recopier le contenu des fiches. Des métadonnées de dossier, d’administration et de diffusion restent présentes ; les traces historiques 0.1 peuvent contenir les valeurs métier. Le journal nécessite donc la même protection que les dossiers. La base opérationnelle, l’audit et les fichiers exportés sont soumis à la politique de conservation de l’institution. La minimisation, les bases légales, l’évaluation des risques et une éventuelle AIPD doivent être déterminées avec les responsables compétents.

## Signalement

Ne publier aucun secret, dossier opérationnel ou exploitation détaillée dans une issue publique. Avant diffusion publique, configurer un canal de signalement privé contrôlé par le mainteneur. Aucun e-mail de sécurité fictif n’est présenté comme actif.

## Risques résiduels connus

Pas encore d’audit externe, de test de pénétration, de preuve de montée en charge, de restauration d’une infrastructure cantonale ou de recette métier genevoise. La chaîne d’audit ne protège pas contre un administrateur SQL compromis disposant de privilèges suffisants. La disponibilité du réseau, les postes clients et la correction des informations saisies restent essentiels.

## Démonstration temporaire

Le mode `preview` est distinct de la production et de la démonstration locale sans authentification. Invitations aléatoires de 256 bits, empreintes en base, consentement aux données fictives, cookies Secure, expiration maximale de 72 heures (48 heures par le lanceur), révocation et exercices séparés. Aucun compte administrateur n’est délivré aux invités. Le secret de gestion reste dans un fichier local privé. Le tunnel Cloudflare ne constitue pas un hébergement institutionnel suisse. Voir [la procédure](docs/DEMONSTRATION.md) et [le cadre de conformité](docs/COMPLIANCE.md).
