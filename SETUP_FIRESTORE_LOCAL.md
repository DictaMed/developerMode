# 🚀 Guide Complet - Setup Firestore Automatique (Node.js)

Guide pour configurer Firestore automatiquement avec un script Node.js local.

---

## ⚡ Démarrage Rapide (5 minutes)

### 1. Télécharger la Clé Firebase

```bash
# Aller à Firebase Console
# https://console.firebase.google.com/project/dictamed2025/settings/serviceaccounts/adminsdk

# Cliquer: "Générer une nouvelle clé privée"
# Sauvegarder: serviceAccountKey.json dans le dossier du projet
```

**Fichier attendu**: `serviceAccountKey.json`

### 2. Installer les Dépendances

```bash
# Aller dans le dossier du projet
cd c:\DictaMed\developerMode

# Installer les packages
npm install
```

### 3. Exécuter le Setup

```bash
# Lancer le script
npm run setup

# OU directement
node setup-firestore.js
```

### 4. C'est Fait! ✅

```
🎉 Configuration Firestore Réussie!
✅ 7 Collections créées
✅ Documents de test ajoutés
✅ Système prêt à l'emploi
```

---

## 📋 Prérequis

- ✅ Node.js 14+ installé
- ✅ npm ou yarn
- ✅ Accès Firebase Console
- ✅ Clé de service Firebase (serviceAccountKey.json)
- ✅ Projet Firebase "dictamed2025" actif

### Vérifier Node.js

```bash
node --version
# Doit afficher: v14.0.0 ou supérieur

npm --version
# Doit afficher: 6.0.0 ou supérieur
```

---

## 📁 Fichiers Nécessaires

```
c:\DictaMed\developerMode\
├── setup-firestore.js          (Script principal)
├── package.json                 (Dépendances)
├── serviceAccountKey.json       (À télécharger)
└── node_modules/               (Créé après npm install)
```

---

## 🔑 Obtenir serviceAccountKey.json

### Étape 1: Aller à Firebase Console

```
URL: https://console.firebase.google.com/project/dictamed2025/settings/serviceaccounts/adminsdk
```

### Étape 2: Cliquer sur "Générer une nouvelle clé privée"

```
Vue: Project Settings → Service Accounts
Bouton: "Générer une nouvelle clé privée" (ou "Generate new private key")
```

### Étape 3: Sauvegarder le Fichier

```
Le fichier serviceAccountKey.json est téléchargé
Placer dans: c:\DictaMed\developerMode\serviceAccountKey.json
```

### Étape 4: Vérifier le Fichier

```bash
# Vérifier que le fichier existe
dir serviceAccountKey.json

# Contenu attendu:
{
  "type": "service_account",
  "project_id": "dictamed2025",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----...",
  "client_email": "firebase-adminsdk-...@dictamed2025.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

⚠️ **IMPORTANT**: Gardez ce fichier secret! Ne le commitez pas dans Git.

---

## 📦 Installation des Dépendances

### Étape 1: Vérifier package.json

```bash
# Vérifier que le fichier existe
cat package.json
```

### Étape 2: Installer les Packages

```bash
# Installer firebase-admin
npm install

# Résultat attendu:
# added 50 packages in 10s
```

### Étape 3: Vérifier l'Installation

```bash
# Vérifier que node_modules existe
dir node_modules

# Doit contenir: firebase-admin, ...
```

---

## ▶️ Exécuter le Setup

### Commande Simple

```bash
npm run setup
```

### Commande Directe

```bash
node setup-firestore.js
```

### Résultat Attendu

```
=== DictaMed - Configuration Firestore ===
ℹ️  Version: 1.0.0
ℹ️  Timestamp: 13/12/2025 14:30:45

=== Création des Collections ===

1️⃣  Configuration userProfiles
ℹ️  ✓ Ajouté: Admin User
ℹ️  ✓ Ajouté: Dr. Jean Dupont
ℹ️  ✓ Ajouté: Marie Dupont
✅ Collection userProfiles créée avec 3 documents

2️⃣  Configuration userWebhooks
ℹ️  ✓ Webhook assigné à: Dr. Jean Dupont
ℹ️  ✓ Webhook assigné à: Marie Dupont
✅ Collection userWebhooks créée avec 2 webhooks

3️⃣  Configuration userSessions
ℹ️  ✓ Session de test créée
✅ Collection userSessions créée

... (collections 4-7)

=== Vérification de la Configuration ===

📊 Résumé des Collections:

  ✅ userProfiles          → 3 documents
  ✅ userWebhooks          → 2 documents
  ✅ userSessions          → 1 document
  ✅ auditLogs             → 1 document
  ✅ webhookLogs           → 1 document
  ✅ system                → 1 document
  ✅ _diagnostic           → 1 document

  📈 Total: 10 documents

