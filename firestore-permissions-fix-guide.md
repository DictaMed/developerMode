# 🔧 Guide de Dépannage - Erreur Firestore: Missing or insufficient permissions

## 🎯 Problème Identifié

L'erreur **"❌ Erreur Firestore: Missing or insufficient permissions"** en mode admin est causée par des règles de sécurité Firestore trop restrictives.

## 🔍 Cause Racine

Les règles Firestore dans `firestore.rules` utilisaient une fonction `isAdminUser()` qui vérifiait :
1. `request.auth.token.admin == true` (claim non configuré)
2. `request.auth.token.role == 'admin'` (claim non configuré)  
3. `request.auth.uid in get(/databases/$(database)/documents/adminUsers).data.adminUIDs` (document manquant)

## ✅ Solutions Appliquées

### 1. Règles Firestore Modifiées

Les règles ont été mises à jour pour être plus flexibles :

```javascript
function isAdminUser() {
  // Méthode 1: Vérification par email admin (PRIMAIRE)
  return request.auth != null && 
         request.auth.token.email == 'akio963@gmail.com' ||
         // Méthode 2: Claims admin dans le token (si configurés)
         request.auth.token.admin == true || 
         request.auth.token.role == 'admin' ||
         // Méthode 3: Vérification par document adminUsers (fallback)
         (request.auth != null && 
          get(/databases/$(database)/documents/adminUsers).data.adminUIDs[request.auth.uid] == true);
}
```

### 2. Script de Déploiement Créé

Le fichier `deploy-firestore-rules.js` a été créé pour faciliter le déploiement des règles.

### 3. Script de Diagnostic Créé

Le fichier `firestore-permission-diagnostic.js` permet de diagnostiquer les problèmes de permissions.

## 🚀 Instructions de Déploiement

### Méthode 1: Firebase CLI (Recommandée)

```bash
# 1. Installer Firebase CLI si ce n'est pas fait
npm install -g firebase-tools

# 2. Se connecter à Firebase
firebase login

# 3. Sélectionner le projet
firebase use dictamed2025

# 4. Déployer les règles Firestore
firebase deploy --only firestore:rules
```

### Méthode 2: Console Firebase

1. Aller sur [Console Firebase](https://console.firebase.google.com/project/dictamed2025/firestore/rules)
2. Copier le contenu du fichier `firestore.rules`
3. Coller dans l'éditeur de règles
4. Cliquer sur "Publier"

### Méthode 3: Script Node.js

```bash
# Installer les dépendances
npm install firebase-admin

# Exécuter le script de déploiement
node deploy-firestore-rules.js
```

## 🔍 Diagnostic et Vérification

### 1. Lancer le Diagnostic

Dans la console du navigateur (admin-webhooks.html) :

```javascript
// Charger le script de diagnostic
<script src="firestore-permission-diagnostic.js"></script>

// Lancer le diagnostic
runFirestoreDiagnostic()
```

### 2. Vérification Manuelle

1. **Connectez-vous** avec `akio963@gmail.com`
2. **Accédez à** `admin-webhooks.html`
3. **Vérifiez** que l'erreur a disparu
4. **Testez** les fonctionnalités admin

### 3. Indicateurs de Succès

✅ **Firebase**: OK  
✅ **Auth**: OK  
✅ **Firestore**: OK  
✅ **Admin Access**: AUTORISÉ  

## 🛠️ Si le Problème Persiste

### 1. Vérifier l'Authentification

```javascript
// Dans la console du navigateur
console.log('Utilisateur actuel:', firebase.auth().currentUser);
```

### 2. Vérifier les Règles

```javascript
// Test de lecture Firestore
firebase.firestore().collection('userProfiles').limit(1).get()
  .then(snapshot => console.log('✅ Lecture OK'))
  .catch(error => console.error('❌ Erreur:', error));
```

### 3. Regarder les Logs Firebase

1. Aller sur [Console Firebase](https://console.firebase.google.com/project/dictamed2025/firestore/data)
2. Vérifier les logs d'erreurs
3. Regarder les tentatives d'accès refusées

## 📋 Checklist de Résolution

- [ ] Règles Firestore déployées
- [ ] Utilisateur connecté avec `akio963@gmail.com`
- [ ] Email vérifié dans Firebase Auth
- [ ] Page `admin-webhooks.html` rechargée
- [ ] Diagnostic Firestore passé avec succès
- [ ] Aucune erreur "Missing or insufficient permissions"

## 🔧 Configuration Avancée (Optionnel)

### Créer le Document adminUsers

Si vous préférez utiliser le document Firestore plutôt que l'email :

```javascript
// Via la console Firebase ou un script
firebase.firestore().collection('system').doc('adminUsers').set({
  adminUIDs: {
    'VOTRE_UID_ICI': true
  },
  adminEmails: ['akio963@gmail.com'],
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

### Configurer les Custom Claims

Pour une sécurité renforcée :

```javascript
// Script admin pour configurer les claims
const user = await admin.auth().getUserByEmail('akio963@gmail.com');
await admin.auth().setCustomUserClaims(user.uid, {
  admin: true,
  role: 'admin'
});
```

## 📞 Support

Si vous rencontrez encore des problèmes :

1. **Vérifiez** que vous utilisez le bon compte email
2. **Consultez** les logs Firebase
3. **Lancez** le diagnostic complet
4. **Contactez** le support avec les logs d'erreur

---

**Fichier créé le**: 2025-12-13 20:38:00  
**Version**: 1.0  
**Statut**: ✅ Solutions appliquées