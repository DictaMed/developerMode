# DictaMed - n8n Workflow Conditionnel v2.0
## Architecture Multi-Entrées (Audio | Texte | Photos) avec Agent OpenAI

---

## 📋 Vue d'ensemble

Cette nouvelle architecture utilise **1 seul webhook** pour traiter 3 types d'entrées différentes :

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK UNIQUE (DictaMed)                     │
└─────────────────────────────────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│         1. Récupérer Prompt depuis Google Sheets                 │
│         2. Déterminer Type d'Entrée (Audio/Texte/Photo)          │
└─────────────────────────────────────────────────────────────────┘
                               ▼
                    ┌──────────┴──────────┬──────────┐
                    ▼                     ▼          ▼
              ╔═════════╗          ╔═════════╗    ╔═════════╗
              ║  AUDIO  ║          ║  TEXTE  ║    ║  PHOTO  ║
              ╚═════════╝          ╚═════════╝    ╚═════════╝
                    ▼                     ▼          ▼
            [Whisper API]      [Directement]  [Vision API]
                    ▼                     ▼          ▼
                    └──────────┬──────────┘──────────┘
                               ▼
                    ╔════════════════════╗
                    ║  Agent OpenAI      ║
                    ║  (Structuration)   ║
                    ╚════════════════════╝
                               ▼
                    ╔════════════════════╗
                    ║  Google Sheets     ║
                    ║  Append Row        ║
                    ╚════════════════════╝
                               ▼
                    ╔════════════════════╗
                    ║  Response 200 OK   ║
                    ╚════════════════════╝
```

### Avantages
- ✅ 1 seul webhook pour tous les types d'entrées
- ✅ Logique conditionnelle automatique par type
- ✅ Prompts personnalisés par utilisateur (Google Sheets)
- ✅ Scalable à 500+ utilisateurs
- ✅ Utilise agent OpenAI existant

---

## 🏗️ Architecture Détaillée

### Payload du Frontend

```json
{
  "uid": "abc123xyz",
  "email": "student@med.fr",
  "displayName": "Dr. Martin",
  "mode": "normal",
  "timestamp": "2025-01-15T10:30:00Z",
  "patientInfo": {
    "numeroDossier": "D123456",
    "nomPatient": "Jean Dupont"
  },
  "inputType": "audio",           // ← NOUVEAU: audio | text | photo
  "data": {
    // Si inputType = "audio"
    "audioData": "base64_encoded_audio...",
    "duration": 45,
    "format": "webm"

    // OU si inputType = "text"
    "text": "Le patient se plaint de...",
    "format": "text/plain"

    // OU si inputType = "photo"
    "photoData": "base64_image...",
    "mimeType": "image/jpeg",
    "description": "Photo de la radiographie"
  },
  "metadata": { }
}
```

---

## 🔧 Architecture n8n Pas-à-Pas

### NŒUD 1: Webhook Trigger

```
Type: Webhook
Method: POST
URL: /webhook/DictaMed
Authentication: None (ou token)
Response mode: When last node finishes
```

### NŒUD 2: Google Sheets Lookup (Récupérer Prompt + Config)

```
Type: Google Sheets
Operation: Get a row
Authentication: Service Account
Spreadsheet: DictaMed_Users
Sheet: Sheet1
Lookup column: uid
Lookup value: {{ $json.uid }}
```

**Output récupéré:**
```json
{
  "uid": "abc123",
  "email": "student@med.fr",
  "prompt": "Tu es un assistant médical spécialisé en cardiologie...",
  "excel_file_id": "sheet_id_utilisateur",
  "is_active": true
}
```

### NŒUD 3: IF - Vérifier Utilisateur Trouvé

```
Type: IF
Condition: Rows returned > 0
True: Continuer
False: Envoyer erreur 404
```

### NŒUD 4: Code JS - Préparer le Contexte + Déterminer Type

```javascript
Type: Code
Language: JavaScript
```

**Code:**
```javascript
// Récupérer les données
const userConfig = $nodeExecutionData[0].json;  // Google Sheets lookup
const webhookPayload = $nodeExecutionData[0].json;  // Webhook original

