#!/usr/bin/env python3
"""Construit les zips de TPhrase dans dist/ à partir du dossier de l'extension.

- NE-PAS-INSTALLER_TPhrase-<version>_pour-Chrome-Web-Store.zip : à envoyer au Web Store
  (manifest sans `key` ni `update_url`, que le Web Store refuse).
- TPhrase-<version>.zip : version de test, avec `key`, pour « Mettre a jour TPhrase.bat ».

Le contenu est identique d'une construction à l'autre (dates fixes, ordre trié) :
le zip ne change dans git que si l'extension change.

Usage : python3 outils/construire-zip.py
"""
import json
import zipfile
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DIST = RACINE / "dist"

# Ce qui part dans le zip : tout le reste (README, docs/, store/, outils/, .bat…) reste en dehors.
A_INCLURE = ["manifest.json", "popup.html", "css", "js", "lib", "fonts", "icons"]
DATE_FIXE = (2020, 1, 1, 0, 0, 0)


def fichiers():
    for nom in A_INCLURE:
        chemin = RACINE / nom
        if chemin.is_file():
            yield chemin
        else:
            yield from (f for f in chemin.rglob("*") if f.is_file())


def ecrire_zip(destination, manifest):
    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in sorted(fichiers(), key=lambda p: p.relative_to(RACINE).as_posix()):
            nom = f.relative_to(RACINE).as_posix()
            info = zipfile.ZipInfo(nom, DATE_FIXE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            donnees = manifest if nom == "manifest.json" else f.read_bytes()
            z.writestr(info, donnees)


def main():
    texte = (RACINE / "manifest.json").read_text(encoding="utf-8")
    manifest = json.loads(texte)
    version = manifest["version"]

    store = {k: v for k, v in manifest.items() if k not in ("key", "update_url")}
    store_json = (json.dumps(store, ensure_ascii=False, indent=3) + "\n").encode("utf-8")

    DIST.mkdir(exist_ok=True)
    for ancien in DIST.glob("*.zip"):
        ancien.unlink()

    zip_store = DIST / f"NE-PAS-INSTALLER_TPhrase-{version}_pour-Chrome-Web-Store.zip"
    zip_test = DIST / f"TPhrase-{version}.zip"
    ecrire_zip(zip_store, store_json)
    ecrire_zip(zip_test, texte.encode("utf-8"))
    for z in (zip_store, zip_test):
        print(f"{z.relative_to(RACINE)}  ({z.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
