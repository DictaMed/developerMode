# DictaMed - Architecture Simplifiée v5.0.0

## Vue d'ensemble

DictaMed utilise une architecture **centralisée avec 1 seul webhook n8n** et une configuration **stockée dans Google Sheets**.

```
┌─────────────────────────────────────────────────────┐
│           Étudiant en Médecine                       │
│        (Navigateur + Firebase Auth)                 │
└──────────────────────┬──────────────────────────────┘
                       │
                       ↓
        Envoie {uid, email, audio, ...}
                       │
                       ↓
┌──────────────────────────────────────────────────────┐
│              Webhook n8n Unique                      │
│   https://n8n.../webhook/DictaMed (ou DictaMed-Test)│
└──────────────────┬───────────────────────────────────┘
                   │
                   ├─→ 2. Lookup Google Sheets "DictaMed_Users"
                   │    (Récupère: prompt, excel_file_id)
                   │
                   ├─→ 3. Whisper API (Transcription audio)
                   │
                   ├─→ 4. Claude/GPT (Extraction données avec prompt)
                   │
                   └─→ 5. Append résultats dans Google Sheet utilisateur

                       ↓
┌──────────────────────────────────────────────────────┐
│        Google Sheets "DictaMed_Users"                │
│   Contient: uid, email, displayName, prompt,        │
│             excel_file_id, is_active                │
└──────────────────────────────────────────────────────┘

                       ↓

┌──────────────────────────────────────────────────────┐
│    Google Sheet Résultats (Personnel à l'étudiant)  │
│   Contient: Les données structurées extraites       │
└──────────────────────────────────────────────────────┘
```

---

## 1. Frontend (Application Web)

### Authentification
- Firebase Google Auth
- Chaque utilisateur a: `uid`, `email`, `displayName`

### Envoi de Données
- Bouton "Envoyer" envoie: `{uid, email, audio, patientInfo, recordings, metadata, mode}`
- **Mode TEST**: webhook `/webhook/DictaMed-Test`
- **Mode NORMAL/DMI**: webhook `/webhook/DictaMed`

### Pas d'Admin Panel
- ✅ **SUPPRIMÉ**: `admin-webhooks.html`
- ✅ **SUPPRIMÉ**: Système d'assignation de webhook

---

## 2. Webhook n8n

### Configuration Requise

**Deux webhooks n8n:**
1. `/webhook/DictaMed` → Workflow pour NORMAL + DMI
2. `/webhook/DictaMed-Test` → Workflow séparé pour TEST

### Étapes du Workflow

#### Webhook NORMAL/DMI:
```
1. [Webhook Trigger] Reçoit {uid, email, audio, ...}
2. [Google Sheets Lookup] Recherche uid dans "DictaMed_Users"
3. [Whisper API] Transcrit audio → texte
4. [Claude/GPT] Extrait données avec le prompt personnalisé
5. [Google Sheets Append] Ajoute résultats dans excel_file_id de l'utilisateur
6. [Response] Retourne succès
```

#### Webhook TEST:
```
Similaire mais peut avoir une logique de test
```

---

## 3. Google Sheets "DictaMed_Users"

### Colonnes Obligatoires

| Colonne | Type | Description |
|---------|------|-------------|
| `uid` | Text | Firebase UID (identifiant unique) |
| `email` | Email | Email Firebase de l'utilisateur |
| `displayName` | Text | Nom de l'utilisateur |
| `prompt` | Text | Prompt personnalisé pour cet utilisateur |
| `excel_file_id` | Text | ID du Google Sheet résultats |
| `is_active` | Checkbox | Utilisateur actif (TRUE/FALSE) |

### Exemple

| uid | email | displayName | prompt | excel_file_id | is_active |
|-----|-------|-------------|--------|---------------|-----------|
| `abc123` | `student1@med.fr` | Dr. Martin | `Tu es un assistant médical...` | `1A2B3C...cardio` | TRUE |
| `def456` | `student2@med.fr` | Dr. Sophie | `Tu es un assistant pour...` | `4D5E6F...pedia` | TRUE |

