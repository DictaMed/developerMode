# 🎛️ Système d'Administration des Webhooks - Documentation V2

## 📋 Vue d'ensemble

Le système d'administration des webhooks a été considérablement amélioré pour permettre à l'admin de gérer manuellement l'affectation des webhooks à chaque nouvel utilisateur enregistré, avec une synchronisation temps réel avec Firestore.

## ✨ Nouvelles Fonctionnalités

### 1. **Détection Automatique en Temps Réel**
- Les nouveaux utilisateurs sont détectés automatiquement dès leur inscription
- Les écouteurs Firestore (`onSnapshot`) synchronisent les données en temps réel
- Aucun rechargement manuel n'est nécessaire

### 2. **Interface Améliorée**
- **Statistiques en direct**: Affichage du nombre total d'utilisateurs, configurés et en attente
- **Recherche et filtrage**: Rechercher les utilisateurs par email ou nom
- **Trois vues principales**:
  - ⏳ **En Attente**: Utilisateurs sans webhook configuré
  - ✅ **Configurés**: Utilisateurs avec webhook assigné
  - 👥 **Tous**: Liste complète de tous les utilisateurs

### 3. **Attribution Manuelle des Webhooks**
- Pour chaque utilisateur, l'admin peut:
  - **Assigner un webhook**: Entrer l'URL du webhook n8n
  - **Ajouter des notes**: Commentaires personnalisés (optionnel)
  - **Tester le webhook**: Vérifier que la connexion fonctionne
  - **Supprimer le webhook**: Revenir à l'état "En Attente"

### 4. **Notifications en Temps Réel**
- Notifications toast qui s'affichent pour:
  - Nouvel utilisateur enregistré ✨
  - Webhook configuré ✅
  - Webhook supprimé ❌
  - Erreurs et messages d'information

### 5. **Synchronisation Bidirectionnelle**
- Les changements effectués par l'admin sont immédiatement synchronisés avec Firestore
- Les changements dans Firestore sont automatiquement reflétés dans l'interface
- Pas de délai ni de cache stagnant

## 🏗️ Architecture

### Composants Principaux

#### 1. **AdminWebhookManagerEnhancedV2** (`admin-webhook-manager-enhanced-v2.js`)
Classe principale responsable de:
- Initialisation et authentification
- Configuration des écouteurs Firestore en temps réel
- Gestion des opérations CRUD sur les webhooks
- Rendu de l'interface utilisateur
- Gestion des notifications

#### 2. **Firestore Collections**

```
userProfiles/{userId}
├── uid: string (ID utilisateur)
├── email: string
├── displayName: string
├── profession: string (medecin, infirmier, secretaire, administrateur)
├── createdAt: timestamp
└── lastUpdated: timestamp

userWebhooks/{userId}
├── userId: string (ID utilisateur)
├── webhookUrl: string (URL n8n)
├── isActive: boolean
├── notes: string (optionnel)
├── createdAt: timestamp
├── updatedAt: timestamp
├── updatedBy: string (email admin)
├── lastUsed: timestamp (optionnel)
└── testStatus: string (optionnel)
```

#### 3. **Règles Firestore**

Nouvelles règles permettant l'admin d'assigner des webhooks:

```javascript
// L'admin peut créer des webhooks pour n'importe quel utilisateur
allow create: if (isOwner(userId) && validateUserWebhook(...)) ||
                 (isAdmin() && validateAdminWebhookAssignment(...));

// Validation pour l'assignation par l'admin
function validateAdminWebhookAssignment(data) {
  return data.keys().hasAll(['userId', 'webhookUrl', 'isActive']) &&
         isValidString(data.webhookUrl, 10, 500) &&
         data.webhookUrl.matches('^https?://.*');
}
```

## 📱 Interface Utilisateur

### Layout Principal

```
┌─────────────────────────────────────────────┐
│ 🎛️ Gestion des Webhooks                    │
│ Attribution manuelle avec sync Firestore    │
├─────────────────────────────────────────────┤
│ Statistiques: 45 Total | 38 Configurés | 7 En Attente
├─────────────────────────────────────────────┤
│ 🔍 [Rechercher par email...]                │
│ [⏳ En Attente] [✅ Configurés] [👥 Tous]   │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ 👤 Jean Dupont (jean@example.com)       │ │
│ │ Inscrit: 15/12/2024                     │ │
│ │ Status: ✅ Configuré                    │ │
│ │                                         │ │
│ │ URL: https://n8n.example.com/webhook... │ │
│ │ Mis à jour: 15/12/2024 10:30            │ │
│ │                                         │ │
│ │ [✏️ Configurer] [🧪 Test] [🗑️ Supprimer] │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ [Autres utilisateurs...]                    │
└─────────────────────────────────────────────┘
```

### Modal d'Assignation

```
┌────────────────────────────────┐
│ Assignation de Webhook     [✕] │
├────────────────────────────────┤
│ Email Utilisateur              │
│ [jean@example.com]            │
│                                │
│ Nom Utilisateur                │
│ [Jean Dupont]                 │
│                                │
│ URL Webhook *                  │
│ [https://...]                 │
│ Doit commencer par https://    │
│                                │
│ Notes (optionnel)              │
│ [Texte libre...]              │
│                                │
│         [💾 Sauvegarder] [Annuler] │
└────────────────────────────────┘
```

## 🔄 Flux de Travail

### 1. Nouvel utilisateur s'inscrit

```
Utilisateur → Firebase Auth
    ↓
Cloud Firestore (userProfiles/{userId})
    ↓
AdminWebhookManagerEnhancedV2 (onSnapshot)
    ↓
Affichage dans "En Attente"
    ↓
Toast: "✨ Nouvel utilisateur: email@example.com"
```

