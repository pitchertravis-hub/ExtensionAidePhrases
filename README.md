# TPhrase

Extension Chrome : phrases prêtes à copier, rangées par listes et rubriques, et générateur de chemins de menus du logiciel ID.

Rien à installer : pas de Node, pas de npm, pas d'étape de construction. Le dossier est l'extension.

## Utilisation

- **Une seule fenêtre** : rubriques à gauche, phrases à droite, onglet **Navigation ID** en haut.
- **Recherche unique** (en haut) : noms de rubriques, texte des phrases et menus ID, sans tenir compte des accents.
- **Un clic sur une phrase la copie.** Le crayon (ou `E`) sert à la modifier, l'étoile (ou `F`) à la mettre en favori.
- **Champs à remplir** : écrivez `{Nom}`, `{Dossier}`… dans une phrase ; un petit formulaire s'ouvre à la copie.
  `{date}`, `{heure}`, `{jour}` et `{date+2}` se remplissent seuls.
- **Favoris** en tête de colonne, tri **Plus utilisées** dans chaque rubrique.
- **Navigation ID** en trois colonnes, avec les 5 derniers chemins en raccourci.
- **Rédiger** : on tape ou on dicte un brouillon, **Reformuler** (ou `Ctrl+Entrée`) le corrige et le rend professionnel
  (vouvoiement, formules de politesse). Le résultat se retouche, se copie ou se garde comme phrase dans une rubrique.
  L'IA est celle de Chrome (Prompt API) et tourne sur l'ordinateur : le texte à reformuler n'est pas envoyé sur Internet.
  Le modèle se télécharge une fois, au premier clic sur Reformuler. L'onglet n'apparaît que si Chrome et l'ordinateur
  le permettent : Chrome 149 ou plus récent (français pris en charge), Windows 10/11, macOS 13+ ou Linux,
  22 Go libres sur le disque, et 16 Go de mémoire (4 cœurs) ou une carte graphique de plus de 4 Go.
  La dictée (micro) utilise la reconnaissance vocale de Chrome, qui peut passer par les serveurs de Google.
- **Apparence** (Réglages → Apparence), en deux onglets :
  **Couleurs** : thèmes prêts, ou **Perso** avec deux couleurs au choix (bandeau et accent) et un dégradé optionnel ; le reste du thème, clair et sombre, en est déduit.
  **Affichage** : taille du texte, densité (compacte pour voir plus de phrases), coins, 17 polices, 11 motifs de fond,
  et largeur de la colonne des rubriques. Elle se règle avec le curseur du menu ou en glissant son bord droit.
- **Deux formats** : fenêtre 780 × 560 (clic sur l'icône) ou **panneau latéral** qui reste ouvert
  (Réglages → Ancrer sur le côté).

### Clavier

| Touche | Action |
|---|---|
| `Alt+Z` | Ouvrir TPhrase (modifiable dans `chrome://extensions/shortcuts`) |
| `/` | Aller dans la recherche |
| `↑` `↓` | Choisir une phrase |
| `Entrée` | Copier la phrase choisie |
| `E` / `F` / `N` | Modifier / favori / nouvelle phrase |
| `Échap` | Vider la recherche, annuler une modification |
| `Ctrl+Entrée` | Enregistrer une modification |

## Mettre l'extension dans Chrome

**Pour l'utiliser ou la tester**
1. Ouvrir `chrome://extensions` et activer le **Mode développeur**.
2. Cliquer **Charger l'extension non empaquetée** et choisir ce dossier.
3. Après une modification, cliquer l'icône ↻ de l'extension.

**Pour la publier sur le Chrome Web Store**
1. Zipper le contenu du dossier (sans `.git` ni `README.md`).
2. Dans le `manifest.json` du zip, retirer les champs `key` et `update_url` : le Web Store les refuse. Il garde lui-même l'identifiant de l'extension.
3. Envoyer le zip depuis le tableau de bord développeur du Web Store.
4. Dans la fiche et l'onglet Confidentialité : indiquer que l'extension utilise l'IA intégrée à Chrome, en local,
   et qu'aucune donnée n'est collectée. L'usage de l'IA doit respecter la
   [Generative AI Prohibited Use Policy](https://policies.google.com/terms/generative-ai/use-policy) de Google.

Le champ `key` sert au chargement non empaqueté : il garde le même identifiant d'extension, donc les mêmes données enregistrées.

Chrome 116 ou plus récent est nécessaire (panneau latéral).

## Import et export

Menu **Réglages** (icône curseurs, en haut à droite) :
- **Exporter JSON** : sauvegarde complète, à réimporter telle quelle.
- **Exporter CSV** : colonnes `Liste ; Rubrique ; Ordre ; Phrase`, s'ouvre directement dans Excel.
- **Importer** : accepte un `.json` (export TPhrase ou ZenText, y compris de la v2.5) ou un `.csv` avec les mêmes colonnes. Les données sont ajoutées aux vôtres, rien n'est effacé, les phrases déjà présentes ne sont pas dupliquées.

Une sauvegarde JSON est aussi téléchargée automatiquement à l'ouverture si la dernière date de plus de 7 jours.

## Fichiers

```
manifest.json
popup.html              fenêtre et panneau latéral (même page)
css/tokens.css          couleurs clair / sombre, police
css/app.css             mise en page (large ≥ 620 px, étroite en dessous)
css/palettes.css        palettes du menu Apparence
css/look.css            fenêtre du menu Apparence
css/affichage.css       réglages d'affichage (taille, densité, coins, police, motif, largeur de la colonne)
css/fonts.css           polices proposées (fichiers dans fonts/)
js/theme.js             thème et format avant l'affichage
js/main.js              démarrage, recherche, clavier, réglages
js/state.js             état de l'interface
js/store.js             données (localStorage, mêmes clés qu'en v2.5)
js/views/               sidebar.js, phrases.js, navigation-id.js, rediger.js
js/ui/                  dialog.js, menu.js, toast.js, phrase-text.js
js/core/                text.js, fields.js, stats.js, csv.js, backup.js, voice.js, ai.js
js/data/id-menus.js     catalogue des menus ID (A à I)
lib/Sortable.min.js     glisser-déposer (SortableJS 1.15.6, MIT)
fonts/                  Manrope et les polices du réglage Police (licence OFL, voir fonts/POLICES.txt)
icons/
```
