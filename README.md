# PharmaEbolowa Pro

Application web complète de gestion et de recherche de médicaments en pharmacie, avec une interface élégante, moderne et 100% responsive en français.

## 🎯 Fonctionnalités principales

### Pour les utilisateurs publics
- **Recherche de médicaments** : Trouvez instantanément quelles pharmacies ont un médicament (par nom ou DCI)
- **Statuts de disponibilité** : Disponible, Stock faible, Sur commande, Rupture
- **Fiches pharmacies** : Adresse, téléphone cliquable, horaires, lien carte, stock complet
- **Pharmacie de garde** : Mise en avant de la pharmacie de garde
- **Filtres** : Par catégorie thérapeutique et "disponibles uniquement"
- **100% responsive** : Mobile, tablette, desktop

### Pour les administrateurs
- **Page Admin protégée** : Authentification JWT
- **Gestion des stocks** : Mise à jour des disponibilités et des prix
- **Pharmacie de garde** : Désignation de la pharmacie de garde
- **Gestion des rôles** : Admin (accès total) et Pharmacist (accès limité à sa pharmacie)

## 🏗️ Architecture technique

### Frontend
- **React 19** avec TypeScript
- **Vite** pour le build
- **Tailwind CSS 4** pour le styling
- **shadcn/ui** pour les composants
- **tRPC** pour la communication avec le backend
- **React Router** (wouter) pour la navigation
- **Lucide React** pour les icônes

### Backend
- **Express 5** avec TypeScript
- **tRPC 11** pour les procédures RPC typées
- **Drizzle ORM** pour l'accès à la base de données
- **MySQL 2** comme driver de base de données

### Base de données
- **MySQL** (via DATABASE_URL)
- Tables : `users`, `pharmacies`, `medications`, `stockEntries`
- Relations typées avec Drizzle ORM

## 🚀 Installation et démarrage

### Prérequis
- Node.js 18+
- pnpm ou npm
- Accès à une base de données MySQL

### Variables d'environnement
Créez un fichier `.env.local` à la racine du projet :

```env
# Base de données
DATABASE_URL=mysql://user:password@localhost:3306/pharma_ebolowa

# Autres variables (optionnelles)
NODE_ENV=development
PORT=3000
```

### Installation
```bash
# Installer les dépendances
pnpm install

# Générer les migrations Drizzle (si nécessaire)
pnpm drizzle-kit generate

# Démarrer le serveur de développement
pnpm dev
```

L'application sera accessible à `http://localhost:3000`

## 📱 Pages disponibles

### Pages publiques
- `/` - Accueil avec barre de recherche
- `/pharmacies` - Liste de toutes les pharmacies
- `/pharmacies/:id` - Détail d'une pharmacie et son stock
- `/medications` - Liste des médicaments avec filtres
- `/login` - Page de connexion

### Pages protégées
- `/admin` - Tableau de bord administrateur (admin uniquement)

## 🔐 Authentification

### Comptes de test

**Admin**
- Utilisateur : `admin`
- Mot de passe : `admin123`
- Accès : Gestion complète des stocks et pharmacies de garde

**Pharmacist**
- Utilisateur : `pharmacist`
- Mot de passe : `pass123`
- Accès : Gestion du stock de sa pharmacie uniquement

### Flux d'authentification
1. L'utilisateur se connecte via la page `/login`
2. Les identifiants sont validés via la procédure tRPC `auth.login`
3. Un token est retourné et stocké dans `localStorage`
4. Les mutations protégées utilisent ce token pour l'authentification

## 📊 API tRPC

### Procédures publiques

**Pharmacies**
```typescript
trpc.pharmacy.list.useQuery()           // Lister toutes les pharmacies
trpc.pharmacy.getById.useQuery(id)      // Obtenir une pharmacie par ID
```

**Médicaments**
```typescript
trpc.medication.list.useQuery()         // Lister tous les médicaments
trpc.medication.getById.useQuery(id)    // Obtenir un médicament par ID
trpc.medication.search.useQuery(query)  // Rechercher des médicaments
```

