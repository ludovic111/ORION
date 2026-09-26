# PC en valise : orion aic sans internet

> Un petit ordinateur dans une valise, son propre Wi-Fi, et tous les postes du PC travaillent ensemble sur la même session, sans internet.

Ce guide s’adresse à la personne qui prépare le matériel du poste de conduite. Il ne demande pas d’être informaticien : chaque commande est à recopier telle quelle. Il complète la section « Réseau local sans internet » du [README](../README.md) et la section LAN de [SECURITY.md](../SECURITY.md).

Les prix sont indicatifs (Suisse, 2026), pour du matériel acheté par l’organisation. Aucun modèle n’est imposé.

## Le principe

1. Un **ordinateur serveur** (un Raspberry Pi 5, ou un vieil ordinateur portable) lance `npm run lan`.
2. Il crée ou rejoint un **Wi-Fi du PC**, par exemple `PC-ORION`, protégé par un mot de passe.
3. Les tablettes, téléphones et ordinateurs du PC se connectent à ce Wi-Fi et ouvrent `https://10.42.0.1:4443` (l’adresse affichée par le serveur, aussi en QR code).
4. Chaque poste rejoint la session avec son **code de session**, comme sur internet.

Le serveur fait deux choses : il envoie l’application aux postes et il relaie les messages chiffrés entre eux. **Il ne garde aucune donnée de session** : chaque poste a sa copie complète, chiffrée. Si le serveur s’arrête, les postes continuent à travailler seuls et se resynchronisent quand il revient.

### Ce que fait exactement `npm run lan`

- Construit l’application (`npm run build`), puis lance `server/lan.mjs`.
- Sert l’application en **HTTPS** sur le port **4443** de toutes les interfaces réseau (autre port : `--port 4444` ou variable `PORT`).
- Crée au premier lancement un **certificat auto-signé** dans le dossier `.lan/` (valable 2 ans, renouvelé au démarrage quand il expire ou qu’une nouvelle adresse apparaît). HTTPS est obligatoire : sans lui, le navigateur refuse le chiffrement.
- Affiche les adresses, l’**empreinte SHA-256** du certificat, sa date de fin et un **QR code** par adresse. `--no-qr` retire les QR codes.
- `npm run lan:serve` démarre sans reconstruire (application déjà construite).

### Avec et sans internet

| Fonction                                                          | Sans internet                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Journal, messages, moyens, équipe, radio, contacts, agenda        | Oui                                                                                |
| Synchronisation entre les postes du Wi-Fi                         | Oui (relais local)                                                                 |
| Impression et PDF                                                 | Oui (depuis le navigateur de chaque poste)                                         |
| Sauvegarde chiffrée sur chaque poste, exports `.orionaic`         | Oui                                                                                |
| Carte : objets, dessins, signes, import KML / KMZ / GeoJSON / GPX | Oui                                                                                |
| Carte : fond (swisstopo, OpenStreetMap)                           | Seulement les zones **déjà affichées** sur ce poste (voir « Préparer les cartes ») |
| Recherche de lieu (`api3.geo.admin.ch`)                           | Non. Les coordonnées tapées fonctionnent toujours.                                 |
| Météo (prévisions Open-Meteo)                                     | Non                                                                                |

## Matériel

| Élément                                                                          | Rôle                                                     | Prix indicatif (CHF) |
| -------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------- |
| Raspberry Pi 5, 8 Go                                                             | Le serveur                                               | 95                   |
| Alimentation officielle USB-C 27 W                                               | Secteur, au PC ou au dépôt                               | 15                   |
| Boîtier avec ventilateur (boîtier officiel)                                      | Protection, refroidissement                              | 15                   |
| Carte microSD 64 Go classe A2                                                    | Système et application                                   | 15–20                |
| ou SSD (M.2 HAT+ et SSD NVMe, ou SSD USB)                                        | Plus robuste qu’une carte microSD, démarrage plus rapide | 40–60                |
| Pile RTC pour Pi 5 (optionnelle)                                                 | Garde l’heure sans internet                              | 5                    |
| Routeur Wi-Fi de voyage (optionnel, p. ex. GL.iNet)                              | Wi-Fi plus solide, plus d’appareils, plus de portée      | 40–90                |
| Batterie externe USB-C PD, 20 000 mAh ou plus, ≥ 27 W (45 W pour deux appareils) | Fonctionnement sans secteur                              | 50–80                |
| Imprimante laser Wi-Fi / réseau (ou celle du PC)                                 | Fiches et rapports                                       | 120–200              |
| Câbles : Ethernet 2 m, USB-C courts                                              | Préparation, routeur, batterie                           | 10–20                |
| Valise étanche avec mousse (type Peli)                                           | Transport, protection                                    | 50–150               |
| Étiquettes, fiche plastifiée (Wi-Fi, adresse, empreinte)                         | Mise en service rapide                                   | 10                   |

