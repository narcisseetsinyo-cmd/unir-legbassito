# Site UNIR · Section Légbassito

Site de 3 pages (Accueil · La section · Nous rejoindre) avec un **espace admin** à l'adresse `/admin` : les responsables se connectent avec leur **adresse e-mail et un mot de passe**, puis modifient le site, publient des actualités et ajoutent des photos.

## Organisation des fichiers

| Dossier / fichier | Rôle |
|---|---|
| `index.html`, `section.html`, `rejoindre.html`, `article.html` | Les pages (structure seulement) |
| `style.css`, `script.js` | Design et animations, communs aux pages |
| `content/` | **Tout le contenu** : textes, chiffres, bureau, actions, galerie, actualités, coordonnées |
| `assets/` | Logo, polices, photos (`assets/uploads/` reçoit les photos ajoutées depuis l'admin) |
| `admin/` | L'espace d'administration (écran de connexion + Decap CMS, `config.yml` décrit les formulaires) |
| `netlify.toml` | Publication sur Netlify |

## Hébergement

Le site est hébergé sur **Netlify**, relié à ce dépôt GitHub : chaque modification (y compris depuis l'admin) republie le site en 1 à 2 minutes.

## Comptes administrateurs (par e-mail)

- Les comptes se gèrent dans Netlify : **Projet → Identity** (inscription *sur invitation uniquement*).
- **Inviter un admin** : Identity → **Invite users** → saisir son adresse e-mail.
  La personne reçoit un e-mail, clique sur le lien, choisit son mot de passe : son compte est actif.
- **Mot de passe oublié** : lien « Mot de passe oublié ? » sur l'écran de connexion de l'admin.
- **Retirer un admin** : Identity → cliquer sur la personne → **Delete user**.

## Utiliser l'admin

- **Actualités** : bouton **+ actualité** pour publier un article (titre, date, image, résumé, texte).
  Cochez **Brouillon** pour préparer un article sans le publier. Deux modèles sont déjà en brouillon.
- **Pages du site** : textes des pages Accueil, La section et Nous rejoindre.
- **Bureau, actions et galerie** : membres du bureau (avec photo), frise des actions, galerie photos.
- **Coordonnées et réseaux** : numéro WhatsApp du formulaire, téléphone, e-mail, adresse, réseaux sociaux.

Après **Publier**, le site se met à jour tout seul en 1 à 2 minutes.

## Voir le site sur son ordinateur

Le site lit son contenu dans `content/` : il faut l'ouvrir via un petit serveur, par exemple :

```
python -m http.server 8000
```

puis ouvrir `http://localhost:8000` (l'espace admin ne fonctionne qu'en ligne).
