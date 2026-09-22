#!/usr/bin/env python3
"""
Construit une version « aperçu » du site pour l'hébergement de maquette :
CSS, JS et polices sont intégrés dans chaque page HTML, les images et vidéos
restent des fichiers à côté. Le site réel (index.html + css/ + js/) n'est pas
modifié.

Usage : python3 tools/build-preview.py <dossier de sortie>
"""

import base64
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "flashs.html", "tatouages.html", "processus.html"]
FONT_MIME = {".otf": "font/otf", ".woff2": "font/woff2", ".woff": "font/woff"}


def read_css(path: Path) -> str:
    """Lit un fichier CSS en résolvant récursivement les @import."""
    css = path.read_text(encoding="utf-8")

    def resolve_import(match: re.Match) -> str:
        return read_css(path.parent / match.group(1))

    css = re.sub(r'@import\s+url\("([^"]+)"\);', resolve_import, css)
    return css


def inline_fonts(css: str) -> str:
    """Remplace les polices locales par des data URI."""

    def to_data_uri(match: re.Match) -> str:
        font_path = SITE / "assets" / "fonts" / Path(match.group(1)).name
        mime = FONT_MIME.get(font_path.suffix, "application/octet-stream")
        encoded = base64.b64encode(font_path.read_bytes()).decode("ascii")
        return f'url(data:{mime};base64,{encoded})'

    return re.sub(r'url\("\.\./assets/fonts/([^"]+)"\)', to_data_uri, css)


def rebase_asset_paths(css: str) -> str:
    """Les chemins CSS sont relatifs à css/ ; dans la page ils sont relatifs à la racine."""
    return css.replace('url("../assets/', 'url("assets/')


def bundle_js() -> str:
    """Concatène les modules JS en un seul script sans import/export."""
    modules = ["fond-shader.js", "fond-gl.js", "fond-pointeur.js", "fond.js", "melange.js", "video.js"]
    parts = []
    for name in modules:
        source = (SITE / "js" / name).read_text(encoding="utf-8")
        source = re.sub(r"^import .*$", "", source, flags=re.MULTILINE)
        source = re.sub(r"^export\s+", "", source, flags=re.MULTILINE)
        parts.append(source)
    main = (SITE / "js" / "main.js").read_text(encoding="utf-8")
    main = re.sub(r"^import .*$", "", main, flags=re.MULTILINE)
    parts.append(main)
    return "(function () {\n" + "\n".join(parts) + "\n})();"


def build_page(name: str, css: str, js: str, out_dir: Path) -> None:
    html = (SITE / name).read_text(encoding="utf-8")
    html = html.replace('<link rel="stylesheet" href="css/styles.css" />', f"<style>\n{css}\n</style>")
    html = html.replace('<script type="module" src="js/main.js"></script>', f"<script>\n{js}\n</script>")
    (out_dir / name).write_text(html, encoding="utf-8")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage : build-preview.py <dossier de sortie>")
    out_dir = Path(sys.argv[1]).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    css = rebase_asset_paths(inline_fonts(read_css(SITE / "css" / "styles.css")))
    js = bundle_js()
    for page in PAGES:
        build_page(page, css, js, out_dir)
    print(f"Aperçu construit dans {out_dir} : {', '.join(PAGES)}")


if __name__ == "__main__":
    main()
