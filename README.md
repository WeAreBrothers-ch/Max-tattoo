# Maxime — tatoueur

Site de Maxime, tatoueur en Suisse romande. Pages statiques, sans framework ni étape de build : on dépose le dossier tel quel chez l'hébergeur.

## Pages

| Fichier | Contenu |
| --- | --- |
| `index.html` | Accueil : le nom en très grand sur le fond animé, manifeste, pièces portées, flashs de la saison, du carnet à la peau, le studio |
| `flashs.html` | Flashs disponibles (ordre tiré au sort à chaque visite), déjà tatoués (tampon « Tatoué »), saisons passées, réserver |
| `tatouages.html` | Les pièces par thème (mains, bêtes, crânes, yeux), photos et vidéos, visionneuse plein écran |
| `processus.html` | Le carnet, l'encre, la séance, après : images et vidéos avec les mots de Maxime |
| `rendez-vous.html` | Écrire, ce qu'il faut écrire, déroulement, studio, soins, questions |
| `404.html` | Page introuvable (chemins depuis la racine : `<base href="/">`) |

## Direction

- **Fond** : brume et gravure rouge sang en WebGL (`js/fond*.js`), derrière toutes les pages. La gravure affleure en permanence dans la brume et s'avive sous la lumière : elle suit la souris ; sur téléphone, rien ne suit le doigt, une lanterne se promène seule lentement (`js/fond-pointeur.js`) et reprend son trajet d'une page à l'autre. Pas de rayons. Quand le menu s'ouvre, la gravure remonte pleinement. D'une page à l'autre, la brume continue son chemin au lieu de repartir du noir.
- **Typographie** : IM Fell English (romain, italique) et IM Fell English SC (petites capitales), licence OFL. Grands titres qui prennent toute la largeur, chiffres romains, filets fins, lettrine rouge.
- **Menu** : table des matières plein écran (`<dialog>`) ; les chapitres montent un à un, l'emblème blanc du chapitre apparaît (en haut sur téléphone, à droite sur ordinateur).

## Téléphone d'abord

Chaque disposition est d'abord pensée pour le pouce, puis élargie ; rien n'est une version d'ordinateur rétrécie. Calibré de 320 à 430 px de large, debout et à l'horizontale.