// Préparer le contexte global
return {
  uid: userConfig.uid,
  email: userConfig.email,
  displayName: userConfig.displayName,
  mode: webhookPayload.mode,
  prompt: userConfig.prompt,
  excel_file_id: userConfig.excel_file_id,
  patientInfo: webhookPayload.patientInfo,
  inputType: webhookPayload.inputType,  // ← Clé pour le routage
  data: webhookPayload.data,
  timestamp: webhookPayload.timestamp
};
```

**Output:**
```json
{
  "uid": "abc123",
  "email": "student@med.fr",
  "prompt": "Tu es un assistant...",
  "excel_file_id": "sheet_id",
  "inputType": "audio",  // ← Utilisé pour le routage
  "data": { ... },
  "patientInfo": { ... }
}
```

### NŒUD 5: Switch (Routage par Type d'Entrée)

```
Type: Switch
Default: Error

Case 1: inputType === "audio"
Case 2: inputType === "text"
Case 3: inputType === "photo"
```

---

## 🎵 CHEMIN 1: TRAITEMENT AUDIO

### NŒUD 5.1: Whisper API (Transcription)

```
Type: HTTP Request
Method: POST
URL: https://api.openai.com/v1/audio/transcriptions

Headers:
- Authorization: Bearer {{ $env.OPENAI_API_KEY }}

Body (form-data):
- file: [Binary Audio File]
- model: whisper-1
- language: fr
```

**Expression pour le fichier audio:**
```javascript
// Convertir base64 en buffer
Buffer.from($json.data.audioData, 'base64')
```

**Output:**
```json
{
  "text": "Le patient se plaint de douleurs thoraciques depuis 3 jours...",
  "language": "fr"
}
```

### NŒUD 5.2: Code JS - Préparer pour Agent (Audio Path)

```javascript
Type: Code
Language: JavaScript
```

**Code:**
```javascript
const context = $nodeExecutionData[0].json;  // Contexte global
const transcription = $nodeExecutionData[1].json;  // Whisper output

return {
  ...context,
  rawContent: transcription.text,
  contentType: "transcription_audio",
  contentLength: transcription.text.length,
  originalDuration: context.data.duration
};
```

### NŒUD 5.3: HTTP Request → OpenAI Agent (Structuration)

```
Type: HTTP Request
Method: POST
URL: https://api.openai.com/v1/chat/completions

Headers:
- Authorization: Bearer {{ $env.OPENAI_API_KEY }}
- Content-Type: application/json
```

**Body (JSON):**
```json
{
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 1500,
  "messages": [
    {
      "role": "system",
      "content": "{{ $json.prompt }}\n\nStructure les données en JSON valide avec les champs appropriés."
    },
    {
      "role": "user",
      "content": "Voici la transcription médicale à structurer:\n\n{{ $json.rawContent }}"
    }
  ]
}
```

**Output Parsing:**
```javascript
// Extraire la réponse
const response = $nodeExecutionData[2].json;
const content = response.choices[0].message.content;

// Parser JSON si possible
let structured = {};
try {
  structured = JSON.parse(content);
} catch (e) {
  structured = { raw_response: content };
}

return {
  structured: structured,
  model: "gpt-4",
  tokens_used: response.usage.total_tokens
};
```

---

## 📝 CHEMIN 2: TRAITEMENT TEXTE

### NŒUD 5.4: Code JS - Préparer pour Agent (Texte Path)

```javascript
Type: Code
Language: JavaScript
```

**Code:**
```javascript
const context = $nodeExecutionData[0].json;  // Contexte global

return {
  ...context,
  rawContent: context.data.text,
  contentType: "texte_direct",
  contentLength: context.data.text.length
};
```

### NŒUD 5.5: HTTP Request → OpenAI Agent (Structuration)

```
Type: HTTP Request
Method: POST
URL: https://api.openai.com/v1/chat/completions

Headers:
- Authorization: Bearer {{ $env.OPENAI_API_KEY }}
- Content-Type: application/json
```

**Body (JSON):**
```json
{
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 1500,
  "messages": [
    {
      "role": "system",
      "content": "{{ $json.prompt }}\n\nStructure le texte médical fourni en JSON valide."
    },
    {
      "role": "user",
      "content": "Texte médical à structurer:\n\n{{ $json.rawContent }}"
    }
  ]
}
```

**Output Parsing:** (Identique au chemin audio)

---

## 📷 CHEMIN 3: TRAITEMENT PHOTOS

### NŒUD 5.6: Vision API (Analyse d'Image)

```
Type: HTTP Request
Method: POST
URL: https://api.openai.com/v1/chat/completions