╔════════════════════════════════════════════╗
║                                            ║
║  🎉 Configuration Firestore Réussie!      ║
║                                            ║
║  ✅ 7 Collections créées                  ║
║  ✅ Documents de test ajoutés              ║
║  ✅ Système prêt à l'emploi                ║
║                                            ║
╚════════════════════════════════════════════╝

Utilisateurs de test créés:
  👤 Admin User (akio963@gmail.com)
  👨‍⚕️ Dr. Jean Dupont (medecin@example.com)
  👩‍⚕️ Marie Dupont (infirmier@example.com)

Prochaines étapes:
  1. Ouvrir: /admin-webhooks.html
  2. Se connecter: akio963@gmail.com
  3. Voir les utilisateurs créés
  4. Assigner d'autres webhooks si besoin
```

---

## 🎯 Ce que le Script Crée

### Collections Créées (7)

```
✅ userProfiles
   ├─ admin123 (Admin User)
   ├─ medecin123 (Dr. Jean Dupont)
   └─ infirmier123 (Marie Dupont)

✅ userWebhooks
   ├─ medecin123 (Webhook pour Dr. Jean Dupont)
   └─ infirmier123 (Webhook pour Marie Dupont)

✅ userSessions (1 session de test)
✅ auditLogs (1 log d'initialisation)
✅ webhookLogs (1 log webhook)
✅ system (Configuration globale)
✅ _diagnostic (1 document diagnostic)
```

### Utilisateurs de Test

| Email | Rôle | Statut |
|-------|------|--------|
| akio963@gmail.com | Admin | Créé |
| medecin@example.com | Médecin | Webhook assigné |
| infirmier@example.com | Infirmier | Webhook assigné |

---

## 🔍 Vérifier la Configuration

### Dans Firebase Console

```
1. Aller à: https://console.firebase.google.com/project/dictamed2025/firestore/data
2. Vérifier que les collections sont présentes
3. Vérifier que les documents s'affichent
4. Vérifier les champs de chaque document
```

### Dans le Terminal

```bash
# Relancer le script (skip les collections existantes)
npm run setup

# Résultat: Les collections existantes sont skippées ✅
```

### Dans l'Admin Panel

```
1. Ouvrir: /admin-webhooks.html
2. Se connecter: akio963@gmail.com
3. Vérifier: 3 utilisateurs dans le tableau
4. Vérifier: 2 webhooks configurés
```

### Avec le Test Automatisé

```javascript
// Dans la console du navigateur (F12)
window.runAdminWebhookTests()

// Résultat attendu: ✅ 90%+ de réussite
```

---

## ⚙️ Options et Arguments

### Script de Base

```bash
node setup-firestore.js
```

Crée les collections et documents.

### Avec Reset (À venir)

```bash
node setup-firestore.js --reset
```

Réinitialise les données (à implémenter).

### Avec Vérification

```bash
npm run verify
```

Vérifie la configuration sans modifier (à implémenter).

---

## 🐛 Troubleshooting

### Erreur: "serviceAccountKey.json not found"

```
❌ Fichier serviceAccountKey.json non trouvé!
Téléchargez-le depuis: Firebase Console → Project Settings → Service Accounts → Generate
```

**Solution**:
1. Télécharger serviceAccountKey.json depuis Firebase
2. Placer dans le même dossier que setup-firestore.js
3. Relancer le script

### Erreur: "ENOENT: no such file or directory, open 'serviceAccountKey.json'"

```
❌ Erreur initialisation Firebase: ENOENT: no such file...
```

**Solution**: Même que ci-dessus.

### Erreur: "project_id is missing"

```
❌ Erreur initialisation Firebase: project_id is missing
```

**Solution**:
- Vérifier que serviceAccountKey.json est valide
- Vérifier qu'il n'y a pas d'erreurs de syntaxe JSON
- Télécharger une nouvelle clé

### Erreur: "Permission denied" en Firestore

```
❌ Erreur userProfiles: Permission denied
```

**Solution**:
1. Vérifier les règles Firestore
2. Déployer les règles: `firebase deploy --only firestore:rules`
3. Attendre 30 secondes
4. Relancer le script

### npm: Command not found

```
npm: command not found
```

**Solution**:
1. Installer Node.js depuis: https://nodejs.org
2. Vérifier: `node --version` et `npm --version`
3. Relancer le script

### Erreur de syntaxe JSON dans serviceAccountKey.json

```
❌ Unexpected token } in JSON at position...
```

**Solution**:
1. Vérifier que le fichier JSON est valide
2. Utiliser un validateur JSON: https://jsonlint.com
3. Télécharger une nouvelle clé depuis Firebase

---

## 📊 Vérifier les Collections

### Par Firebase Console

```
https://console.firebase.google.com/project/dictamed2025/firestore/data
```

Affiche visuellement:
- ✅ userProfiles
  - admin123
  - medecin123
  - infirmier123
- ✅ userWebhooks
  - medecin123
  - infirmier123
- etc.

### Par Script Node.js

Créer un fichier `verify-firestore.js`:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verify() {
  const collections = [
    'userProfiles', 'userWebhooks', 'userSessions',
    'auditLogs', 'webhookLogs', 'system', '_diagnostic'
  ];

  console.log('\n📊 Vérification Firestore:\n');

  for (const coll of collections) {
    const snapshot = await db.collection(coll).get();
    console.log(`✅ ${coll}: ${snapshot.size} document(s)`);
  }

  process.exit(0);
}

verify().catch(console.error);
```

