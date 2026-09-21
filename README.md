# Maxime — tatoueur

Site vitrine de Maxime, tatoueur en Suisse romande. Quatre pages statiques, sans framework ni étape de build.

## Pages

| Fichier | Contenu |
| --- | --- |
| `index.html` | Accueil : intro, six tuiles, aperçu de chaque section, studio, infos |
| `flashs.html` | Catalogue de la saison : disponibles, déjà tatoués, saisons passées, réserver |
| `tatouages.html` | Pièces réalisées par thème, photos et vidéos |
| `processus.html` | Du carnet à la peau : carnet, encre, séance, après, avec les notes de Maxime |

## Structure

```
site/
├── index.html · flashs.html · tatouages.html · processus.html
├── css/
│   ├── styles.css      point d'entrée, importe les autres
│   ├── reset.css
│   ├── base.css        polices, variables, typographie, grille, textes court/long
│   ├── fond.css        gravure rouge sang révélée sous la souris
│   ├── header.css
│   ├── tiles.css       les six tuiles de l'accueil
│   ├── sections.css    sections numérotées et grilles de vignettes
│   └── footer.css
├── js/
│   ├── main.js         point d'entrée (module)
│   ├── fond.js         suivi de la souris / du pouce pour le halo
│   └── video.js        lecture des vidéos seulement quand elles sont visibles
├── assets/
│   ├── img/            photos, dessins, emblèmes, gravure de fond
│   ├── video/          extraits MP4 de 9 s + image d'attente
│   └── fonts/          Latin Modern (licence GUST, libre)
└── tools/
    └── build-preview.py   fabrique une version tout-en-un pour un hébergement de maquette
```

## Conventions

- Direction visuelle calquée sur l'index d'archives Whole Earth : noir, blanc, une seule famille de caractères, sections numérotées, grille de vignettes 2 / 4 / 5 colonnes.
- Chaque bloc de texte existe en deux versions : `.t-court` affichée sur téléphone, `.t-long` affichée à partir de 1024 px.
- Les vidéos sont muettes, en boucle, et ne tournent que lorsqu'elles sont à l'écran.
- Le fond interactif utilise des masques CSS : il faut servir le site en HTTP (les masques ne chargent pas en `file://`).

## Lancer en local

```
python3 -m http.server 8000
```

puis ouvrir `http://localhost:8000/`.

## Contenus à confirmer avec Maxime

- Notes de la page Processus (écrites dans sa voix, provisoires).
- Tailles, emplacements et disponibilités des flashs ; contenu des saisons passées.
- Liens Instagram et e-mail (vides), ville du studio.
