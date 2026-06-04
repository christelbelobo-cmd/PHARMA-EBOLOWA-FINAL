# PharmaEbolowa

Application web **responsive** de disponibilité des médicaments dans les 7 pharmacies de la ville d'**Ebolowa** (Sud, Cameroun) :
Equasep, Samba, Renaissance, Bercail, Mvila, Élites, Destinée.

## Fonctionnalités

- **Recherche de médicament** : trouvez instantanément quelles pharmacies ont un médicament (par nom ou DCI), avec son statut et son prix indicatif (FCFA).
- **Statuts de disponibilité** : Disponible, Stock faible, Sur commande, Rupture.
- **Fiches pharmacies** : adresse, téléphone (cliquable), horaires, lien carte, et stock complet par pharmacie.
- **Pharmacie de garde** mise en avant.
- **Filtres** : par catégorie thérapeutique et « disponibles uniquement ».
- **Page Admin** : mise à jour des disponibilités, des prix et de la pharmacie de garde.
- **100% responsive** (mobile / tablette / desktop), interface en français.

## Données

Les données (pharmacies, médicaments, stocks, prix) sont des **données de démonstration**.
Elles sont persistées localement dans le navigateur (`localStorage`) ; les modifications faites
dans la page Admin sont conservées sur l'appareil. Le bouton « Réinitialiser » restaure le jeu de démo.

> ⚠️ Les adresses et numéros de téléphone sont illustratifs et doivent être confirmés auprès de chaque pharmacie.

Pour passer à des données réelles partagées en temps réel entre utilisateurs, il faudra brancher un
backend / base de données (ex. Supabase, Firebase, ou une API dédiée) — voir « Évolutions » ci-dessous.

## Stack technique

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [React Router](https://reactrouter.com/)

## Démarrer en local

Prérequis : Node.js 18+ et npm.

```sh
npm install
npm run dev      # http://localhost:8080
```

Autres commandes :

```sh
npm run build    # build de production (dossier dist/)
npm run preview  # prévisualiser le build
npm run lint     # ESLint
```

## Structure

```
src/
  data/          # pharmacies, médicaments, génération du stock de démo
  store/         # état global + persistance localStorage
  components/    # Header, Footer, cartes, badge de disponibilité, UI (shadcn)
  pages/         # Accueil, Médicaments, Pharmacies, Détail pharmacie, Admin
  lib/           # formatage (prix, dates, statuts)
```

## Évolutions possibles

- Backend + base de données pour des stocks réels, partagés et en temps réel.
- Comptes pharmaciens (chaque pharmacie met à jour son propre stock).
- Carte interactive des pharmacies.
- Notifications « me prévenir quand ce médicament est disponible ».
