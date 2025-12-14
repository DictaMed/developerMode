# DictaMed v5.0.0 - Prochaines Étapes

## ✅ COMPLÉTÉ: Code Refactorisé

Tous les changements de code sont **finalisés et prêts à committer**.

```bash
git add .
git commit -m "feat: migrate to unified webhook architecture with Google Sheets config"
git push
```

**Fichiers modifiés**:
- ✅ `js/components/data-sender.js` - Enrichit uid/email, vrai fetch
- ✅ `js/core/config.js` - Webhooks centralisés
- ✅ `firestore.rules` - Collection userWebhooks supprimée
- ✅ `setup-firestore.js` - userWebhooks supprimé

**Fichiers supprimés**:
- ✅ `admin-webhooks.html` et tout le système admin

**Fichiers créés**:
- ✅ `docs/ARCHITECTURE_SIMPLIFIEE.md` - Architecture complète
- ✅ `docs/N8N_WORKFLOW_SETUP.md` - Guide n8n détaillé
- ✅ `scripts/migrate-users-to-sheets.js` - Script migration

---

## ⏳ À FAIRE MAINTENANT: Configuration Google Sheets + n8n

### Phase 1: Google Sheets Setup (Manuel)
**Temps estimé**: 15-20 minutes

**Étapes**:

1. **Créer Google Sheet "DictaMed_Users"**
   - Allez sur https://sheets.google.com
   - Nouveau sheet → Nommez-le "DictaMed_Users"
   - Créez les colonnes:
     ```
     A: uid          (Text)
     B: email        (Email)
     C: displayName  (Text)
     D: prompt       (Long text)
     E: excel_file_id (Text)
     F: is_active    (Checkbox)
     ```

2. **Ajouter utilisateurs test**
   ```
   Ligne 2:
   abc123 | student@med.fr | Dr. Martin | [prompt à remplir] | [vide] | TRUE
   ```

3. **Partager avec n8n**
   - Cliquer "Partager" (en haut à droite)
   - Ajouter email: `firebase-adminsdk-xxxxx@dictamed2025.iam.gserviceaccount.com`
   - Permissions: Editor
   - Copier l'ID du sheet: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`

4. **Créer Google Sheet Résultats Test**
   - Nouveau sheet
   - Colonnes:
     ```
     A: timestamp
     B: uid
     C: email
     D: displayName
     E: sectionId
     F: numeroDossier
     G: nomPatient
     H: [données extraites personnalisées]
     ```
   - Copier l'ID du sheet
   - Mettre cet ID dans `excel_file_id` du user

**Vérification**:
- [ ] Google Sheet "DictaMed_Users" créé
- [ ] Colonnes correctes
- [ ] Utilisateur test ajouté
- [ ] Partagé avec service account
- [ ] Google Sheet Résultats créé
- [ ] ID sheet résultats dans excel_file_id

---

### Phase 2: Configurer n8n Workflow (Manuel)
**Temps estimé**: 30-45 minutes

**Étapes**:

1. **Variables d'environnement n8n**
   - Aller dans n8n Settings → Environment Variables
   - Ajouter:
     ```
     OPENAI_API_KEY=sk-proj-...
     ANTHROPIC_API_KEY=sk-ant-...
     DICTAMED_SHEETS_ID=SHEET_ID_DictaMed_Users
     ```

2. **Créer Webhook 1: /webhook/DictaMed**
   - Nouveau workflow
   - Ajouter nœud Webhook
   - URL: `/webhook/DictaMed`
   - Method: POST
   - Suivre le guide: **docs/N8N_WORKFLOW_SETUP.md** (Étape 2)
   - Nœuds à ajouter:
     - [1] Webhook Trigger
     - [2] Google Sheets Lookup
     - [3] IF Check
     - [4] Loop → [4.1] Whisper → [4.2] Code → [4.3] Claude → [4.4] Code → [4.5] Google Sheets Append
     - [5] HTTP Response

