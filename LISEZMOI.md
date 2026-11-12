# Site UNIR · Section Légbassito

Site de 3 pages (Accueil · La section · Nous rejoindre) avec un **espace admin** à l'adresse `/admin`, qui permet de tout modifier et de publier des actualités sans toucher au code.

## Organisation des fichiers

| Dossier / fichier | Rôle |
|---|---|
| `index.html`, `section.html`, `rejoindre.html`, `article.html` | Les pages (structure seulement) |
| `style.css`, `script.js` | Design et animations, communs aux pages |
| `content/` | **Tout le contenu** : textes, chiffres, bureau, actions, galerie, actualités, coordonnées |
| `assets/` | Logo, polices, photos (`assets/uploads/` reçoit les photos ajoutées depuis l'admin) |
| `admin/` | L'espace d'administration (`config.yml` décrit les formulaires) |
| `.github/workflows/deploy.yml` | Republie le site automatiquement à chaque modification |

## Mise en ligne (une seule fois, environ 10 minutes)

1. **Créer le dépôt** sur GitHub : bouton **New repository**, nom `unir-legbassito`, visibilité **Public**.
2. **Envoyer les fichiers** dans ce dépôt (tout le contenu du dossier, y compris le dossier caché `.github`).
3. **Activer la publication** : dans le dépôt, **Settings → Pages → Source : GitHub Actions**.
4. Attendre 1 à 2 minutes : le site est en ligne à l'adresse
   `https://VOTRE-COMPTE.github.io/unir-legbassito/`

> Si votre compte GitHub ou le nom du dépôt est différent, modifiez la ligne `repo:` au début de `admin/config.yml`.

## Se connecter à l'espace admin

1. Créer un **jeton d'accès** (c'est votre clé de connexion) :
   GitHub → photo de profil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
   - *Repository access* : **Only select repositories** → `unir-legbassito`
   - *Permissions* → *Repository permissions* → **Contents : Read and write**
   - *Expiration* : par exemple 1 an
   - Copier le jeton affiché (il ne sera plus montré ensuite).
2. Ouvrir `https://VOTRE-COMPTE.github.io/unir-legbassito/admin/`
3. Coller le jeton dans le champ **Jeton d'accès**, puis cliquer sur **Se connecter**.
   (En cas de souci, le lien « Utiliser l'écran de connexion standard » en bas de page affiche l'écran d'origine de l'outil.)

Le navigateur garde la connexion : pas besoin de recoller le jeton à chaque fois.

## Utiliser l'admin

- **Coordonnées et réseaux** : numéro WhatsApp du formulaire, téléphone, e-mail, adresse, liens Facebook / TikTok / YouTube.
- **Page 1 · Accueil** : titre, mots animés, à propos, chiffres clés, valeurs, citations.
- **Page 2** : titres de la page, **membres du bureau** (avec photo), **actions** (frise), **galerie photos**.
- **Page 3 · Nous rejoindre** : textes des parties Actualités, Adhésion et Contact.
- **Actualités** : bouton **Nouveau** pour publier un article (titre, date, image, résumé, texte).
  Cochez **Brouillon** pour préparer un article sans le publier. Deux modèles sont déjà en brouillon.

Après **Enregistrer**, le site se met à jour tout seul en **1 à 2 minutes** (rafraîchir la page).

## Ajouter un autre administrateur

Dépôt → **Settings → Collaborators → Add people**. La personne accepte l'invitation, crée son propre jeton (étape ci-dessus) et se connecte à `/admin`.

## Sécurité

- Le jeton est un mot de passe : ne le partagez pas. Chaque administrateur a le sien.
- En cas de perte ou de départ d'un membre : GitHub → *Fine-grained tokens* → **Revoke**, et retirer la personne des collaborateurs.
- Chaque modification est enregistrée dans l'historique GitHub et peut être annulée.

## Voir le site sur son ordinateur

Le site lit son contenu dans `content/`, il faut donc l'ouvrir via un petit serveur (et non en double-cliquant sur `index.html`). Par exemple, dans le dossier du site :

```
python -m http.server 8000
```

puis ouvrir `http://localhost:8000`.
