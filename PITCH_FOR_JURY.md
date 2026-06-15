PRESENTATION POUR LE JURY — Pharma Ebolowa

But et accroche

Pharma Ebolowa est une application web locale qui permet aux habitants de trouver rapidement un médicament disponible dans les pharmacies locales, tout en donnant aux pharmaciens un moyen simple et sécurisé de mettre à jour leurs stocks. Elle améliore l’accès aux soins et réduit le temps perdu à chercher un médicament.

Le problème

- Les patients appellent ou se déplacent sans savoir si un médicament est disponible.
- Les pharmacies gèrent souvent les stocks manuellement (papier, Excel) et les informations ne sont pas centralisées.
- Les responsables (administrateurs) n’ont pas d’outil simple pour superviser l’ensemble des pharmacies.

La solution (en termes non techniques)

- Une interface publique pour rechercher des médicaments et voir les pharmacies qui les ont en stock.
- Une page dédiée par pharmacie (adresse, téléphone, horaires, carte).
- Un espace pour le pharmacien (après connexion) lui permettant d’importer un fichier (CSV ou JSON) contenant l’état des stocks et les prix.
- Un espace administrateur global (après connexion) avec les mêmes pouvoirs sur toutes les pharmacies + réglages globaux.
- Les fonctions sensibles (import, modification des informations) sont protégées derrière une connexion.

Rôles et accès

- Client (grand public) : Recherche et consultation — pas besoin de se connecter.
- Pharmacien : Se connecte uniquement à la page de SA pharmacie pour modifier le stock et les informations. Après sortie de la page, l’accès administrateur/pharmacien est automatiquement révoqué.
- Administrateur : Accès global à toutes les pharmacies, peut modifier les fiches et réinitialiser les données.

Identifiants de démonstration (mode démo)

- Administrateur : identifiant = admin, mot de passe = admin
- Pharmacies : mot de passe égal à l’identifiant de la pharmacie (ex. équasep -> equasep, samba -> samba). (Ces comptes sont des comptes de démonstration et doivent être remplacés en production.)

Démonstration proposée devant le jury (script simple)

1. Préparation (sur la machine) :
   - Ouvrir un terminal dans le dossier du projet.
   - Démarrer le backend :
     - cd backend
     - npm install
     - npm run dev
   - Démarrer le frontend (à la racine du projet) :
     - npm install
     - npm run dev
   - Ouvrir le navigateur : http://localhost:5173 (ou l’URL indiquée par Vite)

2. Montrer la vue publique (recherche) :
   - Rechercher un médicament (ex: Paracétamol) et montrer la liste des pharmacies et leurs prix/disponibilités.

3. Se connecter comme administrateur :
   - Cliquer sur « Se connecter » → utiliser admin / admin.
   - Montrer le tableau d’administration : modification d’une fiche pharmacie (adresse, téléphone), définition de la pharmacie de garde, import d’un fichier CSV.

4. Se connecter comme pharmacien :
   - Se déconnecter, puis aller sur la page d’une pharmacie et cliquer « Se connecter » avec le mot de passe de cette pharmacie.
   - Importer un petit CSV (format ci‑dessous) pour mettre à jour plusieurs médicaments.
   - Montrer que le client, lui, ne voit pas les boutons d’import/édition.

5. Conclusion rapide : expliquer comment l’administration peut surveiller et ajuster l’inventaire, et comment la solution peut être proposée aux pharmacies.

Exemple de fichier CSV (ligne d’en-tête requise)

id,name,status,price
med-001,Paracétamol 500mg,in,200
med-002,Ibuprofène 400mg,out,

- status : "in" (disponible) ou "out" (rupture)
- price : nombre entier (FCFA) ou vide si non applicable

Technologies (brefs mots pour rassurer)

- Frontend : React + Vite + TypeScript. UI moderne (TailwindCSS, Radix). Performances rapides en local.
- Backend : Node.js + Express + TypeScript. Authentification par jetons (JWT). Mot de passe hachés pour la démonstration.
- Architecture : frontend interroge le backend via API; le backend expose endpoints de connexion et de mise à jour.

Sécurité et limitations actuelles (à expliquer au jury)

- Prototype : données en mémoire pour démonstration (seed). Pour production il faut une base de données (Postgres, MySQL, etc.).
- Authentification : JWT côté serveur ; dans la démo le token est stocké en local (localStorage). En production, utiliser cookies httpOnly pour plus de sécurité.
- Pas de chiffrement de bout en bout pour les données sensibles dans cette version de démonstration.

Valeur business et opportunités

- Réduction du temps perdu par les patients et des appels téléphoniques aux pharmacies.
- Meilleure rotation des stocks et moins de ruptures grâce à des mises à jour rapides.
- Opportunités commerciales : abonnement pour les pharmacies (statistiques, rapports), partenariats avec fournisseurs, services premium (mise en avant, livraison).

Demande de sponsorisation (proposition)

- Objectif : rendre la solution production-ready (persistante, sécurisée, hébergée et monitorée).
- Estimation initiale pour un MVP production : 12–20k EUR (2–3 mois) — inclut développement backend persistant, stockage fichiers, hébergement cloud, sécurité et tests.
- Livrables : API sécurisée, authentification robuste, tableau d’administration complet, documentation utilisateur, plan d’hébergement.

Prochaines étapes recommandées

- Valider le budget et les priorités (sécurité / persistance / UX).  
- Déployer une instance pilote dans une région cible avec 5–10 pharmacies.  
- Mesurer KPI : nombre de recherches, taux de mise à jour des stocks, réduction des appels.

Contact et supports

- Pour la démo sur place, utiliser l’ordinateur local et suivre le script de démonstration ci‑dessus.  
- Souhaitez-vous une version PPTX/PDF de ce document optimisée pour le jury ? Je peux la générer.

---

Bonne présentation — dites si une version plus courte (1 page) ou des slides sont nécessaires, et si la liste complète des identifiants de démo doit être incluse.