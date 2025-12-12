# 🎛️ Documentation de l'Interface d'Administration des Webhooks

## Vue d'ensemble

L'interface d'administration des webhooks permet à l'administrateur de gérer facilement les webhooks personnalisés pour chaque utilisateur de l'application DictaMed.

## Accès à l'Interface

### Lien d'Accès
- **Page principale :** [index.html](index.html)
- **Interface admin :** [admin-webhooks.html](admin-webhooks.html)
- **Lien direct :** Bouton "Admin" dans la navigation principale

### Authentification Requise
- **Email administrateur :** `akio963@gmail.com`
- **Accès refusé :** Tous les autres utilisateurs verront un message d'accès refusé

## Fonctionnalités de l'Interface

### 📊 Tableau de Bord
- **Statistiques en temps réel :**
  - Nombre total d'utilisateurs
  - Webhooks configurés
  - Webhooks actifs/inactifs
  - Utilisateurs sans webhook

### 👥 Gestion des Utilisateurs

#### Liste des Utilisateurs
- Affichage de tous les utilisateurs Firebase Auth
- Informations affichées :
  - Nom d'affichage
  - Email
  - UID utilisateur
  - Statut du webhook (Actif/Inactif/Non configuré)

#### Filtres et Recherche
- **Recherche textuelle :** Par nom, email ou UID
- **Filtres disponibles :**
  - Tous les utilisateurs
  - Avec webhook
  - Sans webhook
  - Webhook actif
  - Webhook inactif

### 🔗 Gestion des Webhooks

#### Pour Chaque Utilisateur

**1. Saisie d'URL de Webhook**
- Champ de saisie pour l'URL du webhook
- Validation automatique HTTPS
- Message d'erreur en cas d'URL invalide

**2. Boutons d'Action**
- 💾 **Sauvegarder :** Enregistre l'URL du webhook
- ✅/🚫 **Activer/Désactiver :** Basculer le statut
- 🗑️ **Supprimer :** Supprimer le webhook (avec confirmation)
- ℹ️ **Détails :** Afficher les informations complètes

#### Validation des Webhooks
- **HTTPS requis :** Seules les URLs HTTPS sont acceptées
- **Format d'URL :** Validation automatique
- **Longueur :** Entre 10 et 2048 caractères

### 📈 Métadonnées Affichées

Pour chaque webhook configuré :
- **Date de création**
- **Dernière utilisation** (si disponible)
- **Nombre d'utilisations**
- **Notes d'administration**
- **Dernière modification**
- **Administrateur qui a fait la modification**

## Utilisation de l'Interface

### Étapes pour Configurer un Webhook

1. **Accéder à l'Interface**
   - Cliquer sur "Admin" dans la navigation
   - Se connecter avec `akio963@gmail.com`

2. **Localiser l'Utilisateur**
   - Utiliser la barre de recherche
   - Appliquer les filtres si nécessaire

3. **Configurer le Webhook**
   - Saisir l'URL du webhook dans le champ
   - Cliquer sur "💾 Sauvegarder"
   - Vérifier que le statut passe à "Actif"

4. **Gérer le Statut**
   - Activer/désactiver avec le bouton approprié
   - Supprimer si nécessaire (avec confirmation)

### Exemples d'URLs de Webhooks

```
https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode
https://hooks.zapier.com/hooks/catch/123456/abcdef
https://your-server.com/webhook/dictamed
https://make.com/api/v1/hooks/catch/789/xyz
```

## Architecture Technique

### Fichiers Créés

1. **[js/components/admin-webhook-manager.js](js/components/admin-webhook-manager.js)**
   - Classe principale `AdminWebhookManager`
   - Gestion de l'interface et des interactions
   - Intégration avec Firebase Auth et Firestore

2. **[admin-webhook-styles.css](admin-webhook-styles.css)**
   - Styles CSS modernes et responsifs
   - Thème adapté à l'application
   - Animations et transitions fluides

3. **[admin-webhooks.html](admin-webhooks.html)**
   - Page dédiée à l'interface d'administration
   - Structure HTML complète
   - Intégration avec Firebase

### Base de Données Firestore

**Collection :** `userWebhooks`

**Structure des documents :**
```javascript
{
  webhookUrl: "https://exemple.com/webhook",
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp,
  updatedBy: "admin@email.com",
  lastUsed: timestamp,
  lastUsedMode: "normal",
  usageCount: 5,
  notes: "Configuration admin"
}
```

### Sécurité

**Contrôles d'Accès :**
- Vérification de l'email admin avant affichage
- Validation des données côté client et serveur
- Règles Firestore pour sécuriser les opérations

**Permissions :**
- Seul `akio963@gmail.com` peut accéder à l'interface
- Lecture/écriture sécurisées dans Firestore
- Validation des URLs et des données

## Dépannage

### Problèmes Courants

**1. "Accès Refusé"**
- **Cause :** Email non autorisé
- **Solution :** Se connecter avec `akio963@gmail.com`

**2. "Aucun utilisateur trouvé"**
- **Cause :** Problème de connexion Firebase
- **Solution :** Vérifier la configuration Firebase

**3. "Erreur de sauvegarde"**
- **Cause :** URL invalide ou problème de permissions
- **Solution :** Vérifier l'URL (HTTPS requis) et les permissions

**4. Interface ne se charge pas**
- **Cause :** Firebase non initialisé
- **Solution :** Actualiser la page et vérifier la console

### Logs et Débogage

**Console du Navigateur :**
- Messages de succès/erreur détaillés
- Informations de débogage Firebase
- Statuts des opérations

**Notifications :**
- Messages de succès/erreur dans l'interface
- Confirmations d'actions critiques
- Alertes de validation

## Maintenance

### Mises à Jour

**Ajout de Fonctionnalités :**
- Modifier `AdminWebhookManager` dans `admin-webhook-manager.js`
- Ajouter de nouveaux styles dans `admin-webhook-styles.css`
- Tester avec plusieurs utilisateurs

**Configuration :**
- Modifier l'email admin dans `adminEmail`
- Ajuster les règles Firestore si nécessaire
- Personnaliser les messages et interfaces

### Sauvegarde

**Export des Données :**
- Utiliser les outils Firebase Console
- Sauvegarder la collection `userWebhooks`
- Exporter les logs et métadonnées

## Support

Pour toute question ou problème :
- **Email :** support@dictamed.fr
- **Documentation :** Ce fichier
- **Logs :** Console du navigateur (F12)

---

*Dernière mise à jour : 12 décembre 2024*
*Version : 1.0.0*