Headers:
- Authorization: Bearer {{ $env.OPENAI_API_KEY }}
- Content-Type: application/json
```

**Body (JSON):**
```json
{
  "model": "gpt-4-vision",
  "max_tokens": 1500,
  "messages": [
    {
      "role": "system",
      "content": "Tu es un assistant d'analyse d'imagerie médicale. Analyse l'image fournie et extrais les informations pertinentes."
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "{{ $json.prompt }}\n\nAnalyse cette image médicale:"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:{{ $json.data.mimeType }};base64,{{ $json.data.photoData }}"
          }
        }
      ]
    }
  ]
}
```

**Output:**
```json
{
  "content": "Description structurée de l'image...",
  "observations": [...]
}
```

### NŒUD 5.7: Code JS - Préparer pour Agent (Photo Path)

```javascript
Type: Code
Language: JavaScript
```

**Code:**
```javascript
const context = $nodeExecutionData[0].json;
const visionResponse = $nodeExecutionData[1].json;

return {
  ...context,
  rawContent: visionResponse.choices[0].message.content,
  contentType: "analyse_photo",
  photoDescription: context.data.description,
  imageMimeType: context.data.mimeType
};
```

### NŒUD 5.8: HTTP Request → OpenAI Agent (Structuration)

```
Type: HTTP Request
Method: POST
URL: https://api.openai.com/v1/chat/completions

Headers:
- Authorization: Bearer {{ $env.OPENAI_API_KEY }}
- Content-Type: application/json
```

**Body (JSON):**
```json
{
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 1500,
  "messages": [
    {
      "role": "system",
      "content": "{{ $json.prompt }}\n\nStructure les données extraites de l'analyse d'imagerie en JSON valide."
    },
    {
      "role": "user",
      "content": "Analyse d'image:\n\n{{ $json.rawContent }}"
    }
  ]
}
```

---

## 🔀 NŒUD 6: Consolidation (Après les 3 Chemins)

### Code JS - Préparer pour Google Sheets

```javascript
Type: Code
Language: JavaScript
```

**Code:**
```javascript
// Les 3 chemins convergent ici
// $nodeExecutionData contient le résultat du chemin pris

const result = $nodeExecutionData[0].json;
const context = $nodeExecutionData[1].json;

// Parser la réponse de l'agent
let structured = {};
try {
  // La réponse est dans choices[0].message.content
  const responseText = result.choices[0].message.content;
  structured = JSON.parse(responseText);
} catch (e) {
  structured = { raw_response: result.choices[0].message.content };
}

// Formater pour Google Sheets
return {
  timestamp: new Date().toISOString(),
  uid: context.uid,
  email: context.email,
  displayName: context.displayName,
  mode: context.mode,
  inputType: context.inputType,
  patientInfo: JSON.stringify(context.patientInfo),
  ...structured,  // Déplie les champs structurés
  tokens_used: result.usage.total_tokens
};
```

**Output Consolidé:**
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "uid": "abc123",
  "email": "student@med.fr",
  "displayName": "Dr. Martin",
  "mode": "normal",
  "inputType": "audio",
  "patientInfo": "{\"numeroDossier\": \"D123\", ...}",
  "symptômes": "Douleurs thoraciques, dyspnée",
  "diagnostic": "Suspicion d'infarctus",
  "actions": ["ECG", "Troponine"],
  "tokens_used": 542
}
```

---

## 📊 NŒUD 7: Google Sheets Append

```
Type: Google Sheets
Operation: Append row
Authentication: Service Account
Spreadsheet: {{ $json.excel_file_id }}
Sheet: Sheet1
Columns to insert:
  - timestamp
  - uid
  - email
  - displayName
  - mode
  - inputType
  - patientInfo
  - [toutes les colonnes structurées par l'agent]
```

**Values:**
```
{{ $json.timestamp }}
{{ $json.uid }}
{{ $json.email }}
{{ $json.displayName }}
{{ $json.mode }}
{{ $json.inputType }}
{{ $json.patientInfo }}
{{ $json.symptômes }}
{{ $json.diagnostic }}
{{ $json.actions }}
... (etc)
```

