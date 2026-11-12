# Site UNIR · Section Légbassito

Site de 3 pages (Accueil · La section · Nous rejoindre) avec un **espace admin** à l'adresse `/admin` : les responsables se connectent avec leur **adresse e-mail et un mot de passe**, puis modifient le site, publient des actualités et ajoutent des photos.

## Organisation des fichiers

| Dossier / fichier | Rôle |
|---|---|
| `index.html`, `section.html`, `rejoindre.html`, `article.html` | Les pages (structure seulement) |
| `style.css`, `script.js` | Design et animations, communs aux pages |
| `content/` | **Tout le contenu** : textes, chiffres, bureau, actions, galerie, actualités, coordonnées |
| `assets/` | Logo, polices, photos (`assets/uploads/` reçoit les photos ajoutées depuis l'admin) |
| `admin/` | L'espace d'administration sur mesure : connexion (`login.js`), tableau de bord (`app.js`, `app.css`), description des formulaires (`schemas.js`) |
| `netlify/functions/admins.js` | Petit service qui permet d'inviter et retirer des administrateurs depuis le tableau de bord |
| `netlify.toml` | Publication sur Netlify |

## Hébergement

Le site est hébergé sur **Netlify**, relié à ce dépôt GitHub : chaque modification (y compris depuis l'admin) republie le site en 1 à 2 minutes.

## Comptes administrateurs (par e-mail)

- **Inviter un admin** : espace admin → **Administrateurs** → saisir son adresse e-mail → **Envoyer l'invitation**.
  La personne reçoit un e-mail (envoyé par Netlify, en anglais), clique sur le lien et choisit son mot de passe.
- **Retirer un admin** : espace admin → **Administrateurs** → icône corbeille.
- **Mot de passe oublié** : lien « Mot de passe oublié ? » sur l'écran de connexion.
- **Changer son mot de passe** : espace admin → **Mon compte**.
- Les comptes restent aussi visibles dans Netlify : **Projet → Identity** (inscription *sur invitation uniquement*).

## Utiliser l'admin

Le menu de gauche regroupe toutes les rubriques :

- **Tableau de bord** : chiffres clés, liste « À compléter », dernières modifications et accès rapides.
- **Actualités** : **Nouvelle actualité**, puis **Enregistrer le brouillon** (invisible sur le site) ou **Publier**.
- **Page d'accueil**, **Bureau**, **Actions**, **Galerie photos**, **Textes des pages**, **Coordonnées** : un formulaire par rubrique.
  Dans la galerie, glissez-déposez plusieurs photos d'un coup ; elles sont réduites automatiquement.
- Après une modification, la barre du bas propose **Enregistrer et publier**. L'indicateur en haut à droite passe
  de « Publication en cours… » à « En ligne » quand le site est à jour (1 à 2 minutes).

Chaque enregistrement est conservé dans l'historique du dépôt GitHub et peut être annulé.

## Voir le site sur son ordinateur

Le site lit son contenu dans `content/` : il faut l'ouvrir via un petit serveur, par exemple :

```
python -m http.server 8000
```

puis ouvrir `http://localhost:8000` (l'espace admin ne fonctionne qu'en ligne).