### 2. Admin assigne un webhook

```
Admin clique "✏️ Configurer"
    ↓
Modal s'ouvre
    ↓
Admin entre URL + notes optionnel
    ↓
Clique "💾 Sauvegarder"
    ↓
Firestore: userWebhooks/{userId}
    ↓
onSnapshot détecte le changement
    ↓
Interface se rafraîchit
    ↓
Toast: "✅ Webhook assigné à email@example.com"
```

### 3. Admin teste le webhook

```
Admin clique "🧪 Test"
    ↓
AdminWebhookManagerEnhancedV2.testWebhook()
    ↓
POST request → webhook URL
    ↓
Toast: "✅ Test webhook réussi!" (succès)
    ↓
Toast: "❌ Test échoué: ..." (erreur)
```

## 💻 Utilisation Technique

### Initialisation

```javascript
// Dans admin-webhooks.html
const adminManager = new AdminWebhookManagerEnhancedV2();
const success = await adminManager.init();

if (!success) {
    console.error('Échec de l\'initialisation');
}
```

### Écouteurs Firestore

```javascript
// Configuration automatique des écouteurs temps réel
setupRealtimeListeners() {
    const db = firebase.firestore();

    // Écouteur userProfiles
    db.collection('userProfiles').onSnapshot(snapshot => {
        this.handleProfilesSnapshot(snapshot);
    });

    // Écouteur userWebhooks
    db.collection('userWebhooks').onSnapshot(snapshot => {
        this.handleWebhooksSnapshot(snapshot);
    });
}
```

### Assignation de Webhook

```javascript
// API simple pour assigner un webhook
await adminManager.assignWebhook(
    userId,
    'https://n8n.example.com/webhook/xxxxx',
    'Notes optionnelles'
);
```

### Test de Webhook

```javascript
// Teste la connectivité du webhook
const success = await adminManager.testWebhook(userId);
// Retourne: true (succès) ou false (erreur)
```

## 🔒 Sécurité

### Authentification
- Seul l'utilisateur `akio963@gmail.com` peut accéder à l'admin
- Vérification Firebase Auth obligatoire

### Autorisations Firestore
```javascript
// Règles de base
isAdmin() → email === 'akio963@gmail.com'
isOwner(userId) → auth.uid === userId

// userWebhooks
allow create: (admin avec validateAdminWebhookAssignment)
allow read: (owner ou admin)
allow update: (owner ou admin)
allow delete: (owner ou admin)
```

### Validation
- URL webhook: doit être HTTPS ou HTTP valide
- Email: validé par Firebase
- Timestamp: contrôlé par le serveur
- Toutes les modifications incluent `updatedBy` (email admin)

## 📊 Statistiques et Monitoring

### Compteurs en Temps Réel

```javascript
this.stats = {
    totalUsers: 0,           // Nombre total d'utilisateurs
    configuredWebhooks: 0,   // Nombre avec webhook assigné
    pendingWebhooks: 0,      // Nombre en attente
    lastSync: null,          // Dernière synchronisation
    syncCount: 0             // Nombre de syncs effectuées
};
```

### Synchronisation Automatique
- Tous les 60 secondes: mise à jour des statistiques
- Écouteurs Firestore: mises à jour instantanées
- Bouton manuel: force la synchronisation immédiate

## 🛠️ Maintenance

### Pour tester localement

1. Connectez-vous avec `akio963@gmail.com`
2. Accédez à `/admin-webhooks.html`
3. Créez des utilisateurs de test
4. Assignez des webhooks
5. Vérifiez la synchronisation avec Firestore

### Pour mettre en production

1. Déployez les nouvelles règles Firestore:
```bash
firebase deploy --only firestore:rules
```

2. Vérifiez que le script est chargé:
```html
<script src="js/components/admin-webhook-manager-enhanced-v2.js"></script>
```

3. Testez l'authentification admin et les permissions

## 📝 Fichiers Modifiés/Créés

### Nouveaux fichiers
- `js/components/admin-webhook-manager-enhanced-v2.js` (v4.0.0)
- `css/admin-panel-v2.css`

### Fichiers modifiés
- `admin-webhooks.html` (référence au nouveau manager)
- `firestore.rules` (nouvelles fonctions de validation)

## 🔗 Liens Utiles

- Firestore Console: https://console.firebase.google.com/project/dictamed2025/firestore
- Admin Webhooks: `/admin-webhooks.html`
- n8n Webhooks: https://n8n.srv1104707.hstgr.cloud/

## ❓ FAQ

**Q: Comment un nouvel utilisateur est-il détecté?**
A: Via l'écouteur `db.collection('userProfiles').onSnapshot()` qui appelle `handleProfilesSnapshot()` automatiquement.

**Q: Que se passe-t-il si un webhook échoue?**
A: L'admin peut cliquer "🧪 Test" pour voir le message d'erreur exact et corriger l'URL.

**Q: Les utilisateurs peuvent-ils voir le webhook assigné?**
A: Non, les webhooks sont stockés dans une collection séparée que seul l'admin et le propriétaire peuvent voir.

**Q: Comment ajouter un nouvel admin?**
A: Modifier `this.adminEmail` et `isAdmin()` dans les règles Firestore.

## 📞 Support

Pour des problèmes:
1. Vérifiez la console du navigateur (F12)
2. Vérifiez les règles Firestore dans Firebase Console
3. Assurez-vous que Firestore est initialisé correctement
4. Vérifiez que l'utilisateur est authentifié avec le bon email

---

**Version**: 4.0.0
**Dernière mise à jour**: 2025-12-13
**Admin**: akio963@gmail.com
