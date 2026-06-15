# PharmaEbolowa Pro - TODO

## Architecture & Infrastructure
- [x] Configurer la connexion PostgreSQL via DATABASE_URL
- [x] Créer les entités Drizzle ORM : Pharmacy, Medication, StockEntry, User
- [x] Implémenter les migrations Drizzle
- [x] Configurer le seed initial

## Backend Express + API REST
- [x] Implémenter l'authentification JWT (via tRPC)
- [x] Créer le middleware d'authentification
- [x] Implémenter les procédures tRPC pour login
- [x] Implémenter les procédures tRPC pour pharmacies
- [x] Implémenter les procédures tRPC pour médicaments
- [x] Implémenter les procédures tRPC pour stock
- [x] Implémenter la mutation tRPC pour mise à jour du stock
- [x] Implémenter la gestion des rôles (admin, pharmacist)
- [x] Ajouter la validation des entrées (Zod)
- [x] Ajouter la gestion des erreurs

## Frontend - Pages Principales
- [x] Page d'accueil avec barre de recherche de médicaments
- [x] Affichage des résultats de recherche (pharmacies + statut + prix)
- [x] Page liste des pharmacies avec filtres
- [x] Fiche détaillée pharmacie (adresse, téléphone, horaires, carte, stock)
- [x] Mise en avant de la pharmacie de garde
- [x] Page liste des médicaments avec filtres
- [x] Filtres par catégorie thérapeutique
- [x] Filtre "disponibles uniquement"

## Frontend - Authentification & Admin
- [x] Page de connexion avec formulaire
- [x] Système de gestion de session (localStorage)
- [x] Page Admin protégée
- [x] Interface de mise à jour des disponibilités et prix
- [x] Interface de désignation de la pharmacie de garde
- [x] Gestion des rôles côté frontend

## Design & UX
- [x] Implémenter le design système (couleurs, typographie, espacements)
- [x] Créer le layout principal avec header et footer
- [x] Implémenter la barre de navigation
- [x] Assurer la responsivité 100% (mobile, tablette, desktop)
- [x] Ajouter les icônes (lucide-react)
- [ ] Implémenter les animations et transitions
- [ ] Tester l'accessibilité (WCAG)

## Données & Seed
- [x] Créer les données de seed pour les pharmacies
- [x] Créer les données de seed pour les médicaments
- [x] Créer les données de seed pour les stocks
- [x] Créer les utilisateurs de test (admin, pharmacist)

## Tests & Qualité
- [ ] Écrire les tests unitaires (Vitest)
- [ ] Tester les procédures tRPC
- [ ] Tester l'authentification
- [ ] Tester la responsivité sur différents appareils
- [ ] Vérifier la performance
- [ ] Valider le SEO

## Déploiement & Documentation
- [x] Documenter l'installation locale
- [x] Documenter les variables d'environnement
- [x] Documenter l'API tRPC
- [x] Préparer le déploiement
- [ ] Créer le checkpoint final
