# Guide de Déploiement des Règles Firestore Mise à Jour

## 🎯 Objectif

Déployer les nouvelles règles Firestore qui permettent à la collection `users` de fonctionner correctement et résolvent l'erreur:
```
FirebaseError: Missing or insufficient permissions
```

## 📋 Prérequis

- Accès administrateur au projet Firebase (`dictamed2025`)
- Firebase CLI installé (`npm install -g firebase-tools`)
- Accès SSH/SSH key configuré pour GitHub

## 🚀 Méthode 1 : Avec Firebase CLI (RECOMMANDÉE)

### Étape 1 : Se connecter à Firebase
```bash
firebase login
```
- Cliquez sur le lien pour autoriser Firebase CLI
- Confirmez que vous êtes connecté

### Étape 2 : Sélectionner le projet
```bash
firebase use dictamed2025
```
Vous devriez voir:
```
✓ Now using project dictamed2025
```

### Étape 3 : Déployer les règles
```bash
firebase deploy --only firestore:rules
```

### Résultat attendu
```
✓ firestore:rules deployed successfully

Viewing Firestore Security Rules at:
https://console.firebase.google.com/project/dictamed2025/firestore/rules
```

---

## 🌐 Méthode 2 : Via Firebase Console (Interface Web)

### Étape 1 : Ouvrir la console Firebase
Allez à: https://console.firebase.google.com/project/dictamed2025/firestore/rules

### Étape 2 : Copier les nouvelles règles
1. Ouvrez le fichier `firestore.rules` dans votre éditeur
2. Copiez tout le contenu du fichier

### Étape 3 : Remplacer les règles
1. Dans la Console Firebase, supprimez le contenu existant
2. Collez les nouvelles règles
3. Cliquez sur **"Publier"**

### Étape 4 : Confirmation
```
✓ Règles publiées avec succès le [DATE] [HEURE]
```

---

## ✅ Vérification du Déploiement

### 1. Vérifier que le déploiement est actif
Dans la Console Firebase, vérifiez la date de dernière modification:
- URL: `https://console.firebase.google.com/project/dictamed2025/firestore/rules`
- Vous devriez voir: "Last published: [MAINTENANT]"

### 2. Tester les permissions dans le navigateur
```javascript
// Ouvrir la console du navigateur (F12)
// Copier et exécuter:

const testUser = firebase.auth().currentUser;
console.log('Utilisateur connecté:', testUser?.email);

// Test de lecture du profil
window.db.collection('users').doc(testUser.uid).get()
  .then(doc => {
    if (doc.exists) {
      console.log('✅ Lecture des données utilisateur: SUCCÈS');
      console.log('Données:', doc.data());
    } else {
      console.log('⚠️ Document utilisateur n\'existe pas');
    }
  })
  .catch(error => {
    console.error('❌ Erreur:', error.message);
  });
```

### 3. Tester la création de profil
```javascript
// Test de création de profil
const testProfile = {
  uid: testUser.uid,
  email: testUser.email,
  displayName: testUser.displayName || 'Test User',
  photoURL: testUser.photoURL || '',
  provider: 'google',
  profession: '',
  createdAt: new Date(),
  lastLogin: new Date(),
  emailVerified: testUser.emailVerified,
  twoFactorEnabled: false
};

window.db.collection('users').doc(testUser.uid).set(testProfile, { merge: true })
  .then(() => {
    console.log('✅ Création du profil: SUCCÈS');
  })
  .catch(error => {
    console.error('❌ Erreur:', error.message);
  });
```

---

## 📝 Changements Effectués

### Avant
```firestore-rules
// Aucune règle pour la collection "users"
// Erreur: "Missing or insufficient permissions"
```

### Après
```firestore-rules
// Collection "users" - Profils utilisateurs (principale)
match /users/{userId} {
  // Lecture: propriétaire ou admin
  allow read: if isOwner(userId) || isAdmin();

  // Création: utilisateur authentifié
  allow create: if isOwner(userId) && isAuthenticated();

  // Mise à jour: propriétaire ou admin
  allow update: if (isOwner(userId) || isAdmin()) && isAuthenticated();

  // Suppression: uniquement admin
  allow delete: if isAdmin();

  // Sous-collections 2FA et devices
  match /twoFactorConfig/{document=**} {
    allow read, write: if isOwner(userId) && isAuthenticated();
  }

  match /devices/{deviceId} {
    allow read, write: if isOwner(userId) && isAuthenticated();
  }
}
```

---

## 🔧 Troubleshooting

### Erreur : "You don't have permission to deploy rules"
**Solution:**
```bash
# Vérifier que vous êtes connecté au bon compte
firebase logout
firebase login

# Vérifier les permissions dans Firebase Console
# Allez à: https://console.firebase.google.com/project/dictamed2025/settings/iam
# Vous devez avoir le rôle "Editor" ou "Firebase Admin"
```

### Erreur : "Could not deploy because there were errors in your rules"
**Solution:**
1. Vérifiez la syntaxe du fichier `firestore.rules`
2. Utilisez Firebase Console pour voir les erreurs exactes
3. Corrigez les erreurs et réessayez

### L'erreur "Missing or insufficient permissions" persiste
**Solution:**
1. **Videz le cache navigateur** (Ctrl+Maj+Suppr)
2. **Actualisez la page** (Ctrl+F5)
3. **Déconnectez-vous et reconnectez-vous** avec votre compte Google
4. **Attendez 1-2 minutes** que les règles se propagent

---

## 📊 Impact des Changements

| Aspect | Avant | Après |
|--------|-------|-------|
| Collection `users` | ❌ Non accessible | ✅ Accessible (propres données) |
| Lecture profil | ❌ Permission refusée | ✅ Propriétaire peut lire |
| Écriture profil | ❌ Permission refusée | ✅ Propriétaire peut écrire |
| 2FA data | ❌ Non accessible | ✅ Accessible |
| Device list | ❌ Non accessible | ✅ Accessible |

---

## 🔐 Sécurité

Les nouvelles règles maintiennent les standards de sécurité:
- ✅ Les utilisateurs ne peuvent accéder qu'à leurs propres données
- ✅ Les admins ont accès complet
- ✅ Authentification requise pour tous les accès
- ✅ Validation des données sur le serveur Firestore

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Consultez les logs Firebase Console
2. Vérifiez la Console du Navigateur (F12)
3. Vérifiez votre adresse email pour les notifications Firebase
4. Consultez la documentation: https://firebase.google.com/docs/firestore/security

---

## ✨ Prochaines Étapes

Après le déploiement réussi:
1. ✅ Testez la connexion Google Sign-In
2. ✅ Vérifiez que le profil utilisateur est créé
3. ✅ Vérifiez que la 2FA fonctionne
4. ✅ Testez la lecture des appareils de confiance

Vous pouvez maintenant utiliser la fonction Google Sign-In sans l'erreur de permissions!