**Total** : environ **CHF 250** pour un kit minimal (Pi, carte microSD, batterie, valise simple, sans imprimante ni routeur) à environ **CHF 750** pour un kit complet (SSD, routeur de voyage, imprimante, valise renforcée). Les tablettes et ordinateurs des postes ne sont pas comptés : ce sont ceux du PC.

### Variante : un vieil ordinateur portable (CHF 0)

Un portable Windows, macOS ou Linux qui ne sert plus fait très bien l’affaire : il a déjà son écran, sa batterie et son Wi-Fi. Il suffit d’y installer Node.js et orion aic (mêmes étapes que ci-dessous) et de créer le Wi-Fi du PC (voir « Le Wi-Fi du PC »). Désactiver la mise en veille : un portable qui s’endort coupe le Wi-Fi et le relais.

## Installation (une seule fois, avec internet)

### 1. Préparer le système du Raspberry Pi

1. Sur un ordinateur, installer **Raspberry Pi Imager** (raspberrypi.com/software).
2. Choisir l’appareil **Raspberry Pi 5**, le système **Raspberry Pi OS Lite (64-bit)** et la carte microSD (ou le SSD).
3. Dans les réglages proposés par Imager, avant d’écrire :
   - nom d’hôte : `pc-orion` ;
   - utilisateur : `orion` et un mot de passe (le noter dans le classeur du matériel, pas sur la valise) ;
   - pays du Wi-Fi : **CH** (sans pays, le Wi-Fi reste bloqué) ;
   - fuseau horaire `Europe/Zurich`, clavier `ch` ;
   - activer SSH (pour l’administrer depuis un autre ordinateur).
4. Écrire, insérer la carte dans le Pi, brancher un **câble Ethernet** vers la box internet, puis l’alimentation.
5. Se connecter : écran et clavier sur le Pi, ou depuis un ordinateur du même réseau `ssh orion@pc-orion.local`.
6. Mettre à jour :

```sh
sudo apt update && sudo apt full-upgrade -y
```

### 2. Installer Node.js (version 22.18 ou plus récente)

```sh
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # doit afficher v24.x (au moins v22.18)
```

Autre possibilité : l’archive officielle « Linux ARM64 » de nodejs.org, décompressée dans `/usr/local`.

### 3. Copier orion aic

Le code source de la version en service est publié avec le site :

```sh
mkdir ~/orion-aic && cd ~/orion-aic
curl -fsSLO https://orionaic.xyz/source/orion-aic-source.tar.gz
tar -xzf orion-aic-source.tar.gz && rm orion-aic-source.tar.gz
```

Ou, avec git : `sudo apt install -y git && git clone https://github.com/ludovic111/orion-aic.git ~/orion-aic`.

### 4. Installer et essayer

```sh
cd ~/orion-aic
npm ci          # télécharge les dépendances (internet nécessaire)
npm run lan     # construit puis démarre
```

Le terminal affiche les adresses, l’empreinte et un QR code. Depuis un ordinateur du même réseau, ouvrir l’adresse affichée : l’application doit apparaître après l’avertissement de certificat (voir « Premier accès »). `Ctrl+C` arrête le serveur.

## Le Wi-Fi du PC

Tous les postes doivent être sur le même réseau que le serveur. Quatre façons de le créer ; la première suffit pour un PC de quelques postes.

> **Toujours la même adresse.** Pour le navigateur, `https://10.42.0.1:4443` et `https://192.168.8.10:4443` sont deux sites différents : la sauvegarde chiffrée d’un poste, les tuiles de carte en cache et l’acceptation du certificat sont liées à l’adresse exacte (IP et port). Choisir une adresse une fois pour toutes et ne plus la changer.

