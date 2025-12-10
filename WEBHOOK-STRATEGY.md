# 🎯 Stratégie Webhooks Uniques par Utilisateur - DictaMed

## 📋 **Vue d'Ensemble**

Cette stratégie permet d'assigner un lien webhook unique à chaque utilisateur inscrit via Firebase Authentication, tout en gardant ces liens invisibles pour les utilisateurs finaux. L'administrateur gère les webhooks directement via la console Firebase.

## 🔧 **Configuration Firebase Requise**

### 1. **Activation de Firestore**

1. **Accéder à la Console Firebase**
   - Aller sur [console.firebase.google.com](https://console.firebase.google.com)
   - Sélectionner le projet `dictamed-2025`

2. **Créer la Base de Données Firestore**
   - Aller dans **Firestore Database**
   - Cliquer sur **Créer une base de données**
   - Choisir le mode **Production** (sécurité renforcée)
   - Sélectionner l'emplacement : `europe-west` (France)
   - Confirmer la création

3. **Configurer les Règles de Sécurité**
```json
{
  "rules": {
    "userWebhooks": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

### 2. **Structure des Données**

**Collection principale :** `userWebhooks`

**Structure par document :**
```
userWebhooks/
  {userUID}/
    - webhookUrl: "https://votre-webhook.com/unique-user-id"
    - isActive: true
    - createdAt: timestamp
    - lastUsed: timestamp (optionnel)
    - notes: "Webhook pour Dr. Martin" (optionnel)
```

## 👤 **Gestion des Utilisateurs**

### 1. **Récupération des UserID**

1. **Accéder aux Utilisateurs**
   - Firebase Console > Authentication > Users
   - Lister tous les utilisateurs inscrits

2. **Informations Importantes**
   - **User UID** : Identifiant unique Firebase (ex: `abc123def456`)
   - **Email** : Email de l'utilisateur pour identification
   - **Date de création** : Pour traçabilité

### 2. **Assignation des Webhooks**

Pour chaque utilisateur, créer un document dans Firestore :

1. **Créer un Document**
   - Collection : `userWebhooks`
   - Document ID : `{UserUID}`
   - Champs à ajouter :
     - `webhookUrl` : URL complète du webhook
     - `isActive` : `true` (pour activer)
     - `createdAt` : Timestamp actuel

## 🔄 **Intégration Application**

### 1. **Modification du Système d'Envoi**

Remplacer les endpoints fixes dans `js/core/config.js` :

**AVANT (Endpoints fixes) :**
```javascript
ENDPOINTS: {
    normal: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
    test: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed',
    dmi: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed'
}
```

**APRÈS (Webhooks dynamiques) :**
```javascript
ENDPOINTS: {
    normal: null, // Sera récupéré depuis Firestore
    test: null,   // Sera récupéré depuis Firestore
    dmi: null     // Sera récupéré depuis Firestore
}
```

### 2. **Nouvelle Fonction de Récupération**

Créer une fonction pour récupérer le webhook utilisateur :

```javascript
class WebhookManager {
    static async getUserWebhook(userId, mode) {
        try {
            const db = firebase.firestore();
            const doc = await db.collection('userWebhooks').doc(userId).get();
            
            if (doc.exists && doc.data().isActive) {
                return doc.data().webhookUrl;
            } else {
                // Fallback vers les endpoints par défaut
                return this.getDefaultEndpoint(mode);
            }
        } catch (error) {
            console.error('Erreur récupération webhook:', error);
            return this.getDefaultEndpoint(mode);
        }
    }
    
    static getDefaultEndpoint(mode) {
        const defaults = {
            normal: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
            test: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed',
            dmi: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed'
        };
        return defaults[mode] || defaults.test;
    }
}
```

### 3. **Modification du Data Sender**

Adapter `js/components/data-sender.js` pour utiliser les webhooks dynamiques :

```javascript
// Dans la fonction d'envoi de données
const user = FirebaseAuthManager.getCurrentUser();
if (user) {
    const webhookUrl = await WebhookManager.getUserWebhook(user.uid, mode);
    // Utiliser webhookUrl au lieu de l'endpoint fixe
}
```

## 🔐 **Sécurité et Bonnes Pratiques**

### 1. **Validation des URLs**
- Vérifier que l'URL commence par `https://`
- Valider le format d'URL
- Tester la disponibilité avant assignment

### 2. **Gestion des Erreurs**
- Fallback vers endpoints par défaut si webhook invalide
- Logging des erreurs pour debugging
- Notifications admin en cas de problème

### 3. **Surveillance**
- Tracker l'utilisation des webhooks
- Monitorer les taux d'erreur
- Alerter sur les webhooks inactifs

## 📊 **Avantages de Cette Stratégie**

### ✅ **Pour l'Administrateur**
- **Gestion centralisée** via la console Firebase
- **Flexibilité totale** pour assigner/modifier les webhooks
- **Traçabilité complète** des utilisateurs et webhooks
- **Sécurité renforcée** - webhooks invisibles aux utilisateurs

### ✅ **Pour l'Application**
- **Migration transparente** depuis les endpoints fixes
- **Compatibilité totale** avec l'existant
- **Performance maintenue** - pas d'impact utilisateur
- **Extensibilité** - facile d'ajouter de nouveaux utilisateurs

### ✅ **Pour les Utilisateurs**
- **Expérience inchangée** - aucune interface supplémentaire
- **Fonctionnalités identiques** - envoi de données normal
- **Transparence totale** - pas de complexité visible

## 🚀 **Étapes de Déploiement**

### Phase 1 : Configuration Firebase (30 minutes)
1. ✅ Activer Firestore
2. ✅ Configurer les règles de sécurité
3. ✅ Créer la structure de base

### Phase 2 : Migration des Webhooks (45 minutes)
1. ✅ Identifier les utilisateurs actuels
2. ✅ Assigner les webhooks dans Firestore
3. ✅ Tester avec quelques utilisateurs pilotes

### Phase 3 : Modification Application (1 heure)
1. ✅ Créer le WebhookManager
2. ✅ Modifier le Data Sender
3. ✅ Tester les envois de données

### Phase 4 : Tests et Validation (30 minutes)
1. ✅ Tests avec différents utilisateurs
2. ✅ Vérification des fallbacks
3. ✅ Validation des logs

## 📋 **Checklist de Déploiement**

- [ ] Firestore activé et configuré
- [ ] Règles de sécurité appliquées
- [ ] Structure `userWebhooks` créée
- [ ] Utilisateurs identifiés et webhooks assignés
- [ ] WebhookManager implémenté
- [ ] Data Sender modifié
- [ ] Tests validés avec utilisateurs pilotes
- [ ] Documentation utilisateur mise à jour
- [ ] Monitoring en place

## 🎯 **Résultat Final**

Après implémentation, chaque utilisateur aura :
- Un webhook personnalisé assigné par l'admin
- Un envoi de données automatique vers son endpoint
- Une expérience utilisateur identique
- Une gestion admin simplifiée

---

**📞 Support :** En cas de problème, vérifier les logs Firebase et la console de l'application pour diagnostiquer rapidement les erreurs.