---

## ✅ NŒUD 8: Response (Webhook Response)

```
Type: HTTP Response
Response: 200 OK
```

**Body:**
```json
{
  "success": true,
  "message": "Data processed successfully",
  "inputType": "{{ $json.inputType }}",
  "rowAppended": true,
  "timestamp": "{{ new Date().toISOString() }}"
}
```

---

## 📌 Configuration Google Sheets

### Sheet "DictaMed_Users"

**Colonnes:**
```
A: uid              (Text)
B: email            (Email)
C: displayName      (Text)
D: mode             (Text)
E: prompt           (Long text - système ou spécialisé)
F: excel_file_id    (Text - ID du sheet résultats)
G: is_active        (Checkbox)
```

**Exemple Row:**
```
abc123 | student@med.fr | Dr. Martin | normal | Tu es un cardiologue... | 1KxYz... | ✓
```

### Sheet Résultats (Personnalisé par Utilisateur)

**Colonnes de Base:**
```
A: timestamp
B: uid
C: email
D: displayName
E: mode
F: inputType      ← NOUVEAU: audio | text | photo
G: patientInfo
```

**Colonnes Dynamiques (selon prompt):**
```
H: symptômes
I: diagnostic
J: actions
K: différentiels
L: examens_demandés
... (personnalisées par prompt de l'utilisateur)
```

---

## 🔐 Variables d'Environnement n8n

```env
# APIs
OPENAI_API_KEY=sk-proj-...           # Pour Whisper, GPT-4, Vision
GOOGLE_SHEETS_SPREADSHEET_ID=...     # ID du sheet "DictaMed_Users"

# Configuration (optionnel)
WHISPER_LANGUAGE=fr
AGENT_MODEL=gpt-4
AGENT_TEMPERATURE=0.7
VISION_MODEL=gpt-4-vision
```

---

## 📋 Payload Frontend Exemple

### Exemple 1: Audio

```json
{
  "uid": "abc123xyz",
  "email": "student@med.fr",
  "displayName": "Dr. Martin",
  "mode": "normal",
  "timestamp": "2025-01-15T10:30:00Z",
  "patientInfo": {
    "numeroDossier": "D123456",
    "nomPatient": "Jean Dupont"
  },
  "inputType": "audio",
  "data": {
    "audioData": "SUQzBAAAI1NDVEgA...",
    "duration": 45,
    "format": "webm"
  },
  "metadata": {}
}
```

### Exemple 2: Texte

```json
{
  "uid": "abc123xyz",
  "email": "student@med.fr",
  "displayName": "Dr. Martin",
  "mode": "normal",
  "timestamp": "2025-01-15T10:30:00Z",
  "patientInfo": {
    "numeroDossier": "D123456",
    "nomPatient": "Jean Dupont"
  },
  "inputType": "text",
  "data": {
    "text": "Patient de 45 ans se présentant avec des douleurs thoraciques depuis 3 jours...",
    "format": "text/plain"
  },
  "metadata": {}
}
```

### Exemple 3: Photo

```json
{
  "uid": "abc123xyz",
  "email": "student@med.fr",
  "displayName": "Dr. Martin",
  "mode": "normal",
  "timestamp": "2025-01-15T10:30:00Z",
  "patientInfo": {
    "numeroDossier": "D123456",
    "nomPatient": "Jean Dupont"
  },
  "inputType": "photo",
  "data": {
    "photoData": "/9j/4AAQSkZJRgABA...",
    "mimeType": "image/jpeg",
    "description": "Radiographie thoracique de face"
  },
  "metadata": {}
}
```

---

## 🧪 Tests Étape-par-Étape

### Test 1: Webhook + Lookup (Tous les Chemins)

**Payload:**
```json
{
  "uid": "test-user-123",
  "email": "test@example.com",
  "displayName": "Test User",
  "mode": "test",
  "inputType": "text",
  "data": {"text": "Test de texte"},
  "patientInfo": {},
  "timestamp": "2025-01-15T10:00:00Z"
}
```

**Résultat attendu:**
```
✅ Utilisateur trouvé dans Google Sheets
✅ Prompt récupéré
✅ excel_file_id récupéré
```