### a. Point d’accès du Raspberry Pi (NetworkManager)

Raspberry Pi OS Bookworm gère le réseau avec NetworkManager. Une commande crée le point d’accès (remplacer le mot de passe, 12 caractères au moins) :

```sh
sudo nmcli device wifi hotspot ifname wlan0 con-name PC-ORION ssid PC-ORION band bg password 'mot-de-passe-du-wifi'
```

Puis le rendre permanent, avec une adresse fixe et le chiffrement WPA2 seul (le plus compatible) :

```sh
sudo nmcli connection modify PC-ORION \
  connection.autoconnect yes connection.autoconnect-priority 100 \
  ipv4.method shared ipv4.addresses 10.42.0.1/24 \
  802-11-wireless-security.proto rsn \
  802-11-wireless-security.pairwise ccmp 802-11-wireless-security.group ccmp
sudo nmcli connection up PC-ORION
```

- Le Pi distribue lui-même les adresses (DHCP) : `10.42.0.x`. Son adresse reste `10.42.0.1`.
- Le Wi-Fi intégré du Pi convient à **une dizaine d’appareils** dans la même salle. Au-delà, ou pour plusieurs locaux, prendre un routeur de voyage (d).
- Si le câble Ethernet du Pi est branché sur une box internet, les appareils du Wi-Fi `PC-ORION` ont aussi internet (partage de connexion) : c’est le montage idéal pour **préparer les cartes** (voir plus bas).
- Revenir à l’état initial : `sudo nmcli connection delete PC-ORION`.

### b. hostapd et dnsmasq (sans NetworkManager)

Pour un système sans NetworkManager : `sudo apt install hostapd dnsmasq`, une adresse fixe `10.42.0.1/24` sur `wlan0`, puis :

```ini
# /etc/hostapd/hostapd.conf
interface=wlan0
country_code=CH
ssid=PC-ORION
hw_mode=g
channel=6
wpa=2
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
wpa_passphrase=mot-de-passe-du-wifi
```

```ini
# /etc/dnsmasq.d/pc-orion.conf
interface=wlan0
dhcp-range=10.42.0.20,10.42.0.200,255.255.255.0,12h
```

`sudo systemctl unmask hostapd && sudo systemctl enable --now hostapd dnsmasq`. Si NetworkManager est présent, lui retirer `wlan0` d’abord (`sudo nmcli device set wlan0 managed no`). Réservé aux habitués de Linux : la méthode (a) est plus simple.

### c. Ordinateur portable comme serveur

- **Windows 10 / 11** : Paramètres → Réseau et Internet → **Point d’accès mobile**. Nom et mot de passe dans « Modifier ». Adresse du portable : `192.168.137.1`, soit `https://192.168.137.1:4443`. Au premier lancement de Node.js, Windows demande l’accès au réseau : autoriser les **réseaux privés**. Limites : 8 appareils ; selon la version, Windows refuse d’activer le point d’accès sans connexion internet à partager : prendre alors un routeur de voyage.
- **macOS** : le « Partage Internet » ne crée un Wi-Fi que s’il partage une autre connexion active ; il n’est pas fiable sans internet. Brancher le Mac sur un routeur de voyage.
- **Linux** : même commande `nmcli` que pour le Raspberry Pi (a).

### d. Routeur Wi-Fi de voyage

Un petit routeur (GL.iNet ou équivalent, alimenté en USB-C) crée le Wi-Fi ; le serveur y est branché par câble Ethernet.

1. Dans l’interface du routeur (`192.168.8.1` pour GL.iNet) : nom du Wi-Fi `PC-ORION`, mot de passe WPA2/WPA3, mot de passe administrateur changé.
2. **Réserver une adresse fixe** pour le serveur (bail DHCP statique), par exemple `192.168.8.10`.
3. Brancher le serveur sur un port LAN du routeur. Adresse des postes : `https://192.168.8.10:4443`.

Avantages : plus d’appareils, meilleure portée, et le routeur peut prendre internet (partage de connexion d’un téléphone, Wi-Fi d’un bâtiment) pour la préparation ou quand internet revient.

## Démarrage automatique