3. **Tester Webhook 1**
   - Bouton "Test" → Envoyer payload:
   ```json
   {
     "uid": "abc123",
     "email": "student@med.fr",
     "displayName": "Dr. Martin",
     "mode": "normal",
     "patientInfo": {"numeroDossier": "D123", "nomPatient": "Jean"},
     "recordings": [{
       "sectionId": "partie1",
       "audioData": "SUQzBAAAI1NDVEgAA...",
       "duration": 30
     }],
     "metadata": {}
   }
   ```
   - Vérifier résultat 200 OK dans Google Sheet

4. **Créer Webhook 2: /webhook/DictaMed-Test** (Optionnel)
   - Même structure mais URL: `/webhook/DictaMed-Test`
   - Peut avoir prompt/logique différent

5. **Deployer Workflows**
   - Bouton "Publish" ou "Save"
   - Les webhooks sont maintenant en production

**Vérification**:
- [ ] OPENAI_API_KEY configurée
- [ ] ANTHROPIC_API_KEY configurée
- [ ] Webhook /webhook/DictaMed créé
- [ ] Nœuds configurés selon guide
- [ ] Test payload: Response 200
- [ ] Ligne ajoutée dans Google Sheet
- [ ] Webhook /webhook/DictaMed-Test (optionnel)

---

### Phase 3: Migration Utilisateurs Firestore → Google Sheets
**Temps estimé**: 5-10 minutes

**Étapes**:

1. **Exécuter le script**
   ```bash
   cd c:\DictaMed\developerMode
   node scripts/migrate-users-to-sheets.js
   ```

2. **Répondre aux questions**
   - ID du Google Sheet "DictaMed_Users": `SHEET_ID`
   - Le script exporte automatiquement les utilisateurs Firestore

3. **Compléter manuellement**
   - Pour chaque utilisateur:
     - Remplir colonne `prompt` (copier template)
     - Remplir colonne `excel_file_id` (ID du sheet résultats)

4. **Vérifier dans Google Sheets**
   - Tous les utilisateurs importés
   - Prompts et file IDs complétés

**Vérification**:
- [ ] Script exécuté sans erreur
- [ ] Utilisateurs dans Google Sheet
- [ ] Prompts remplis
- [ ] excel_file_id remplis

---

### Phase 4: Test End-to-End
**Temps estimé**: 10-15 minutes

**Étapes**:

1. **Frontend Ready**
   - Application ouverte: http://localhost:3000
   - Utilisateur test connecté

2. **Envoyer une Dictation**
   - Aller dans "Mode Normal"
   - Enregistrer audio (10-15 secondes)
   - Cliquer "Envoyer"
   - Attendre réponse (30-60 secondes)

3. **Vérifier Résultats**
   - Notification "Données envoyées avec succès"
   - Aller dans Google Sheet Résultats utilisateur
   - Vérifier nouvelle ligne ajoutée:
     - timestamp ✅
     - uid ✅
     - Données extraites ✅

4. **Tester Mode TEST** (Si webhook séparé)
   - Mode Test
   - Enregistrer audio
   - Cliquer "Envoyer"
   - Vérifier dans Google Sheet

**Vérification**:
- [ ] Utilisateur peut se connecter
- [ ] Peut enregistrer audio
- [ ] "Envoyer" fonctionne
- [ ] Pas d'erreur 404 ou 500
- [ ] Résultat dans Google Sheet

---

## 📋 Checklist Complète

### Code (Prêt à Déployer)
- [x] data-sender.js modifié
- [x] config.js modifié
- [x] firestore.rules nettoyé
- [x] setup-firestore.js nettoyé
- [x] Admin panel supprimé
- [x] Tests webhook supprimés
- [x] Documentation créée
- [x] Script migration créé

### Google Sheets
- [ ] Sheet "DictaMed_Users" créé
- [ ] Colonnes correctes
- [ ] Utilisateurs ajoutés
- [ ] Partagé avec service account
- [ ] Sheet Résultats créé pour test

