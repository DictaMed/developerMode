# Guide de Test: Correction de l'Authentification

**Objectif**: Vérifier que la persistance de l'état d'authentification fonctionne correctement après les corrections apportées.

---

## 🧪 Test 1: Connexion avec Email/Password

### Étapes:
1. **Ouvrez la console navigateur** (F12 → Console)
2. **Nettoyez la console** avec `console.clear()`
3. **Allez à l'onglet "Connexion"**
4. **Entrez vos identifiants de test**:
   - Email: `test@example.com` (ou un email valide)
   - Mot de passe: `YourPassword123!`
5. **Cliquez sur "Se connecter"**
6. **Attendez la redirection vers Mode Normal** (1.5 secondes)

### ✅ Vérifications du Succès:

**Dans la console:**
```
✅ "Vous êtes connecté avec succès!"
✅ Voir les logs: "signin_success"
```

**Dans l'UI:**
- [ ] ✅ Le bouton "Connexion" a disparu
- [ ] ✅ Le nom de l'utilisateur s'affiche dans la navigation
- [ ] ✅ Vous êtes redirigé en Mode Normal
- [ ] ✅ L'interface affiche les options d'enregistrement audio

**Test du getCurrentUser():**
Tapez dans la console:
```javascript
window.FirebaseAuthManager.getCurrentUser()
```

Vous devriez voir:
```javascript
{
  uid: "...",
  email: "test@example.com",
  displayName: "...",
  ...
}
```

❌ Si vous voyez `null`, le fix n'a pas fonctionné.

---

## 🧪 Test 2: Soumission de Données Après Authentification

### Étapes:
1. **Vous êtes maintenant en Mode Normal** (après connexion réussie)
2. **Enregistrez de l'audio** dans une ou plusieurs sections
3. **Remplissez les champs requis** (si nécessaire)
4. **Cliquez sur "Envoyer les données"**

### ✅ Vérifications du Succès:

**Dans la console:**
- ✅ Aucune erreur "User not authenticated"
- ✅ Voir: "Sending data..." suivi de "Data sent successfully"

**Dans l'UI:**
- [ ] ✅ Le bouton "Envoyer les données" devient actif
- [ ] ✅ Vous pouvez cliquer dessus
- [ ] ✅ Les données sont soumises avec succès

❌ **Si vous voyez**:
```
Error: User not authenticated. Please sign in first.
```

→ Le fix n'a pas fonctionné, contactez le support.

---

## 🧪 Test 3: Connexion Google

### Étapes:
1. **Déconnectez-vous** (si connecté)
2. **Allez à l'onglet "Connexion"**
3. **Cliquez sur "Se connecter avec Google"**
4. **Authentifiez-vous avec votre compte Google**
5. **Acceptez les permissions**

### ✅ Vérifications du Succès:

**Dans la console:**
```
✅ "Connecté avec Google avec succès!"
✅ Voir les logs: "google_signin_success"
```

**Dans l'UI:**
- [ ] ✅ Le bouton "Connexion" a disparu
- [ ] ✅ Votre nom Google s'affiche dans la navigation
- [ ] ✅ Vous êtes redirigé en Mode Normal
- [ ] ✅ Vous pouvez enregistrer et soumettre des données

**Test du getCurrentUser():**
```javascript
window.FirebaseAuthManager.getCurrentUser()
```

Vous devriez voir votre compte Google.

---

## 🧪 Test 4: Persistance Après Refresh

### Étapes:
1. **Vous êtes connecté** (après Test 1 ou Test 3)
2. **Rafraîchissez la page** (F5 ou Ctrl+R)

### ✅ Vérifications du Succès:

**Immédiatement après le refresh:**
- [ ] ✅ Vous devriez **RESTER connecté**
- [ ] ✅ Le bouton "Connexion" reste caché
- [ ] ✅ Votre nom reste affiché
- [ ] ✅ `getCurrentUser()` retourne toujours votre utilisateur

❌ **Problème**: Si le bouton "Connexion" réapparaît, la persistence ne fonctionne pas.

Vérifiez dans la console:
```javascript
// Cela devrait retourner votre utilisateur, pas null
window.FirebaseAuthManager.getCurrentUser()
```

---

## 🧪 Test 5: Déconnexion

### Étapes:
1. **Vous êtes connecté**
2. **Cliquez sur votre nom/profil dans la navigation**
3. **Sélectionnez "Déconnexion"** (si disponible)
4. Ou trouvez le bouton de déconnexion

### ✅ Vérifications du Succès:

**Dans la console:**
```
✅ "Vous êtes déconnecté"
✅ Voir les logs: "user_signed_out"
```

**Dans l'UI:**
- [ ] ✅ Le bouton "Connexion" réapparaît
- [ ] ✅ Votre nom disparaît
- [ ] ✅ L'interface affiche les options de connexion
- [ ] ✅ `getCurrentUser()` retourne `null`

---

## 📊 Logs Attendus Lors de la Connexion

### Après avoir cliqué sur "Se connecter":

```
🔄 [STOP EVENT] Checking if updateSectionCount should be called
✅ [STOP EVENT] Calling updateSectionCount()

📊 Section count updated for mode normal: 0 recording(s)
✅ Updated counter element in normal mode: "0 section(s) enregistrée(s)"
✅ Submit button ENABLED for mode normal

✅ "Vous êtes connecté avec succès!"

🔄 Redirection automatique vers Mode Normal
```

---

## 🐛 Dépannage

### ❌ Problème: "User not authenticated" lors de la soumission

**Solution:**
1. Ouvrez la console (F12)
2. Tapez: `window.FirebaseAuthManager.getCurrentUser()`
3. Si vous voyez `null`, le user n'a pas été sauvegardé
4. Vérifiez que vous êtes connecté (le bouton "Connexion" doit être caché)

### ❌ Problème: Le bouton "Connexion" persiste après connexion

**Solution:**
1. Vérifiez dans la console: `window.FirebaseAuthManager.getCurrentUser()`
2. Si vous voyez un objet utilisateur, c'est un bug d'affichage UI
3. Rafraîchissez la page (F5) - cela devrait corriger le problème

### ❌ Problème: Pas connecté après rafraîchissement

**Solution:**
1. Cela signifie que Firebase n'a pas restauré la session
2. Vérifiez dans la console: `window.FirebaseAuthManager.currentUser`
3. Reconnectez-vous
4. Attendez quelques secondes avant de rafraîchir (pour que Firebase sauvegarde la session)

### ✅ Tout fonctionne?

Si tous les tests ci-dessus passent, la correction fonctionne correctement! 🎉

---

## 📋 Checklist Complète

- [ ] Test 1 - Connexion email/password réussie
- [ ] Test 2 - Soumission de données après connexion
- [ ] Test 3 - Connexion Google réussie
- [ ] Test 4 - Persistance après refresh
- [ ] Test 5 - Déconnexion réussie

**Si tous les tests passent**: ✅ Authentication fix is working correctly!

---

**Dernière mise à jour**: 14 Décembre 2025
