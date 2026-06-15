# Configuration de Google Maps - Guide d'intégration

## 📍 Ajouter les coordonnées GPS réelles des pharmacies

La fonctionnalité Google Maps avancée nécessite que chaque pharmacie ait ses coordonnées GPS (latitude et longitude) dans la base de données.

### Option 1 : Script automatique (Recommandé)

Un script `server/seed-coordinates.mjs` a été créé pour ajouter les coordonnées GPS à vos pharmacies.

**Utilisation :**
```bash
node server/seed-coordinates.mjs
```

**Résultat :**
```
🌍 Ajout des coordonnées GPS aux pharmacies...
✅ Pharmacie 1: 2.9065°N, 11.1606°E
✅ Pharmacie 2: 2.9120°N, 11.1650°E
...
✨ Coordonnées GPS ajoutées avec succès !
```

### Option 2 : Mise à jour manuelle

Vous pouvez mettre à jour les coordonnées directement via SQL :

```sql
UPDATE pharmacies 
SET latitude = 2.9065, longitude = 11.1606 
WHERE id = 1;
```

### Option 3 : Interface Admin

Une interface d'administration pour gérer les coordonnées GPS des pharmacies peut être ajoutée à la page Admin.

---

## 🗺️ Fonctionnalités Google Maps disponibles

### Page `/pharmacies/map`

La page "Pharmacies à proximité" offre :

- **Localisation en temps réel** : Détecte la position de l'utilisateur
- **Rayon de recherche** : Filtre les pharmacies de 1 à 10 km
- **Marqueurs sur la carte** : Affiche toutes les pharmacies dans le rayon
- **Itinéraires GPS** : Calcule les directions vers chaque pharmacie
- **Vue Street View** : Montre la vue de la rue de chaque pharmacie
- **Distance calculée** : Affiche la distance jusqu'à chaque pharmacie
- **Détails complets** : Adresse, téléphone, horaires, lien Google Maps

---

## 📊 Schéma de base de données

Les colonnes suivantes ont été ajoutées à la table `pharmacies` :

```sql
ALTER TABLE `pharmacies` ADD `latitude` real;
ALTER TABLE `pharmacies` ADD `longitude` real;
```

**Types de données :**
- `latitude` : REAL (nombre décimal)
- `longitude` : REAL (nombre décimal)

**Exemple de données :**
```
Pharmacie 1: latitude = 2.9065, longitude = 11.1606
Pharmacie 2: latitude = 2.9120, longitude = 11.1650
```

---

## 🔧 Intégration avec Google Maps API

### Configuration du proxy Manus

Le système utilise le proxy Google Maps de Manus, qui :
- ✅ Gère l'authentification automatiquement
- ✅ Fournit accès à TOUTES les fonctionnalités Google Maps
- ✅ Ne nécessite pas de clé API utilisateur
- ✅ Supporte les services : Marker, Geocoding, Directions, Places, Street View, Geometry

### Bibliothèques chargées

```javascript
libraries=marker,places,geocoding,geometry,routes
```

**Disponibles :**
- `marker` : Marqueurs avancés
- `places` : Recherche de lieux
- `geocoding` : Géocodage (adresse → coordonnées)
- `geometry` : Calculs géométriques (distance, etc.)
- `routes` : Directions et itinéraires

---

## 🚀 Prochaines améliorations

### Fonctionnalités à ajouter

1. **Clustering de marqueurs** : Grouper les pharmacies proches pour améliorer les performances
2. **Heatmap** : Afficher la densité des pharmacies
3. **Filtrage avancé** : Par catégorie thérapeutique, prix, avis
4. **Notifications** : Alerter quand une pharmacie de garde est trouvée
5. **Historique des recherches** : Sauvegarder les pharmacies visitées
6. **Partage de localisation** : Partager une pharmacie avec un ami

### Optimisations

- Lazy loading des marqueurs
- Caching des itinéraires
- Compression des données de coordonnées
- Pagination pour les grandes listes

---

## 📱 Responsivité

La page Google Maps est 100% responsive :
- **Mobile (375×812)** : Carte pleine hauteur avec panneau latéral en bas
- **Tablette (768×1024)** : Mise en page équilibrée
- **Desktop (1280×720)** : Carte à gauche, panneau à droite

---

## 🐛 Dépannage

### "Aucune pharmacie trouvée"

**Cause** : Les coordonnées GPS ne sont pas remplies dans la base de données

**Solution** : 
```bash
node server/seed-coordinates.mjs
```

### La carte ne s'affiche pas

**Cause** : Problème de chargement de Google Maps API

**Solution** : Vérifier la console du navigateur pour les erreurs CORS

### Les itinéraires ne s'affichent pas

**Cause** : Les coordonnées de destination sont NULL

**Solution** : Vérifier que `latitude` et `longitude` sont remplies pour la pharmacie

---

## 📚 Ressources

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Manus Maps Proxy Documentation](https://docs.manus.im/maps)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula) (calcul de distance)

---

## ✅ Checklist de déploiement

- [ ] Ajouter les coordonnées GPS réelles des pharmacies
- [ ] Tester la page `/pharmacies/map` sur mobile et desktop
- [ ] Vérifier que les itinéraires GPS fonctionnent
- [ ] Tester la vue Street View
- [ ] Valider le rayon de recherche (1-10 km)
- [ ] Documenter les coordonnées des pharmacies
- [ ] Former les utilisateurs à utiliser la carte