### n8n
- [ ] Variables d'environnement ajoutées
- [ ] Webhook /webhook/DictaMed configuré
- [ ] Nœuds correctement chaînés
- [ ] Test lookup OK
- [ ] Test Whisper OK
- [ ] Test Claude OK
- [ ] Test append OK
- [ ] Webhook /webhook/DictaMed-Test (optionnel)

### Tests
- [ ] End-to-end: utilisateur → webhook → Google Sheet
- [ ] Mode NORMAL fonctionne
- [ ] Mode TEST fonctionne (si applicable)
- [ ] Erreurs gérées (404, 500, network)

### Déploiement
- [ ] Code commité et pushé
- [ ] Firestore rules déployées: `firebase deploy --only firestore:rules`
- [ ] Monitoring configuré
- [ ] Alertes configurées

---

## Commandes Utiles

### Déployer Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Exécuter Migration
```bash
node scripts/migrate-users-to-sheets.js
```

### Vérifier Configuration Locale
```bash
# Vérifier config.js
grep WEBHOOK_ENDPOINTS js/core/config.js

# Vérifier data-sender.js
grep "makeApiCall" js/components/data-sender.js
```

### Tester Webhook Localement
```bash
# Avec curl
curl -X POST http://localhost:3000/webhook/DictaMed \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "abc123",
    "email": "test@med.fr",
    "mode": "normal",
    "recordings": []
  }'
```

---

## Timeline Estimée

| Phase | Durée | Dépendances |
|-------|-------|------------|
| 1. Google Sheets | 15-20 min | Accès Google Drive |
| 2. n8n Workflow | 30-45 min | Accès n8n, clés API |
| 3. Migration Users | 5-10 min | Phase 1 complétée |
| 4. Test E2E | 10-15 min | Phase 1-3 complétées |
| **TOTAL** | **1-1.5 h** | - |

---

## 🔗 Ressources

| Document | Description |
|----------|------------|
| [ARCHITECTURE_SIMPLIFIEE.md](ARCHITECTURE_SIMPLIFIEE.md) | Vue d'ensemble architecture |
| [N8N_WORKFLOW_SETUP.md](N8N_WORKFLOW_SETUP.md) | Guide détaillé n8n |
| [PROCHAINES_ETAPES.md](PROCHAINES_ETAPES.md) | Ce document |

---

## 🆘 Troubleshooting

### Erreur 404: "User not configured"
**Cause**: Utilisateur absent de Google Sheet "DictaMed_Users"
**Solution**: Ajouter utilisateur avec uid exact

### Erreur 500: Whisper API
**Cause**: Audio format invalide ou API down
**Solution**: Vérifier clé API, tester avec curl

### Erreur 500: Claude API
**Cause**: Prompt invalide ou API down
**Solution**: Vérifier prompt, tester avec curl

### Workflow n8n ne se déclenche pas
**Cause**: Webhook URL incorrecte dans config.js
**Solution**: Vérifier `WEBHOOK_ENDPOINTS` dans config.js

### Google Sheets append échoue
**Cause**: Permissions insuffisantes ou sheet_id invalide
**Solution**: Vérifier partage, vérifier ID sheet

---

## ✅ Statut Actuel

```
FRONTEND:      ✅ Prêt
CODE:          ✅ Prêt
FIRESTORE:     ✅ Prêt
GOOGLE SHEETS: ⏳ À créer
N8N WORKFLOW:  ⏳ À configurer
TESTS:         ⏳ À faire
DÉPLOIEMENT:   ⏳ À faire
```

---

## Contact & Support

- 📖 Lire les 3 documents: ARCHITECTURE + N8N_SETUP + PROCHAINES_ETAPES
- 🔧 Besoin d'aide n8n? → https://community.n8n.io/
- 💬 Questions code? → Consulter docs/
- 📞 Urgence? → akio963@gmail.com

---

**Version**: 5.0.0
**Dernière mise à jour**: 2025-01-15
**Statut**: Frontend prêt, Google Sheets + n8n à configurer