Dans la valise, personne ne tape de commande : le serveur démarre avec le Pi. `npm run lan` reconstruit l’application à chaque démarrage (lent, et inutile) ; le service lance directement `node server/lan.mjs` sur l’application construite une fois.

```sh
cd ~/orion-aic
npm run build                       # une fois, puis après chaque mise à jour
sudo cp docs/orion-aic-lan.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now orion-aic-lan
```

Le fichier [`orion-aic-lan.service`](orion-aic-lan.service) suppose l’utilisateur `orion` et le dossier `/home/orion/orion-aic` ; les adapter sinon (`sudo nano /etc/systemd/system/orion-aic-lan.service`).

- Voir les adresses, l’empreinte et le QR code : `journalctl -u orion-aic-lan -o cat`.
- État : `systemctl status orion-aic-lan`. Arrêt : `sudo systemctl stop orion-aic-lan`.
- Mettre à jour orion aic (avec internet) : nouvelle archive source ou `git pull`, puis `npm ci && npm run build && sudo systemctl restart orion-aic-lan`. Après une mise à jour, chaque poste propose de recharger la page.

## Premier accès d’un poste

1. Connecter l’appareil au Wi-Fi `PC-ORION`. Le téléphone ou la tablette signale « pas d’accès à internet » : choisir **rester connecté**. Sur un téléphone, couper les données mobiles évite qu’il ne quitte ce Wi-Fi.
2. Scanner le QR code du serveur ou taper l’adresse (`https://10.42.0.1:4443`).
3. Le navigateur signale un **certificat non reconnu**. Afficher le détail du certificat et comparer l’**empreinte SHA-256** avec celle du serveur (terminal, journal du service ou fiche plastifiée). Si elle est identique, continuer vers le site. Cette étape n’a lieu qu’une fois par appareil et par navigateur.
4. Ajouter l’application à l’écran d’accueil (Safari : Partager → Sur l’écran d’accueil ; Chrome : Installer l’application).
5. Créer ou rejoindre la session avec le code de session.

Garder le dossier `.lan/` : l’effacer crée un nouveau certificat, avec une nouvelle empreinte, et chaque poste doit l’accepter de nouveau.

## Préparer les cartes (secteurs hors ligne)

Sans internet, le fond de carte n’affiche que les **tuiles déjà vues** par ce navigateur, sur cette adresse. Le service worker d’orion aic garde chaque tuile affichée (swisstopo ou OpenStreetMap), jusqu’à **4 000 tuiles par poste** ; au-delà, les plus anciennes sont retirées. Il n’y a pas de bouton « télécharger une zone » : on prépare un secteur en le **parcourant** à l’écran.

Chaque appareil garde son propre cache, lié à l’adresse du serveur : les tuiles vues sur `orionaic.xyz` ne servent pas sur `https://10.42.0.1:4443`. La préparation se fait donc **sur chaque poste, par l’adresse du serveur de la valise, avec internet**.

1. Brancher le câble Ethernet du Pi sur une box internet (ou donner internet au routeur de voyage). Les postes connectés à `PC-ORION` ont alors internet et l’adresse du serveur.
2. Sur chaque poste : ouvrir orion aic par l’adresse du serveur, module **Carte**.
3. Choisir le fond utile (Carte couleur, Vue aérienne…). **Nuit** utilise les tuiles de la Carte grise.
4. Parcourir le secteur **à chaque niveau de zoom utile**, du plus large au plus détaillé, en laissant chaque vue se charger entièrement. Une tuile non affichée ne sera pas disponible.
5. Recommencer pour un autre fond si nécessaire.
6. Débrancher internet et vérifier : le secteur doit s’afficher, zoom compris.

Ordre de grandeur, pour un fond, en Suisse :

| Zoom de la carte | Une tuile couvre | Secteur de 3 × 3 km |
| ---------------- | ---------------- | ------------------- |
| 13 (région)      | ≈ 3,4 km         | ≈ 4 tuiles          |
| 15 (commune)     | ≈ 850 m          | ≈ 16 tuiles         |
| 16 (quartier)    | ≈ 420 m          | ≈ 60 tuiles         |
| 17 (rue)         | ≈ 210 m          | ≈ 210 tuiles        |
| 18 (bâtiment)    | ≈ 105 m          | ≈ 820 tuiles        |

