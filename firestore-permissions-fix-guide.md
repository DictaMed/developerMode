# 🔧 Guide de Correction des Permissions Firestore - DictaMed

## 📋 Résumé du Problème

**Erreur:** `Erreur Firestore: Missing or insufficient permissions`

**Causes Identifiées:**
1. Règles Firestore complexes non déployées
2. Document `adminUsers` manquant
3. Validation des permissions trop restrictive
4. UID admin non configuré dans les règles

---

## 🎯 Plan de Correction Complet

### Étape 1: Déploiement des Règles Firestore

#### Option A: Déploiement Manuel (Recommandé)
1. **Accédez à la Console Firebase:**
   ```
   https://console.firebase.google.com/project/dictamed2025/firestore/rules
   ```

2. **Copiez le contenu de `firestore.rules.simple`** (version simplifiée)

3. **Collez dans l'éditeur de règles Firebase**

4. **Cliquez sur "Publier"**

#### Option B: Déploiement via Firebase CLI
```bash
# Si Firebase CLI est installé et configuré
firebase login
firebase use dictamed2025
firebase deploy --only firestore:rules
```

### Étape 2: Création du Document adminUsers

1. **Accédez à Firestore Data:**
   ```
   https://console.firebase.google.com/project/dictamed2025/firestore/data
   ```

2. **Créez une nouvelle collection:**
   - ID de collection: `system`
   - ID de document: `adminUsers`

3. **Ajoutez les champs:**
   ```json
   {
     "adminUIDs": {
       "VOTRE_UID_ADMIN": true
     },
     "adminEmails": [
       "akio963@gmail.com"
     ],
     "createdAt": "timestamp",
     "updatedAt": "timestamp",
     "version": "1.0.0"
   }
   ```

### Étape 3: Obtention de l'UID Admin

1. **Accédez à Authentication Users:**
   ```
   https://console.firebase.google.com/project/dictamed2025/authentication/users
   ```

2. **Trouvez l'utilisateur `akio963@gmail.com`**

3. **Copiez l'UID (identifiant unique)**

4. **Mettez à jour le document adminUsers avec le vrai UID**

---

## 🔐 Vérification de Toutes les Méthodes d'Authentification

### Méthode 1: Email/Mot de Passe
```javascript
// Test de connexion email/mot de passe
const result = await firebase.auth().signInWithEmailAndPassword(
  'akio963@gmail.com', 
  'votre_mot_de_passe'
);
console.log('✅ Connexion email réussie:', result.user.email);
```

### Méthode 2: Google Sign-In
```javascript
// Test de connexion Google
const provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('email');
provider.addScope('profile');

const result = await firebase.auth().signInWithPopup(provider);
console.log('✅ Connexion Google réussie:', result.user.email);
```

### Méthode 3: Authentification Anonyme (pour tests)
```javascript
// Test d'authentification anonyme
const result = await firebase.auth().signInAnonymously();
console.log('✅ Connexion anonyme réussie:', result.user.uid);
```

---

## 🧪 Tests de Validation

### Test 1: Diagnostic Firestore
```javascript
// Ouvrez la console développeur et exécutez:
runFirestoreDiagnostic()
```

### Test 2: Diagnostic Authentification
```javascript
// Exécutez dans la console:
runAuthDiagnostic()
```

### Test 3: Page de Test
1. Ouvrez `test-firestore-permissions.html`
2. Connectez-vous avec `akio963@gmail.com`
3. Lancez le "Diagnostic Complet"
4. Vérifiez qu'aucune erreur de permissions n'apparaît

### Test 4: Interface Admin
1. Ouvrez `admin-webhooks.html`
2. Vérifiez que l'interface se charge sans erreurs
3. Testez les opérations CRUD sur les webhooks

---

## 🔍 Diagnostic Avancé

### Vérification des Règles Actives
```javascript
// Test des règles Firestore
const testAdminAccess = async () => {
  try {
    // Test lecture userProfiles
    const profiles = await firebase.firestore().collection('userProfiles').limit(1).get();
    console.log('✅ Accès userProfiles: OK');
    
    // Test lecture adminWebhooks
    const adminWebhooks = await firebase.firestore().collection('adminWebhooks').limit(1).get();
    console.log('✅ Accès adminWebhooks: OK');
    
    // Test lecture userWebhooks
    const userWebhooks = await firebase.firestore().collection('userWebhooks').limit(1).get();
    console.log('✅ Accès userWebhooks: OK');
    
  } catch (error) {
    console.error('❌ Erreur de permissions:', error.message);
  }
};

testAdminAccess();
```

