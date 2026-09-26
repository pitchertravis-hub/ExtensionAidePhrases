# ZenText · Phrase - TP

Extension Chrome : phrases prêtes à copier, rangées par listes et rubriques, et générateur de chemins de menus du logiciel ID.

Rien à installer : pas de Node, pas de npm, pas d'étape de construction. Le dossier est l'extension.

## Mettre l'extension dans Chrome

**Pour l'utiliser ou la tester**
1. Ouvrir `chrome://extensions` et activer le **Mode développeur**.
2. Cliquer **Charger l'extension non empaquetée** et choisir ce dossier.
3. Après une modification, cliquer l'icône ↻ de l'extension.

**Pour la publier sur le Chrome Web Store**
1. Zipper le contenu du dossier (sans `.git` ni `README.md`).
2. Dans le `manifest.json` du zip, retirer les champs `key` et `update_url` : le Web Store les refuse. Il garde lui-même l'identifiant de l'extension.
3. Envoyer le zip depuis le tableau de bord développeur du Web Store.

Le champ `key` sert au chargement non empaqueté : il garde le même identifiant d'extension, donc les mêmes données enregistrées.

## Import et export

Menu **Réglages** (icône curseurs, en haut à droite) :
- **Exporter JSON** : sauvegarde complète, à réimporter telle quelle.
- **Exporter CSV** : colonnes `Liste ; Rubrique ; Ordre ; Phrase`, s'ouvre directement dans Excel.
- **Importer** : accepte un `.json` (export ZenText, y compris de la v2.5) ou un `.csv` avec les mêmes colonnes. Les données sont ajoutées aux vôtres, rien n'est effacé, les phrases déjà présentes ne sont pas dupliquées.

Une sauvegarde JSON est aussi téléchargée automatiquement à l'ouverture si la dernière date de plus de 7 jours.

## Fichiers

```
manifest.json
popup.html              les 3 vues (160 / 775 / 310 px) et les icônes
css/tokens.css          couleurs clair / sombre, police
css/app.css             mise en page et composants
js/theme.js             applique le thème avant l'affichage
js/main.js              démarrage
js/app.js               passage d'une vue à l'autre, copie
js/store.js             données (localStorage, mêmes clés qu'en v2.5)
js/views/               rubriques.js, phrases.js, navigation-id.js
js/ui/                  dialog.js (<dialog>), menu.js (popover), toast.js
js/core/                text.js, csv.js, backup.js, voice.js
js/data/id-menus.js     catalogue des menus ID (A à I)
lib/Sortable.min.js     glisser-déposer (SortableJS 1.15.6, MIT)
fonts/                  Manrope (licence OFL)
icons/
```
