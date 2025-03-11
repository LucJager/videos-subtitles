# Tommy Reel - Application de Sous-titrage Vidéo

Cette application Next.js permet de générer automatiquement des sous-titres stylisés pour vos vidéos en utilisant l'API ZapCap.

## Fonctionnalités

- Upload de vidéos par glisser-déposer
- Génération automatique de sous-titres en français
- Choix parmi 10 styles de sous-titres différents
- Téléchargement des vidéos sous-titrées individuellement ou en ZIP
- Interface réactive et retours visuels sur la progression

## Prérequis

- Node.js 18+
- pnpm 9.4.0+

## Installation

1. Clonez le repository :

```bash
git clone https://github.com/votre-username/tommy-reel.git
cd tommy-reel
```

2. Installez les dépendances :

```bash
pnpm install
```

3. Créez un fichier `.env` à la racine du projet :

```
NEXT_PUBLIC_ZAPCAP_API_KEY=votre_clé_api
```

## Développement

Lancez le serveur de développement :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Structure du Projet

```text
├── app/
│ ├── api/ # Routes API Next.js
│ │ ├── upload/ # Gestion des uploads
│ │ ├── videos/ # Endpoints vidéos
│ │ └── task/ # Gestion des tâches
│ ├── components/ # Composants React réutilisables
│ └── page.tsx # Page principale
├── public/
│ └── uploads/ # Fichiers uploadés (gitignored)
├── resources/
│ ├── template-choisi.json # Liste des templates sélectionnés
│ └── template-zapcap.json # Configuration complète des templates
└── config/
├── next.config.ts # Configuration Next.js
└── tailwind.config.ts # Configuration Tailwind
```

## Déploiement

L'application est optimisée pour être déployée sur Vercel. Pour déployer :

1. Connectez votre repository à Vercel
2. Configurez la variable d'environnement `NEXT_PUBLIC_ZAPCAP_API_KEY`
3. Déployez !

## Limitations

- Taille maximale des fichiers : 100MB
- Formats acceptés : MP4, MOV, AVI
- Durée maximale : 5 minutes
- Langue des sous-titres : Français uniquement

## Technologies Utilisées

- [Next.js 15.2](https://nextjs.org/)
- [React 19](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [JSZip](https://stuk.github.io/jszip/)

## Licence

GNU General Public License v3.0 - voir le fichier [LICENSE](LICENSE) pour plus de détails.