- **Barre du haut** (téléphone et tablette) : le nom à gauche, le son et Menu à droite, comme l'en-tête d'ordinateur. Dans le menu, « Fermer » prend la place exacte de « Menu ».
- **Accueil** : la couverture tient dans l'écran, le nom posé en bas de l'écran. Les pièces forment une rangée à glisser, comme sur la page Tatouages.
- **Rangées à glisser** (pièces de l'accueil, tatouages par thème, flashs, pages du carnet, crayon → encre, pièces cicatrisées) : une œuvre par geste, la suivante dépasse pour inviter à glisser, un compteur « 2 / 5 » et un filet suivent le doigt. Dès 768 px, les mêmes œuvres redeviennent une grille régulière (3 colonnes, 4 sur ordinateur), toutes au format 3 / 4.
- **Processus** : les vidéos verticales passent en « stories » d'un bord à l'autre, la phrase de Maxime posée dessus.
- **Visionneuse** : l'œuvre grandit depuis sa vignette ; on glisse de l'une à l'autre, on la tire vers le bas pour la reposer, et elle retourne à sa place dans la rangée.
- **Retour du téléphone** : le bouton ou le geste « retour » referme le menu ou la visionneuse au lieu de quitter la page.
- **Animations** : courtes sur téléphone (on y fait défiler vite), aucune ne fait attendre le pouce ; les rangées se dévoilent d'un bloc. D'une page à l'autre, la barre du haut ne bouge pas. Zones tactiles de 44 px, marges de sécurité (encoche).
- **Tablette et ordinateur** : grille de 12 colonnes dès 768 px, photos en rangées régulières ; dès 1024 px, en-tête fixe à la place de la barre.

## Structure

```
├── index.html · flashs.html · tatouages.html · processus.html · rendez-vous.html · 404.html
├── favicon.ico · favicon.svg · apple-touch-icon.png · site.webmanifest · robots.txt
├── css/
│   ├── styles.css        point d'entrée, importe les autres
│   ├── reset.css
│   ├── base.css          polices, couleurs, liens, boutons, mouvement réduit
│   ├── fond.css          canevas du fond animé + repli fixe sans WebGL
│   ├── entete.css        en-tête (le nom seul sur téléphone, bandeau fixe sur ordinateur)
│   ├── barre.css         barre du haut (téléphone et tablette)
│   ├── menu.css          menu plein écran et ses animations
│   ├── mise-en-page.css  grille, sections, têtes de page, sommaires, révélations
│   ├── oeuvres.css       cadres, légendes, rangées à glisser, grilles de photos, planches, tampon, pensées
│   ├── accueil.css       ouverture, manifeste, bande de flashs, étapes, studio
│   ├── pages.css         fiches de flashs, registre, déroulé, stories, crayon → encre, canaux, questions, 404
│   ├── visionneuse.css   œuvres en grand
│   └── pied.css
├── js/
│   ├── main.js           point d'entrée (module)
│   ├── fond.js · fond-gl.js · fond-shader.js · fond-pointeur.js   le fond animé
│   ├── menu.js           ouverture et fermeture du menu, emblèmes
│   ├── couche.js         le « retour » du téléphone referme le menu ou la visionneuse
│   ├── entete.js         en-tête qui se retire (ordinateur), petit nom de l'accueil
│   ├── defileur.js       rangées à glisser : compteur et filet
│   ├── revele.js         apparition des images et des textes au défilement
│   ├── visionneuse.js    œuvres en grand : envol depuis la vignette, glisser, tirer vers le bas, flèches, Échap
│   ├── melange.js        ordre aléatoire des flashs disponibles
│   └── video.js          vidéos lues seulement quand elles sont à l'écran
├── assets/
│   ├── img/              photos (tt-), flashs (fl-), carnet (cn-), studio (st-), emblèmes (em-*.webp, fond transparent), icônes, image de partage
│   ├── video/            extraits MP4 de 9 s + image d'attente
│   └── fonts/            IM Fell English
└── tools/
    └── build-preview.py  version tout-en-un pour un hébergement de maquette
```

## Placer une œuvre

Dans une galerie de photos, une œuvre n'a pas de placement à choisir : la grille les aligne toutes au même format.

```html
<div class="grille galerie galerie--defile defileur" data-visionneuse data-defileur="Mains">
  <figure class="oeuvre" data-revele="image">
    <div class="cadre"><img class="photo" src="assets/img/tt-dague.jpg" alt="…" loading="lazy" decoding="async" width="675" height="900" /></div>
    <figcaption class="legende"><span class="legende-titre">Main à la dague</span><span class="legende-lieu cap">Cuisse</span></figcaption>
  </figure>
</div>
```

- Sur téléphone, une rangée à glisser ; dès 768 px, une grille de 3 puis 4 colonnes, toutes les images en 3 / 4 (les vidéos verticales sont recadrées).
- Hors galerie (manifeste, studio, flashs), `--c` / `--h` placent un bloc sur 6 colonnes au téléphone, `--cd` / `--hd` sur 12 colonnes dès 768 px.
- `--r` sur le cadre : format hors galerie (`3 / 4` par défaut, `9 / 16`, `2 / 3`, `1 / 1`).
- `oeuvre--plein` : l'image touche les deux bords sur téléphone. `cadre--arche` : plein cintre.
- Dans un bloc `data-visionneuse`, chaque œuvre s'ouvre en grand ; la légende est reprise dans la visionneuse.
- Une vidéo : `<video data-autoplay muted loop playsinline preload="none" poster="…">` avec un `aria-label`.

## Conventions

- Les vidéos sont muettes, en boucle, et ne tournent qu'à l'écran. Mouvement réduit demandé : pas d'animation, vidéos à l'arrêt, fond en image fixe.
- Les révélations ne cachent que ce qui est sous l'écran au chargement ; sans script, tout est visible.
- Le fond est plafonné (30 images/s, résolution limitée, pause quand l'onglet est caché). Sans WebGL, la gravure fixe s'affiche en CSS. Il faut servir le site en HTTP (la texture ne charge pas en `file://`).
- En-tête, barre du haut, menu et pied sont identiques sur toutes les pages : une modification se reporte dans chaque fichier HTML.

## Lancer en local

```
python3 -m http.server 8000
```

puis ouvrir `http://localhost:8000/`.

## À compléter avant la mise en ligne

- **Instagram et e-mail de Maxime** : les liens sont marqués `data-a-completer="instagram"` et `data-a-completer="e-mail"` (menu, pied de page, page Rendez-vous). Remplacer leur `href="#"` par l'adresse du compte et par `mailto:…`.
- **Adresse du site** : une fois le domaine connu, passer `og:image` en adresse absolue (`https://…/assets/img/partage.jpg`) pour les aperçus de partage.
- Contenus à relire avec Maxime : notes de la page Processus (écrites dans sa voix), tailles et emplacements des flashs, saisons passées, date de mise à jour du catalogue.