**Stock**
```typescript
trpc.stock.list.useQuery()              // Lister tous les stocks
trpc.stock.getByMedication.useQuery(id) // Stock d'un médicament
trpc.stock.getByPharmacy.useQuery(id)   // Stock d'une pharmacie
```

### Procédures protégées

**Authentification**
```typescript
trpc.auth.login.useMutation()           // Connexion
trpc.auth.logout.useMutation()          // Déconnexion
```

**Stock (admin/pharmacist)**
```typescript
trpc.stock.update.useMutation()         // Mettre à jour un stock
```

**Pharmacies (admin)**
```typescript
trpc.pharmacy.setDuty.useMutation()     // Définir la pharmacie de garde
```

## 🎨 Design et UX

- **Palette de couleurs** : Bleu/Indigo pour une ambiance médicale professionnelle
- **Typographie** : Inter (Google Fonts)
- **Espacements** : Système cohérent basé sur Tailwind
- **Icônes** : Lucide React
- **Composants** : shadcn/ui pour une cohérence maximale

## 📦 Structure du projet

```
pharma-ebolowa-unified/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/                  # Pages de l'application
│   │   ├── components/             # Composants réutilisables
│   │   ├── lib/                    # Utilitaires et tRPC client
│   │   ├── contexts/               # Contextes React
│   │   └── App.tsx                 # Routeur principal
│   └── public/                     # Fichiers statiques
├── server/                          # Backend Express
│   ├── routers.ts                  # Procédures tRPC
│   ├── db.ts                       # Requêtes Drizzle ORM
│   ├── seed.mjs                    # Script de seed
│   └── _core/                      # Infrastructure tRPC
├── drizzle/                         # Migrations et schéma
│   ├── schema.ts                   # Définition des tables
│   └── migrations/                 # Fichiers de migration
├── shared/                          # Code partagé frontend/backend
└── package.json                     # Dépendances du projet
```

## 🔄 Flux de données

1. **Frontend** : L'utilisateur interagit avec l'interface React
2. **tRPC Client** : Les données sont envoyées via tRPC au backend
3. **Backend** : Les procédures tRPC valident et traitent les données
4. **Drizzle ORM** : Les requêtes sont exécutées sur la base de données
5. **Response** : Les données sont retournées au frontend avec les types TypeScript

## 🧪 Tests

Les tests sont écrits avec Vitest. Pour exécuter les tests :

```bash
pnpm test
```

## 📝 Données de seed

La base de données est pré-remplie avec :
- **7 pharmacies** : Equasep, Samba, Renaissance, Bercail, Mvila, Élites, Destinée
- **10 médicaments** : Paracétamol, Ibuprofène, Amoxicilline, etc.
- **70 entrées de stock** : Combinaisons de médicaments et pharmacies
- **2 utilisateurs** : Admin et Pharmacist

## 🚢 Déploiement

### Préparation
1. Vérifier que toutes les variables d'environnement sont définies
2. Exécuter `pnpm build` pour créer le build de production
3. Créer un checkpoint via `webdev_save_checkpoint`

### Déploiement
Cliquez sur le bouton **Publish** dans le Management UI après avoir créé un checkpoint.

## 🐛 Dépannage

### La base de données ne se connecte pas
- Vérifier la variable `DATABASE_URL`
- S'assurer que le serveur MySQL est en cours d'exécution
- Vérifier les identifiants et permissions

### Les mutations tRPC échouent
- Vérifier que l'utilisateur est authentifié
- Vérifier les logs du serveur dans `.manus-logs/devserver.log`
- S'assurer que le rôle de l'utilisateur a les permissions nécessaires

### Les pages ne se chargent pas
- Vérifier que le serveur de développement est en cours d'exécution
- Vérifier les erreurs dans la console du navigateur
- Vérifier les erreurs TypeScript : `pnpm check`

## 📞 Support

Pour toute question ou problème, consultez la documentation tRPC : https://trpc.io

## 📄 Licence

MIT

## 👨‍💻 Développé avec Manus

Cette application a été développée avec la plateforme Manus, qui fournit :
- Infrastructure de développement web complète
- Base de données MySQL intégrée
- Authentification OAuth
- Hébergement et déploiement automatique