Exécuter:
```bash
node verify-firestore.js
```

### Par Admin Panel

```
1. Ouvrir: /admin-webhooks.html
2. Se connecter: akio963@gmail.com
3. Vérifier les statistiques:
   - Total Utilisateurs: 3
   - Configurés: 2
   - En Attente: 1
```

---

## 🔄 Réexécuter le Setup

Le script est idempotent (peut être exécuté plusieurs fois):

```bash
# Première exécution: Crée les collections
npm run setup

# Deuxième exécution: Skip les collections existantes
npm run setup

# Résultat: Pas de duplication, pas d'erreur ✅
```

---

## 🚨 Sécurité

### Protéger serviceAccountKey.json

```bash
# Ajouter à .gitignore
echo "serviceAccountKey.json" >> .gitignore

# Vérifier que le fichier n'est pas commité
git status
```

### Permissions Firestore

Le script respecte les règles Firestore existantes:
- ✅ Admin peut créer/modifier
- ✅ Utilisateurs ont accès seulement à leurs données
- ✅ Données publiques: système et configuration

---

## 📈 Après le Setup

### 1. Vérifier l'Admin Panel

```
URL: /admin-webhooks.html
Email: akio963@gmail.com
Password: (votre password)
```

### 2. Voir les Utilisateurs

```
Statistiques:
- 👥 Total Utilisateurs: 3
- ✅ Configurés: 2
- ⏳ En Attente: 1
```

### 3. Créer de Nouveaux Utilisateurs

```
S'inscrire depuis: /index.html
Les nouveaux utilisateurs apparaîtront dans l'admin
```

### 4. Assigner des Webhooks

```
Admin Panel:
1. Cliquer "✏️ Configurer" sur un utilisateur
2. Entrer l'URL du webhook
3. Cliquer "💾 Sauvegarder"
4. Cliquer "🧪 Test" pour vérifier
```

---

## 🎓 Concepts

### Idempotence

Le script vérifie si une collection existe avant de la créer:

```javascript
const snapshot = await ref.limit(1).get();
if (!snapshot.empty) {
  log.skip('Collection déjà créée');
  return;
}
```

### Timestamps Serveur

Les timestamps sont générés par le serveur Firestore:

```javascript
createdAt: admin.firestore.Timestamp.now()
```

### Documents de Test

Trois utilisateurs de test avec webhooks sont créés:

```
1. Admin User (pas de webhook, à assigner)
2. Dr. Jean Dupont (webhook assigné)
3. Marie Dupont (webhook assigné)
```

---

## ✅ Checklist de Configuration

- [ ] Node.js 14+ installé
- [ ] npm installé
- [ ] serviceAccountKey.json téléchargé
- [ ] serviceAccountKey.json placé dans le dossier
- [ ] npm install exécuté
- [ ] npm run setup exécuté avec succès
- [ ] Collections visibles dans Firebase Console
- [ ] Admin panel charge correctement
- [ ] 3 utilisateurs visibles dans l'admin
- [ ] 2 webhooks configurés

---

## 🎉 Résumé

Vous avez:

✅ **Installé** les dépendances Node.js
✅ **Téléchargé** la clé de service Firebase
✅ **Exécuté** le script de configuration
✅ **Créé** 7 collections Firestore
✅ **Ajouté** 3 utilisateurs de test
✅ **Assigné** 2 webhooks
✅ **Vérifié** la configuration

**Temps total**: ~5-10 minutes

---

## 📞 Support

### Questions Courantes

**Q: Puis-je réexécuter le script?**
A: Oui! Il skip les collections existantes.

**Q: Comment réinitialiser?**
A: Supprimer les documents dans Firebase Console, puis réexécuter.

**Q: Les données de test sont supprimées?**
A: Non, elles persistent jusqu'à suppression manuelle.

**Q: Puis-je changer les utilisateurs de test?**
A: Oui, éditer setup-firestore.js et modifier les données.

### Contacts
- Documentation: QUICK_START_GUIDE.md
- Admin: akio963@gmail.com
- Issues: Vérifier SETUP_FIRESTORE_LOCAL.md Troubleshooting

---

**Version**: 1.0.0
**Date**: 2025-12-13
**Status**: ✅ Production Ready
**Durée**: 5-10 minutes