Un secteur de 3 × 3 km du zoom 12 au zoom 18 occupe environ 1 100 tuiles par fond : les 4 000 tuiles suffisent pour un secteur d’intervention avec deux fonds, ou pour une zone plus large sans le zoom 18. Après la préparation, éviter de naviguer ailleurs sur ce poste : les nouvelles tuiles pousseraient les plus anciennes dehors.

Hors ligne, un bandeau peut indiquer que le serveur du fond ne répond pas : c’est normal, les zones préparées restent affichées et les objets de la carte ne dépendent pas du fond.

### Données de partenaires

Le bouton d’import de la carte lit les fichiers **KML, KMZ, GeoJSON et GPX** (5 Mo au plus) : périmètres, itinéraires, points transmis par la police, les pompiers ou le canton. Ils deviennent des objets de la session, synchronisés et disponibles hors ligne. orion aic n’importe pas d’image de fond ni de GeoTIFF : le fond reste celui des tuiles en cache. Les signes personnalisés (PNG, JPEG, WebP, SVG) sont aussi stockés dans la session.

## Imprimer

L’impression part du **navigateur de chaque poste**, pas du serveur : il n’y a rien à installer sur le Raspberry Pi (pas de CUPS).

- Le plus simple : une **imprimante réseau** (Wi-Fi ou Ethernet) connectée au Wi-Fi `PC-ORION` ou au routeur de voyage. Les tablettes et ordinateurs récents la trouvent seuls (AirPrint, IPP Everywhere, Mopria), sans pilote.
- Autre possibilité : une imprimante USB branchée sur un **ordinateur portable** du PC, qui devient le poste d’impression (option « Imprimer aussi les entrées des autres postes », et au besoin Chrome en `--kiosk-printing`, voir le README).
- Faire une impression d’essai de chaque poste avant le départ. Emporter du papier et un toner de réserve.

## Alimentation

| Montage                            | Consommation moyenne | Batterie 20 000 mAh (≈ 60 Wh utiles) |
| ---------------------------------- | -------------------- | ------------------------------------ |
| Raspberry Pi 5 seul, Wi-Fi intégré | 4–8 W                | 7 à 12 h                             |
| Pi 5 + routeur de voyage           | 7–12 W               | 5 à 8 h                              |

- Une batterie USB-C PD de 27 W ou plus convient. Avec une batterie limitée à 5 V / 3 A, le Pi 5 démarre et signale une alimentation réduite : sans périphérique USB gourmand, il fonctionne normalement.
- Une batterie de 45 W avec deux sorties alimente le Pi et le routeur ensemble.
- Brancher le secteur dès qu’il est disponible : la batterie sert de relais pendant une coupure (la plupart des batteries continuent à alimenter pendant la recharge, mais pas toutes : l’essayer).
- Option : une carte d’alimentation sans interruption (« UPS HAT ») avec accus, qui arrête le Pi proprement quand la charge baisse.
- **Arrêt propre** : `sudo poweroff`, ou une pression courte sur le bouton d’alimentation du Pi 5. Attendre que la LED verte cesse de clignoter avant de débrancher. Couper le courant brutalement peut abîmer la carte microSD (un SSD y résiste mieux).

## Heure juste

Les heures du journal viennent de l’horloge de **chaque poste**. orion aic range les modifications dans l’ordre réel des événements (horloge logique hybride) : quelques minutes d’écart ne font rien perdre, mais une heure fausse s’affiche dans les heures des versions. Avant l’engagement, vérifier l’heure des tablettes et ordinateurs.

Sans internet, le Raspberry Pi ne peut pas se mettre à l’heure : il redémarre à l’heure de son dernier arrêt. Son horloge compte pour le certificat (dates de validité, renouvellement). Deux solutions :

- **Pile RTC** : le Pi 5 a un connecteur « BAT » pour une pile rechargeable (pile officielle Raspberry Pi RTC). Activer sa recharge en ajoutant `dtparam=rtc_bbat_vchg=3000000` à `/boot/firmware/config.txt`.
- **À la main** : `sudo date -s "2026-10-03 14:05"` (heure de Zurich).

## Sécurité