### Vérification du Token d'Authentification
```javascript
// Analyse du token utilisateur
const analyzeAuthToken = async () => {
  const user = firebase.auth().currentUser;
  if (user) {
    const token = await user.getIdTokenResult();
    console.log('🔑 Token claims:', token.claims);
    console.log('📧 Email vérifié:', token.claims.email_verified);
    console.log('👤 UID:', token.claims.user_id);
  }
};

analyzeAuthToken();
```

---

## 🛠️ Correction des Problèmes Courants

### Problème 1: "Missing or insufficient permissions"

**Solutions:**
1. Vérifiez que les règles sont déployées
2. Assurez-vous d'être connecté avec le bon compte admin
3. Vérifiez que l'UID admin est correct dans adminUsers

### Problème 2: "Permission denied on doc"

**Solutions:**
1. Vérifiez que l'utilisateur est authentifié
2. Vérifiez que l'email correspond à akio963@gmail.com
3. Testez avec les règles simplifiées

### Problème 3: "Auth/unknown"

**Solutions:**
1. Vérifiez la configuration Firebase
2. Redémarrez l'application
3. Vérifiez la connexion internet

---

## 📊 Monitoring et Logs

### Activation des Logs Firebase
```javascript
// Activer les logs détaillés
firebase.firestore().enableNetwork().then(() => {
  console.log('✅ Firestore network enabled');
});

// Surveiller les erreurs
firebase.firestore().onSnapshot(null, (error) => {
  console.error('❌ Firestore error:', error);
});
```

### Logs des Opérations
```javascript
// Surveiller les opérations Firestore
const logFirestoreOperations = () => {
  const db = firebase.firestore();
  
  // Log des lectures
  db.collection('userProfiles').onSnapshot((snapshot) => {
    console.log('📖 userProfiles updated:', snapshot.size, 'docs');
  });
  
  // Log des écritures
  const originalSet = db.collection().doc().set.bind(db.collection().doc());
  db.collection().doc().set = function(data, options) {
    console.log('✏️ Firestore write:', this.path, data);
    return originalSet(data, options);
  };
};

logFirestoreOperations();
```

---

## ✅ Checklist de Validation

- [ ] Règles Firestore déployées
- [ ] Document adminUsers créé avec le bon UID
- [ ] Connexion admin testée avec akio963@gmail.com
- [ ] Tous les tests de diagnostic passent
- [ ] Interface admin-webhooks.html accessible
- [ ] Opérations CRUD sur webhooks fonctionnelles
- [ ] Aucune erreur "Missing or insufficient permissions"
- [ ] Logs Firebase sans erreurs critiques

---

## 🚀 Scripts d'Automatisation

### Script de Test Complet
```javascript
// Exécutez ce script dans la console pour tester tout
const runCompleteTest = async () => {
  console.log('🧪 Début du test complet...');
  
  // 1. Vérifier l'authentification
  const user = firebase.auth().currentUser;
  if (!user) {
    console.log('❌ Aucun utilisateur connecté');
    return;
  }
  
  console.log('✅ Utilisateur connecté:', user.email);
  
  // 2. Tester l'accès aux collections
  const collections = ['userProfiles', 'userWebhooks', 'adminWebhooks'];
  
  for (const collection of collections) {
    try {
      const snapshot = await firebase.firestore().collection(collection).limit(1).get();
      console.log(`✅ Accès ${collection}: OK`);
    } catch (error) {
      console.error(`❌ Erreur accès ${collection}:`, error.message);
    }
  }
  
  // 3. Test d'écriture
  try {
    const testDoc = firebase.firestore().collection('_permission_test').doc('test_' + Date.now());
    await testDoc.set({
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      user: user.email,
      test: 'permission_test'
    });
    console.log('✅ Test d\'écriture: OK');
    
    // Nettoyer
    await testDoc.delete();
  } catch (error) {
    console.error('❌ Test d\'écriture échoué:', error.message);
  }
  
  console.log('🏁 Test complet terminé');
};

// Exécutez: runCompleteTest()
```

---

## 📞 Support et Dépannage

### Si les problèmes persistent:

1. **Vérifiez la configuration Firebase:**
   ```javascript
   console.log('Firebase config:', firebase.app().options);
   ```

2. **Testez avec un navigateur en mode incognito**

3. **Vérifiez les quotas Firebase**

4. **Consultez les logs Firebase dans la console**

5. **Contactez le support avec les logs d'erreur**

---

## 🎯 Actions Immédiates

1. **Copiez le contenu de `firestore.rules.simple`**
2. **Déployez-le via la Console Firebase**
3. **Créez le document adminUsers**
4. **Exécutez `runCompleteTest()` dans la console**
5. **Vérifiez que l'erreur "Missing or insufficient permissions" a disparu**

Cette approche systématique devrait résoudre tous les problèmes de permissions Firestore dans votre application DictaMed.