### Test 2: Chemin Audio Complet

**Payload avec audio real:**
```json
{
  "uid": "test-user-123",
  "email": "test@example.com",
  "displayName": "Test User",
  "inputType": "audio",
  "data": {
    "audioData": "[base64_audio]",
    "duration": 30,
    "format": "webm"
  },
  ...
}
```

**Résultats attendus:**
```
✅ Whisper API transcription réussie
✅ Agent OpenAI structure les données
✅ Google Sheets append réussit
```

### Test 3: Chemin Texte Complet

**Payload:**
```json
{
  "uid": "test-user-123",
  "inputType": "text",
  "data": {"text": "Patient avec symptômes..."},
  ...
}
```

**Résultats attendus:**
```
✅ Skipped Whisper (input texte)
✅ Agent OpenAI reçoit le texte directement
✅ Google Sheets append réussit
```

### Test 4: Chemin Photo Complet

**Payload:**
```json
{
  "uid": "test-user-123",
  "inputType": "photo",
  "data": {
    "photoData": "[base64_image]",
    "mimeType": "image/jpeg",
    "description": "Radiographie"
  },
  ...
}
```

**Résultats attendus:**
```
✅ Vision API analyse l'image
✅ Agent OpenAI structure les observations
✅ Google Sheets append réussit
```

---

## 🛠️ Gestion des Erreurs

### Erreur Handler - Whisper API Failure

```
Condition: inputType = "audio" AND Whisper error
Response: 400 - "Audio transcription failed"
Fallback: Envoyer email admin
```

### Erreur Handler - Vision API Failure

```
Condition: inputType = "photo" AND Vision error
Response: 400 - "Image analysis failed"
Fallback: Envoyer email admin
```

### Erreur Handler - Agent Failure (Tous les Chemins)

```
Condition: Agent OpenAI error (timeout, invalid response, etc)
Response: 500 - "Data structuring failed"
Fallback: Envoyer email admin + Log détaillé
```

### Erreur Handler - Google Sheets Append

```
Condition: Append fails
Response: 500 - "Failed to save data"
Fallback: Retry 3x avec backoff exponentiel
```

---

## 📈 Performance & Optimisations

### Timeouts

```
Whisper API:     120 secondes (audio max 25MB)
Vision API:      60 secondes (image max 20MB)
Agent OpenAI:    60 secondes (processing)
Google Sheets:   30 secondes (append)
Total Workflow:  300 secondes (5 minutes max)
```

### Rate Limits

```
OpenAI (Whisper):      50 req/min
OpenAI (GPT-4):        3500 req/min (selon plan)
OpenAI (Vision):       3500 req/min (selon plan)
Google Sheets API:     300 req/min
```

### Optimisations Recommandées

```javascript
// 1. Caching du Lookup Google Sheets (5 min)
// 2. Compression audio avant Whisper (max 5MB base64)
// 3. Redimensionner images (max 2MB base64)
// 4. Batching des écritures Google Sheets (grouper 10 req)
```

---

## 🔄 Frontend - Modifier data-sender.js

```javascript
// Ajouter détection du type d'entrée
function determineInputType(data) {
  if (data.audioData) return "audio";
  if (data.text) return "text";
  if (data.photoData) return "photo";
  return "unknown";
}

// Modifier le payload
const payload = {
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  mode: currentMode,
  timestamp: new Date().toISOString(),
  patientInfo: getPatientInfo(),
  inputType: determineInputType(recordingData),  // ← NOUVEAU
  data: recordingData,  // ← Wrapper pour audio/texte/photo
  metadata: {}
};
```

---

## 📚 Script de Validation

### Script JS - Valider Payload Frontend

```javascript
// Créer: scripts/validate-payload.js

const fs = require('fs');

function validatePayload(payload) {
  const errors = [];

  // Champs requis
  if (!payload.uid) errors.push("uid manquant");
  if (!payload.email) errors.push("email manquant");
  if (!payload.inputType) errors.push("inputType manquant");

  // Validation par type
  if (payload.inputType === "audio") {
    if (!payload.data.audioData) errors.push("audioData manquant");
    if (!payload.data.duration) errors.push("duration manquant");
  } else if (payload.inputType === "text") {
    if (!payload.data.text) errors.push("text manquant");
  } else if (payload.inputType === "photo") {
    if (!payload.data.photoData) errors.push("photoData manquant");
    if (!payload.data.mimeType) errors.push("mimeType manquant");
  } else {
    errors.push(`inputType invalide: ${payload.inputType}`);
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

module.exports = { validatePayload };
```