- **Mot de passe du Wi-Fi** : 12 caractères au moins, WPA2 ou WPA3, changé après chaque engagement où il a circulé. Il décide qui peut atteindre le serveur.
- **Code de session** : c’est lui qui ouvre les données. Un appareil sur le Wi-Fi sans le code ne voit que des messages chiffrés. Le transmettre de vive voix ou par le QR code de synchronisation, seulement aux postes autorisés.
- **Certificat auto-signé** : il chiffre la liaison, mais le navigateur ne peut pas savoir seul qu’il est authentique. D’où la vérification de l’empreinte au premier accès. Une empreinte différente de celle notée sans raison connue (certificat renouvelé, dossier `.lan/` effacé) : ne pas continuer.
- Le Raspberry Pi ne contient pas de données de session, mais il contient la clé du certificat (`.lan/`) : garder la valise sous contrôle, changer le mot de passe de l’utilisateur `orion`, ne pas ouvrir SSH sur un réseau étranger.
- orion aic n’est ni certifié ni homologué ; le choix du matériel et le droit de traiter les données appartiennent à l’organisation (voir [SECURITY.md](../SECURITY.md)).

## Liste de contrôle avant le départ

- [ ] Batterie externe, tablettes, téléphones et portables **chargés** ; chargeurs dans la valise.
- [ ] Serveur démarré sans câble ni internet : le Wi-Fi `PC-ORION` apparaît, l’adresse s’ouvre sur un poste.
- [ ] Tous les postes ont ouvert l’application une fois **par l’adresse du serveur** et accepté le certificat ; icône sur l’écran d’accueil.
- [ ] Secteurs de carte **préparés et vérifiés hors ligne** sur chaque poste qui affiche la carte.
- [ ] **Empreinte** du certificat et date de fin notées sur la fiche plastifiée, avec le nom du Wi-Fi et l’adresse (le mot de passe du Wi-Fi à part).
- [ ] Heure du Pi et des postes juste.
- [ ] Impression d’essai depuis chaque poste qui imprime ; papier et toner.
- [ ] Qui crée la session sur place et transmet le **code de session** : désigné.
- [ ] Copie de secours de la carte microSD (image) ou second support prêt.

## Dépannage

| Problème                                           | Cause probable                                                      | Que faire                                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Avertissement de certificat à chaque ouverture     | Adresse différente, ou certificat renouvelé                         | Toujours utiliser la même adresse ; comparer l’empreinte avec la fiche et l’accepter de nouveau si elle a été renouvelée. |
| L’empreinte a changé                               | Certificat expiré, nouvelle adresse, `.lan/` effacé                 | Vérifier sur le serveur (`journalctl -u orion-aic-lan -o cat`), mettre à jour la fiche, accepter sur chaque poste.        |
| Le Wi-Fi `PC-ORION` n’apparaît pas                 | Pays Wi-Fi absent, point d’accès inactif                            | `sudo raspi-config` → Localisation → WLAN Country `CH` ; `sudo nmcli connection up PC-ORION`.                             |
| Un appareil voit le Wi-Fi mais ne s’y connecte pas | Mot de passe, ancien appareil                                       | Retaper le mot de passe ; garder `band bg` et WPA2 (réglages ci-dessus).                                                  |
| Connecté au Wi-Fi, la page ne s’ouvre pas          | Le téléphone est passé sur les données mobiles, ou mauvaise adresse | Couper les données mobiles ; taper `https://` et le port `:4443`.                                                         |
| La page ne s’ouvre sur aucun poste                 | Serveur arrêté                                                      | `systemctl status orion-aic-lan` ; message « port déjà utilisé » : un autre serveur tourne déjà.                          |
| Poste « seul » alors que d’autres travaillent      | Code de session différent, ou relais injoignable                    | Vérifier le code ; recharger la page. Les modifications locales restent et partent à la reconnexion.                      |
| Fond de carte gris ou absent                       | Zone ou zoom non préparé sur ce poste                               | Travailler avec les objets et les coordonnées ; préparer le secteur la prochaine fois (avec internet).                    |
| Heures fausses dans le journal                     | Horloge d’un poste                                                  | Corriger l’heure du poste ; corriger au besoin l’heure des entrées déjà saisies.                                          |
| Le Pi redémarre seul ou affiche un éclair          | Alimentation trop faible                                            | Alimentation officielle 27 W ou batterie PD plus puissante ; câble USB-C court.                                           |
