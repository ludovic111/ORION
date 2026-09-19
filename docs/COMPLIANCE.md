# Cadre de conformité et dossier de pilote — ORION 0.2

État des sources vérifiées : 19 septembre 2026. ORION fournit des contrôles techniques et un support documentaire ; il n’est pas homologué par la Confédération, l’OFPP ou l’État de Genève. Une fiche approuvée dans le logiciel ne constitue pas un avis juridique ou une autorisation institutionnelle.

## Droit applicable et responsabilités

Pour une institution publique genevoise, qualifier en premier lieu le champ de la **LIPAD** et de son règlement. La **LPD fédérale** concerne notamment les personnes privées et les organes fédéraux : elle ne se substitue pas automatiquement à la loi cantonale pour un service genevois. Les rôles de l’éditeur, de l’hébergeur et des sous-traitants doivent être qualifiés par contrat. Les obligations de sécurité et de notification relevant de la LSI dépendent également du champ d’application et du type d’incident.

Références primaires : [LIPAD A 2 08](https://silgeneve.ch/legis/program/books/rsg/htm/rsg_a2_08.htm) (texte consulté indiquant les dernières modifications au 11 janvier 2025), [RIPAD A 2 08.01](https://silgeneve.ch/legis/program/books/rsg/htm/rsg_a2_08p01.htm), [FAQ du PFPDT](https://www.edoeb.admin.ch/fr/faq-protection-des-donnees). Les projets de révision ne sont pas présentés comme des dispositions déjà applicables.

## Matrice de préparation

| Sujet et référence                            | Contrôle livré                                                                                                                                   | Preuve et décision restant à fournir par l’institution                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Licéité, nécessité, finalité ; LIPAD 35–36    | Cadre du dossier : responsable, finalité, base légale, catégories, destinataires. Écritures métier réelles bloquées sans fiche validée et à jour | Base légale adéquate, mandat, qualification des données et validation par l’autorité compétente                                                                |
| Sécurité ; LIPAD 37, RIPAD 13                 | MFA en mode institutionnel, affectations, rôles, CSRF, TLS, conflits de versions, audit des consultations des fiches et modifications            | Politique de sécurité, classification, réseau, postes, audit externe, supervision et exercices de restauration                                                 |
| Communication ; LIPAD 39                      | Export JSON réservé aux rôles habilités, finalité et destinataire obligatoires et journalisés                                                    | Licéité de chaque communication et canal de remise autorisé. Le logiciel ne décide pas à la place de l’autorité                                                |
| Conservation et archives ; LIPAD 40, RIPAD 15 | Durée/règle de conservation, décision d’archivage et date de réexamen obligatoires dans le cadre validé                                          | Calendrier de conservation approuvé, versement aux archives, gels de suppression et purge contrôlée. Aucune suppression automatique des dossiers ou de l’audit |
| Catalogue des fichiers ; LIPAD 43             | Métadonnées préparatoires par dossier                                                                                                            | Catalogue institutionnel officiel à constituer/mettre à jour ; la fiche ORION ne le remplace pas                                                               |
| Accès et rectification ; LIPAD 44–47          | Contact protection des données, contrôle des accès et correction versionnée                                                                      | Procédure de vérification d’identité, traitement des demandes, restrictions légales et réponse dans les délais applicables                                     |
| Sous-traitance ; RIPAD 13A                    | Déploiement dans le PostgreSQL choisi par l’institution, sans télémétrie métier ni carte distante obligatoire                                    | Contrats, lieux de traitement, sous-traitants ultérieurs, droits d’audit, réversibilité et accès de maintenance                                                |
| Risques et AIPD                               | Champ documentant l’analyse et décision avant validation                                                                                         | Analyse réelle, mesures, arbitrages et consultation compétente selon le traitement envisagé                                                                    |
| LPD/OPDo si applicables                       | Protection dès la conception, minimisation des nouvelles traces métier et contrôles d’accès                                                      | Qualifier notamment les exigences de journalisation et de règlement de traitement ; ORION ne prétend pas assurer à lui seul toute la journalisation OPDo       |
| Cyberincidents ; LSI si applicable            | Traces, suspension des comptes et révocation des sessions                                                                                        | Organisation de réponse, qualification de l’événement et notification OFCS dans les 24 heures lorsque l’obligation s’applique                                  |

Guides : [AIPD du PPDT genevois](https://www.ge.ch/document/fiche-info-du-ppdt-analyse-impact-relative-protection-donnees-personnelles-aipd), [sécurité de l’information du PFPDT](https://www.edoeb.admin.ch/fr/securite-de-linformation), [FAQ OFCS sur l’obligation de signaler](https://www.bacs.admin.ch/fr/faq-concernant-obligation-de-signaler), [incidents à signaler](https://www.bacs.admin.ch/fr/que-faut-il-signaler).

## Activation des engagements réels

Le mode institutionnel conserve MFA et PostgreSQL avec TLS vérifié. Les nouveaux engagements réels restent désactivés tant que l’exploitant ne configure pas `REAL_OPERATIONS_ENABLED=true`. Dans chaque dossier réel, le commandement ou l’administrateur renseigne et approuve le **Cadre du dossier**. La validation enregistre l’acteur et la date. Une fiche retirée ou dont la date de réexamen est dépassée bloque les écritures métier et les exports JSON. La lecture autorisée reste possible ; le réexamen administratif reste accessible après clôture.

Cette barrière n’analyse pas la véracité du texte saisi. L’autorisation de production relève d’une décision institutionnelle documentée, après recette métier, sécurité, protection des données, exploitation et contrat. Les modes démonstration interdisent les engagements réels, quelle que soit cette variable.

### Passage de 0.1 à 0.2

Sauvegarder et tester la restauration avant migration. Exécuter `npm run migrate` avec le rôle propriétaire, puis les droits de `docs/postgres-grants.sql`. Déployer ensemble l’API et l’interface : l’export passe de GET à POST avec un objet `{purpose, recipient}` et le jeton CSRF. Les anciens ordres restent lisibles ; leur conversion OIMDE nécessite une relecture humaine. Les anciens dossiers réels demandent un cadre validé avant de nouvelles écritures.

Les nouvelles traces de modification des fiches contiennent les noms des champs modifiés et leurs empreintes globales avant/après, sans recopier les valeurs métier. Les traces d’administration, de création de dossier et de diffusion contiennent toujours certaines métadonnées : l’audit reste une donnée protégée. Les traces 0.1 existantes peuvent contenir les valeurs avant/après ; elles ne sont pas réécrites. La chaîne ne remplace pas un archivage WORM ni une collecte indépendante. Les impressions natives, captures d’écran et copies manuelles ne sont pas empêchées ou toutes tracées : ce logiciel n’est pas une solution de prévention des fuites.

## Fiche de recette à compléter

- Institution responsable, sponsor métier et périmètre du pilote : à désigner.
- Responsable exploitation/sécurité et contact protection des données : à désigner.
- Classification, tâches légales, catégories autorisées et catégories exclues : à approuver.
- Matrice d’habilitations, revue périodique et départs des utilisateurs : à approuver.
- Hébergement, lieux de traitement, chiffrement disques/sauvegardes, contrat de sous-traitance : à documenter.
- RPO/RTO, restauration observée, continuité et fonctionnement dégradé : à mesurer.
- Analyse des risques/AIPD, test d’intrusion et traitement des réserves : à réaliser.
- Rétention, archives et traitement des demandes individuelles : à valider.
- Recette des signes, de la terminologie et du circuit de validation avec les aides à la conduite genevoises : à réaliser.

## Procédure d’incident proposée

Identifier l’heure de découverte, préserver les éléments de preuve, limiter les accès compromis et contacter immédiatement les responsables désignés. Qualifier confidentialité, intégrité et disponibilité, données concernées et conséquences. Vérifier séparément les obligations cantonales, la LPD si applicable et le champ de la LSI/OFCS ; ne pas substituer un délai générique RGPD aux règles suisses. Documenter les notifications, mesures, restauration et retour d’expérience. Aucun envoi automatique aux autorités n’est implémenté.

## Doctrine PCi

Les ordres structurés reprennent **Orientation, Intention, Mission, Dispositions particulières, Emplacements** du formulaire OIMDE OFPP. L’échéance et le responsable servent au suivi interne, sans déclencher une transmission radio. Les signes sont les SVG officiels ; les fichiers nommés « exemple » restent consultables comme références mais ne sont pas utilisables comme signes autonomes. Les coordonnées MN95 utilisent les formules approchées swisstopo pour la navigation, pas une transformation cadastrale de précision. La validation terrain reste nécessaire.

Sources : [aide à la conduite OFPP](https://www.babs.admin.ch/fr/aide-a-la-conduite-de-la-protection-civile), [documents de formation](https://www.babs.admin.ch/fr/documents-de-formation), [formulaire OIMDE](https://www.babs.admin.ch/dam/fr/sd-web/a2VQyjrJLQbX/FiBS_HiForm_Auftrag_OAABS-fr.docx), [formules swisstopo](https://www.swisstopo.admin.ch/dam/fr/sd-web/KLRCX9XIdXDu/ch1903wgs84-FR.pdf).