---

## 🎯 Checklist de Déploiement

### Code & Configuration
- [ ] Frontend data-sender.js modifié (inputType + data wrapper)
- [ ] Scripts de validation créés
- [ ] config.js avec les 3 types d'entrées

### Google Sheets
- [ ] Sheet "DictaMed_Users" avec prompts
- [ ] Sheets résultats créés pour chaque utilisateur
- [ ] Service account partagé avec permissions Editor

### n8n Workflow
- [ ] Webhook /webhook/DictaMed créé
- [ ] Nœud 1: Webhook Trigger
- [ ] Nœud 2: Google Sheets Lookup
- [ ] Nœud 3: IF user found
- [ ] Nœud 4: Code JS context
- [ ] Nœud 5: Switch routing par inputType
- [ ] Nœud 5.1-5.3: Audio path (Whisper → Agent)
- [ ] Nœud 5.4-5.5: Text path (Direct → Agent)
- [ ] Nœud 5.6-5.8: Photo path (Vision → Agent)
- [ ] Nœud 6: Code JS consolidation
- [ ] Nœud 7: Google Sheets Append
- [ ] Nœud 8: HTTP Response

### Tests
- [ ] Test payload audio complet
- [ ] Test payload texte complet
- [ ] Test payload photo complet
- [ ] Vérifier Google Sheets avec 3 types
- [ ] Test erreur handling (API down, invalid data)
- [ ] Test performance (timeouts, rate limits)

### Monitoring
- [ ] Logs n8n configurés
- [ ] Alertes email/Slack configurées
- [ ] Dashboard monitoring créé

---

## 🔗 Ressources

| Document | Description |
|----------|------------|
| ARCHITECTURE_SIMPLIFIEE.md | Vue d'ensemble v1 |
| N8N_WORKFLOW_SETUP.md | Guide original (v1) |
| N8N_CONDITIONAL_WORKFLOW_V2.md | Ce document (v2) |
| PROCHAINES_ETAPES.md | Étapes déploiement |

---

## 📞 Support & Troubleshooting

### Erreur: "inputType invalide"
**Cause:** Frontend n'envoie pas inputType ou valeur invalide
**Solution:** Vérifier data-sender.js, ajouter validation

### Erreur: "Whisper API failed" (Audio path seulement)
**Cause:** Audio format invalide ou API down
**Solution:** Vérifier format audio (webm, mp3), tester clé API

### Erreur: "Vision API failed" (Photo path seulement)
**Cause:** Image format invalide ou trop grosse
**Solution:** Vérifier format (JPEG, PNG), redimensionner

### Erreur: "Agent structuration failed" (Tous les chemins)
**Cause:** Prompt invalide ou réponse non-JSON
**Solution:** Vérifier prompt dans Google Sheets, ajouter parser robuste

### Données manquantes dans Google Sheets
**Cause:** Colonnes non créées ou AppendRow mal configuré
**Solution:** Vérifier liste des colonnes, comparer avec output du Code JS

---

## 📊 Exemple Résultat Final (Google Sheets)

| timestamp | uid | email | inputType | symptômes | diagnostic | actions | tokens |
|-----------|-----|-------|-----------|-----------|-----------|---------|--------|
| 2025-01-15T10:30:00Z | abc123 | student@med.fr | audio | Douleurs thoraciques, dyspnée | Infarctus probable | ECG, Troponine | 542 |
| 2025-01-15T11:00:00Z | abc123 | student@med.fr | text | Céphalées, photophobie | Migraine | Repos, Triptan | 387 |
| 2025-01-15T11:30:00Z | abc123 | student@med.fr | photo | Opacité apicale gauche | TB pulmonaire | PCR, ImageBMP | 621 |

---

**Version:** 2.0
**Dernière mise à jour:** 2025-01-15
**Statut:** Architecture Multi-Entrées avec Agent OpenAI