### Permissions
- Partagez avec le compte Google utilisé dans n8n
- Permissions: **Editor** (lecture + écriture)

---

## 4. Configuration

### Fichiers Modifiés

| Fichier | Changement |
|---------|-----------|
| `js/components/data-sender.js` | Enrichit uid/email, choisit webhook selon mode, vrai fetch |
| `js/core/config.js` | `WEBHOOK_ENDPOINTS` avec `.default` et `.test` |
| `firestore.rules` | Suppression collection `userWebhooks` |
| `setup-firestore.js` | Suppression initialisation `userWebhooks` |

### Fichiers Supprimés

- ✅ `admin-webhooks.html`
- ✅ `js/components/admin-webhook-manager-enhanced-v2.js`
- ✅ `js/components/webhook-manager.js`
- ✅ `css/admin-panel-v2.css`, `css/admin-webhook-styles.css`
- ✅ `archive/webhook-managers/*` (anciennes versions)

---

## 5. Ajouter un Nouvel Utilisateur

### Étapes Manuelles

1. **Créer Google Sheet Résultats**
   - Créer un Google Sheet avec colonnes: `timestamp, nom_patient, dossier, [données extraites]...`
   - Partager avec n8n
   - Copier l'ID: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`

2. **Ajouter dans "DictaMed_Users"**
   - Nouvelle ligne:
     - `uid`: UID Firebase de l'utilisateur
     - `email`: Email Firebase
     - `displayName`: Nom
     - `prompt`: Le prompt personnalisé (copier le template)
     - `excel_file_id`: ID du sheet résultats
     - `is_active`: TRUE

3. **Utilisateur peut se connecter et envoyer**
   - Firebase Auth cherche l'utilisateur
   - `data-sender.js` enrichit uid/email
   - n8n reçoit et lookup dans Google Sheets
   - Résultats apparaissent dans le sheet personnel

**Temps total: 2-3 minutes** (vs 30 min avant)

---

## 6. Modification d'un Prompt

**AVANT**: Éditer le workflow n8n + redéployer (30 min)
**APRÈS**: Éditer cellule Google Sheets (30 secondes)

---

## 7. Variables d'Environnement n8n

```env
OPENAI_API_KEY=sk-...        # Clé API Whisper
ANTHROPIC_API_KEY=sk-...     # Clé API Claude (optionnel)
GOOGLE_SHEETS_CREDENTIALS={} # Service Account JSON
```

---

## 8. Erreurs Couantes

### 404: "User not configured"
- ✅ Utilisateur manquant dans Google Sheet "DictaMed_Users"
- Solution: Ajouter l'utilisateur avec son uid exact

### 500: "Server error"
- ✅ Erreur dans n8n (Whisper, Claude, Google Sheets)
- Solution: Vérifier logs n8n

### Network error
- ✅ Connexion internet coupée ou webhook hors ligne
- Solution: Vérifier URL webhook dans config.js

---

## 9. Migration depuis l'Ancien Système

### Script Automatisé
```bash
node scripts/migrate-users-to-sheets.js
```

Cela:
1. Lit utilisateurs depuis Firestore
2. Crée lignes dans Google Sheet "DictaMed_Users"
3. Laisse prompt et excel_file_id vides à compléter manuellement

---

## 10. Scalabilité

| Métrique | Avant | Après |
|----------|-------|-------|
| Webhooks actifs | 50+ | 1 |
| Workflows n8n | 50+ | 2 |
| Config centralisée | Non | Oui (Google Sheets) |
| Utilisateurs possibles | 50 | 500+ |
| Temps ajout user | 30 min | 2 min |
| Temps modif prompt | 30 min | 30 sec |

---

## 11. Support

- 📖 **Architecture**: Ce document
- 🔧 **n8n Setup**: À configurer manuellement
- 🐍 **Migration**: `node scripts/migrate-users-to-sheets.js`
- 👨‍💻 **Code**: `js/components/data-sender.js`, `js/core/config.js`

---

**Version**: 5.0.0
**Dernière modification**: 2025-01-15
**Statut**: Déployée
