# Team Yurâm - Gestion de tournois

## Installation

### 1. Installer Node.js
Télécharger et installer Node.js (version LTS) depuis : https://nodejs.org/

### 2. Installer les dépendances
Ouvrir un terminal dans le dossier `yuram-tournament` et lancer :

```
npm install
```

### 3. Lancer l'application
```
npm run dev
```

Ouvrir http://localhost:5173 dans le navigateur.

### 4. Build pour production (optionnel)
```
npm run build
```
Les fichiers seront dans le dossier `dist/` — ouvrable sur n'importe quel hébergeur statique.

## Fonctionnalités

- **Tournois Swiss** : appariements automatiques, jamais deux fois le même adversaire
- **Phase finale** : bracket automatique top 4 (demi-finales, petite finale, finale)
- **Classement saison 2026** : points cumulés par tournoi (1er=3pts, 2e=2pts, 3e=1pt)
- **Entraînements** : présence par membre, taux de présence par trimestre
- **Historique** : résumé des saisons passées (2023, 2024, 2025)
- **Persistance** : toutes les données sont sauvegardées dans localStorage

## Système de points

| Résultat | Pts tournoi | Duels gagnés | Différence |
|----------|------------|--------------|------------|
| Win 2-0  | 3 pts      | +2           | +2         |
| Win 2-1  | 3 pts      | +2           | +1         |
| Loss 1-2 | 0 pts      | +1           | -1         |
| Loss 0-2 | 0 pts      | +0           | -2         |

**Départage** : Points → Duels gagnés → Différence
