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

- **Fond** : brume, rayons et gravure rouge sang en WebGL (`js/fond*.js`), derrière toutes les pages. La gravure apparaît sous la souris, ou se promène seule sur téléphone. Quand le menu s'ouvre, la gravure entière remonte de la brume.
- **Typographie** : IM Fell English (romain, italique) et IM Fell English SC (petites capitales), licence OFL. Grands titres qui prennent toute la largeur, chiffres romains, filets fins, lettrine rouge.
- **Images en grand** : galeries éditoriales sur une grille de 6 colonnes (téléphone) et 12 colonnes (dès 768 px), avec des décalages verticaux. Toucher une œuvre l'ouvre en grand ; on glisse de l'une à l'autre.
- **Menu** : table des matières plein écran (`<dialog>`), les chapitres montent un à un, l'emblème blanc du chapitre survolé apparaît à droite.
- **Téléphone d'abord** : zones tactiles de 44 px, marges de sécurité (encoche), bandes à glisser pour les flashs, images pleine largeur.

## Structure

```
├── index.html · flashs.html · tatouages.html · processus.html · rendez-vous.html · 404.html
├── favicon.ico · favicon.svg · apple-touch-icon.png · site.webmanifest · robots.txt
├── css/
│   ├── styles.css        point d'entrée, importe les autres
│   ├── reset.css
│   ├── base.css          polices, couleurs, liens, boutons, mouvement réduit
│   ├── fond.css          canevas du fond animé + repli fixe sans WebGL
│   ├── entete.css        en-tête fixe (se retire en descendant, revient en remontant)
│   ├── menu.css          menu plein écran et ses animations
│   ├── mise-en-page.css  grille, sections, têtes de page, sommaires, révélations
│   ├── oeuvres.css       cadres, légendes, planches de flashs, tampon, pensées, parallaxe
│   ├── accueil.css       ouverture, manifeste, bande de flashs, étapes, studio
│   ├── pages.css         registre, déroulé, vis-à-vis, canaux, questions, 404
│   ├── visionneuse.css   œuvres en grand
│   └── pied.css
├── js/
│   ├── main.js           point d'entrée (module)
│   ├── fond.js · fond-gl.js · fond-shader.js · fond-pointeur.js · fond-balade.js   le fond animé
│   ├── menu.js           ouverture et fermeture du menu, emblèmes
│   ├── entete.js         en-tête qui se retire, petit nom de l'accueil
│   ├── revele.js         apparition des images et des textes au défilement
│   ├── visionneuse.js    œuvres en grand, glisser, flèches, Échap
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

Chaque œuvre d'une galerie choisit sa place avec des variables en ligne :

```html
<figure class="oeuvre" style="--c: 1 / span 3; --h: 3rem; --cd: 7 / span 3; --hd: 6rem" data-revele="image">
  <div class="cadre"><img class="photo" src="assets/img/tt-dague.jpg" alt="…" loading="lazy" decoding="async" width="675" height="900" /></div>
  <figcaption class="legende"><span class="legende-titre">Main à la dague</span><span class="legende-lieu cap">Cuisse</span></figcaption>
</figure>
```

- `--c` / `--cd` : colonnes sur téléphone (6) et dès la tablette (12). Sans valeur, toute la largeur.
- `--h` / `--hd` : décalage vertical, pour le rythme.
- `--r` sur le cadre : format (`3 / 4` par défaut, `9 / 16` pour les vidéos, `1 / 1`).
- `oeuvre--plein` : l'image touche les deux bords sur téléphone. `cadre--arche` : plein cintre. `data-parallaxe` sur le cadre : léger décalage au défilement.
- Dans un bloc `data-visionneuse`, chaque œuvre s'ouvre en grand ; la légende est reprise dans la visionneuse.
- Une vidéo : `<video data-autoplay muted loop playsinline preload="none" poster="…">` avec un `aria-label`.

## Conventions

- Les vidéos sont muettes, en boucle, et ne tournent qu'à l'écran. Mouvement réduit demandé : pas d'animation, vidéos à l'arrêt, fond en image fixe.
- Les révélations ne cachent que ce qui est sous l'écran au chargement ; sans script, tout est visible.
- Le fond est plafonné (30 images/s, résolution limitée, pause quand l'onglet est caché). Sans WebGL, la gravure fixe s'affiche en CSS. Il faut servir le site en HTTP (la texture ne charge pas en `file://`).
- En-tête, menu et pied sont identiques sur toutes les pages : une modification se reporte dans chaque fichier HTML.

## Lancer en local

```
python3 -m http.server 8000
```

puis ouvrir `http://localhost:8000/`.

## À compléter avant la mise en ligne

- **Instagram et e-mail de Maxime** : les liens sont marqués `data-a-completer="instagram"` et `data-a-completer="e-mail"` (menu, pied de page, page Rendez-vous). Remplacer leur `href="#"` par l'adresse du compte et par `mailto:…`.
- **Adresse du site** : une fois le domaine connu, passer `og:image` en adresse absolue (`https://…/assets/img/partage.jpg`) pour les aperçus de partage.
- Contenus à relire avec Maxime : notes de la page Processus (écrites dans sa voix), tailles et emplacements des flashs, saisons passées, date de mise à jour du catalogue.
