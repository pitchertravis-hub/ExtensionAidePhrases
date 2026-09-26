# Publier TPhrase sur le Chrome Web Store

Tous les textes à copier-coller dans le [tableau de bord développeur](https://chrome.google.com/webstore/devconsole),
dans l'ordre des onglets.

## 0. Avant de commencer

- Compte développeur Chrome Web Store (inscription unique de 5 $).
- Le zip **Web Store**, tout prêt dans [`dist/`](../dist/) (`NE-PAS-INSTALLER_TPhrase-x.y_pour-Chrome-Web-Store.zip`) :
  sans `key` ni `update_url`, sans `outils/`. Il est reconstruit à chaque push sur `main`.
  Il ne se charge jamais dans Chrome : il créerait une autre extension, vide.
  Le zip de test, lui, est refusé.
- La page `docs/confidentialite.html` en ligne à une adresse publique (voir § 3).
- Les images du dossier `store/` : `capture-1-phrases.png`, `capture-2-rediger.png`,
  `capture-3-navigation-id.png` (1280 × 800) et `promo-440x280.png`.

## 1. Onglet « Fiche Play Store » (Store listing)

**Titre** (repris du manifest) : TPhrase

**Résumé** (repris du manifest, 132 caractères max) :
> Phrases prêtes à copier, rangées par rubriques, chemins de menus du logiciel ID, et rédaction pro avec l'IA de Chrome.

**Description** :
> TPhrase garde vos phrases toutes prêtes, rangées par listes et rubriques, et les copie en un clic.
>
> • Phrases prêtes à copier : un clic copie la phrase. Des champs comme {Nom} ou {date} se remplissent au moment de copier.
> • Recherche unique, sans tenir compte des accents, dans les rubriques, les phrases et les menus du logiciel ID.
> • Favoris et tri « Plus utilisées ».
> • Navigation ID : trouvez et copiez le chemin d'un menu du logiciel ID en trois clics.
> • Rédiger : écrivez comme ça vient, l'IA intégrée à Chrome corrige et reformule le texte dans un ton professionnel. Le texte reste sur votre ordinateur. L'IA peut se tromper : relisez avant d'envoyer.
> • Fenêtre ou panneau latéral, raccourci Alt+Z, thème clair ou sombre, 17 polices.
> • Import et export JSON ou CSV (compatible Excel), sauvegarde automatique chaque semaine.
>
> Aucune donnée n'est collectée : tout reste dans votre navigateur.
>
> L'onglet Rédiger demande Chrome 138 ou plus récent (149 pour le français) et un ordinateur compatible avec l'IA de Chrome (Windows 10/11, macOS 13+ ou Linux, 22 Go libres, 16 Go de mémoire ou une carte graphique de plus de 4 Go).

**Catégorie** : Productivité › Outils · **Langue** : Français

**Images** : les 3 captures 1280 × 800 et la petite vignette promotionnelle 440 × 280 du dossier `store/`.

## 2. Onglet « Pratiques de confidentialité » (Privacy practices)

**Objectif unique** (Single purpose) :
> Aider à rédiger des réponses : phrases prêtes à copier rangées par rubriques, chemins de menus du logiciel ID, et reformulation du texte avec l'IA intégrée à Chrome.

**Justification des permissions** :
- `sidePanel` :
  > Permet d'ancrer TPhrase dans le panneau latéral de Chrome pour le garder ouvert pendant le travail, au choix de l'utilisateur (Réglages › Ancrer sur le côté).

**Code distant** (Remote code) : **Non**, je n'utilise pas de code distant. Tout le code est dans le paquet.

**Utilisation des données** (Data usage) : ne cocher **aucune** case. TPhrase ne collecte ni ne transmet
aucune donnée : phrases et réglages restent dans le stockage local de Chrome, et l'IA tourne sur l'ordinateur.

Cocher les trois certifications :
- je ne vends ni ne transfère les données utilisateur à des tiers, hors cas autorisés ;
- je n'utilise ni ne transfère les données utilisateur à des fins sans rapport avec l'objectif unique ;
- je n'utilise ni ne transfère les données utilisateur pour évaluer la solvabilité ou accorder des prêts.

**URL des règles de confidentialité** : l'adresse publique de `docs/confidentialite.html`.

## 3. Mettre la page de confidentialité en ligne

- **Dépôt GitHub public** : Settings › Pages › Source « Deploy from a branch », branche `main`, dossier `/docs`.
  L'adresse sera `https://<utilisateur>.github.io/<dépôt>/confidentialite.html`.
- **Dépôt privé** : GitHub Pages demande alors un abonnement payant. Copier plutôt le texte de la page dans un
  Google Docs partagé en lecture pour tous (« Toute personne disposant du lien ») et donner ce lien.

## 4. Onglet « Distribution »

- **Visibilité** : Public, Non répertorié (seulement avec le lien) ou Privé (liste de testeurs ou votre organisation).
  Pour une équipe, « Non répertorié » ou « Privé » suffit.
- **Régions** : toutes, ou France seulement.

## 5. Après la publication

Les données d'une extension chargée en mode développeur ne passent pas dans la version du Web Store,
qui a un autre identifiant. Avant de changer : Réglages › **Exporter JSON** dans l'ancienne, puis
**Importer** dans la nouvelle.
