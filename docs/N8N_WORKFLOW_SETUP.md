# DictaMed - Configuration n8n Workflow v5.0.0

## Vue d'ensemble

Ce document explique comment migrer votre workflow n8n actuel vers la nouvelle architecture avec **lookup Google Sheets**.

### Structure Actuelle vs Nouvelle

#### ❌ ANCIEN (Complexe - Votre workflow actuel)
```
Webhook → 3 boucles parallèles
  - Code JS (extraction)
  - Whisper API
  - Message Model
  → Google Sheets Append (3 fois)
```

**Problèmes**:
- 50+ webhooks pour 50+ utilisateurs
- Prompt hardcodé dans le code
- Pas de configuration centralisée

#### ✅ NOUVEAU (Simplifié - À faire)
```
Webhook → Lookup Google Sheets "DictaMed_Users" (par uid)
       → Récupère: prompt, excel_file_id
       → Whisper API (transcription)
       → Claude/GPT (avec prompt personnalisé)
       → Google Sheets Append (fichier utilisateur)
```

**Avantages**:
- 1 seul webhook pour tous les utilisateurs
- Configuration Google Sheets (pas de redéploiement n8n)
- Scalable à 500+ utilisateurs

---

## Étape 1: Architecture Globale

### Webhooks à Créer

Créez 2 webhooks n8n différents:

#### Webhook 1: NORMAL + DMI
```
URL: /webhook/DictaMed
Method: POST
Response: 200 OK (immédiat)
```

Payload reçu:
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
  "recordings": [
    {
      "sectionId": "partie1",
      "audioData": "base64_encoded_audio...",
      "duration": 45,
      "format": "webm"
    }
  ],
  "metadata": { ... }
}
```

#### Webhook 2: TEST
```
URL: /webhook/DictaMed-Test
Method: POST
Response: 200 OK (immédiat)
```

Même payload mais `"mode": "test"`

---

## Étape 2: Nœuds du Workflow NORMAL/DMI

### Nœud 1: Webhook Trigger

**Configuration**:
- Type: `Webhook`
- Method: `POST`
- Authentication: None (ou token si vous voulez)
- Response mode: `When last node finishes`

### Nœud 2: Google Sheets Lookup

**Configuration**:
- Type: `Google Sheets`
- Operation: `Get a row`
- Authentication: Service Account (votre serviceAccountKey.json)
- Spreadsheet: `DictaMed_Users` (ID du sheet)
- Sheet: `Sheet1`
- Lookup column: `uid`
- Lookup value: `{{ $json.uid }}`

**Output**: Récupère la ligne avec:
- `prompt`
- `excel_file_id`
- `is_active`

**Exemple Expression**:
```
{{ $json.uid }}
```

### Nœud 3: IF - Vérifier Utilisateur Trouvé

**Configuration**:
- Type: `IF`
- Condition: `Rows returned` > 0
- True path: Continuer
- False path: Envoyer erreur 404

**True Path Output**:
```
{{ $nodes["Google Sheets Lookup"].json.rows[0] }}
```

### Nœud 4: Boucle sur Recordings

**Configuration**:
- Type: `Loop` ou `Loop Over Items`
- Input items: `{{ $json.recordings }}`

Pour chaque recording:

#### 4.1: Whisper API (Transcription)

**Configuration**:
- Type: `HTTP Request` ou `OpenAI` (si disponible)
- Method: `POST`
- URL: `https://api.openai.com/v1/audio/transcriptions`
- Headers:
  ```
  Authorization: Bearer {{ $env.OPENAI_API_KEY }}
  ```
- Body (form-data):
  - `file`: Audio blob (binary)
    ```
    {{ Buffer.from($item(0).audioData, 'base64') }}
    ```
  - `model`: `whisper-1`
  - `language`: `fr`

**Output**:
```json
{
  "text": "Transcription du patient..."
}
```

#### 4.2: Code JavaScript - Préparer Contexte

**Configuration**:
- Type: `Code`
- Language: `JavaScript`

**Code**:
```javascript
// Récupérer les infos utilisateur et le recording
const userRow = $nodeExecutionData[0].json;
const recording = $nodeExecutionData[1].json;
const transcription = $nodeExecutionData[2].json.text;

// Préparer le contexte
return {
  uid: userRow.uid,
  email: userRow.email,
  displayName: userRow.displayName,
  mode: userRow.mode,
  excel_file_id: userRow.excel_file_id,
  prompt: userRow.prompt,
  patientInfo: userRow.patientInfo,
  transcription: transcription,
  sectionId: recording.sectionId,
  recordingDuration: recording.duration
};
```

#### 4.3: Claude API (Extraction Structurée)

**Configuration**:
- Type: `HTTP Request` ou `Anthropic` (si node disponible)
- Method: `POST`
- URL: `https://api.anthropic.com/v1/messages`
- Headers:
  ```
  x-api-key: {{ $env.ANTHROPIC_API_KEY }}
  Content-Type: application/json
  ```

**Body (JSON)**:
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "system": "Tu es un assistant médical. Extrais les données structurées du texte fourni.",
  "messages": [
    {
      "role": "user",
      "content": "{{ $nodeExecutionData[3].json.prompt }}\n\nTexte transcrit:\n{{ $nodeExecutionData[3].json.transcription }}"
    }
  ]
}
```

**Output Parsing**:
- Extraire `content[0].text`
- Parser JSON si nécessaire

#### 4.4: Code JavaScript - Formater pour Google Sheets

**Configuration**:
- Type: `Code`

**Code**:
```javascript
const extracted = $nodeExecutionData[4].json;
const context = $nodeExecutionData[3].json;

// Parser la réponse Claude
let parsedData = {};
try {
  parsedData = JSON.parse(extracted.content[0].text);
} catch (e) {
  parsedData = { raw_text: extracted.content[0].text };
}

// Formater pour Google Sheets
return {
  timestamp: new Date().toISOString(),
  uid: context.uid,
  email: context.email,
  displayName: context.displayName,
  sectionId: context.sectionId,
  patientInfo: context.patientInfo,
  ...parsedData
};
```

#### 4.5: Google Sheets Append

**Configuration**:
- Type: `Google Sheets`
- Operation: `Append row`
- Authentication: Service Account
- Spreadsheet: `{{ $nodeExecutionData[4].json.excel_file_id }}`
- Sheet: `Sheet1`
- Columns to insert:
  ```
  timestamp
  uid
  email
  displayName
  sectionId
  numeroDossier
  nomPatient
  (toutes les colonnes extraites)
  ```

**Values**:
```
{{ $nodeExecutionData[5].json.timestamp }}
{{ $nodeExecutionData[5].json.uid }}
{{ $nodeExecutionData[5].json.email }}
... (etc)
```

### Nœud 5: Response (Après Loop)

**Configuration**:
- Type: `HTTP Response` ou `Respond to Webhook`

**Response Body**:
```json
{
  "success": true,
  "message": "Data processed successfully",
  "recordingsProcessed": "{{ $json.recordings.length }}",
  "timestamp": "{{ new Date().toISOString() }}"
}
```

**Status Code**: `200`

---

## Étape 3: Variables d'Environnement n8n

Configurez ces variables dans n8n:

```env
OPENAI_API_KEY=sk-proj-...           # Clé API OpenAI pour Whisper
ANTHROPIC_API_KEY=sk-ant-...         # Clé API Anthropic pour Claude
GOOGLE_SHEETS_SPREADSHEET_ID=...     # ID du sheet "DictaMed_Users"
```

---

## Étape 4: Configuration Google Sheets

### Sheet "DictaMed_Users"

**Colonnes (ordre exact)**:
1. `uid` - Firebase UID
2. `email` - Email utilisateur
3. `displayName` - Nom
4. `prompt` - Prompt personnalisé
5. `excel_file_id` - ID du sheet résultats
6. `is_active` - TRUE/FALSE

**Permissions**:
- Partagez avec le service account Google
- Permissions: Editor

### Sheet Résultats (Personnel à chaque utilisateur)

**Colonnes** (personnalisables):
1. `timestamp` - Quand ajouté
2. `uid` - Qui
3. `email` - Email
4. `displayName` - Nom
5. `sectionId` - Partie (partie1, partie2, etc)
6. `numeroDossier` - Dossier patient
7. `nomPatient` - Nom patient
8. ... (colonnes extraites personnalisées)

**Permissions**:
- Partagez avec le service account Google
- Permissions: Editor

---

## Étape 5: Gestion des Modes (TEST vs NORMAL)

### Option 1: Même Workflow, Paramètre Mode

Garder **1 seul workflow** et passer `mode` dans le payload:

```javascript
// Frontend envoie toujours le mode
const payload = {
  uid: user.uid,
  email: user.email,
  mode: "test", // ou "normal" / "dmi"
  ...
};
```

Le workflow traite simplement et laisse `mode` dans les résultats.

### Option 2: Webhooks Séparés (Recommandé)

Créer **2 workflows complètement séparés**:

#### Webhook `/webhook/DictaMed` (NORMAL + DMI)
- Même structure que ci-dessus
- Stocke résultats dans `excel_file_id` du user

#### Webhook `/webhook/DictaMed-Test` (TEST)
- Peut avoir une logique légèrement différente
- Peut avoir un prompt spécifique pour tests
- Stocke résultats dans un sheet TEST global (optionnel)

**Avantage**: Flexibilité (prompts différents par mode)

---

## Étape 6: Gestion des Erreurs

Ajoutez un nœud `Error Handler` après les points critiques:

### Après Lookup Google Sheets
```
Error → Envoyer notification Slack/Email
      → Response 404: "User not found in configuration"
```

### Après Whisper API
```
Error → Response 400: "Audio transcription failed"
      → Log erreur
```

### Après Claude API
```
Error → Response 400: "Data extraction failed"
      → Log erreur
```

---

## Étape 7: Testing

### Test 1: Lookup Google Sheets

**Payload Test**:
```json
{
  "uid": "test-user-123",
  "email": "test@example.com",
  "displayName": "Test User",
  "mode": "test",
  "recordings": [],
  "patientInfo": {}
}
```

**Résultat attendu**:
```
✅ Utilisateur trouvé dans Google Sheets
✅ Prompt récupéré
✅ excel_file_id récupéré
```

### Test 2: Whisper API

Envoyez un audio valide en base64:
```
✅ Transcription réussie
✅ Texte français correct
```

### Test 3: Claude API

Vérifiez extraction:
```
✅ JSON valide retourné
✅ Colonnes extraites correctes
```

### Test 4: Google Sheets Append

Vérifiez dans le sheet résultats:
```
✅ Nouvelle ligne ajoutée
✅ Timestamp correct
✅ Données structurées correctes
```

---

## Étape 8: Déploiement

1. **Préparer Google Sheets**:
   ```bash
   ✅ Créer "DictaMed_Users"
   ✅ Ajouter au moins 1 utilisateur test
   ✅ Créer Google Sheet résultats test
   ✅ Partager avec service account
   ```

2. **Configurer n8n**:
   ```bash
   ✅ Ajouter variables d'environnement
   ✅ Créer webhook /webhook/DictaMed
   ✅ Créer webhook /webhook/DictaMed-Test (optionnel)
   ✅ Tester avec le payload ci-dessus
   ```

3. **Vérifier Frontend**:
   ```bash
   ✅ config.js pointe vers bon webhook
   ✅ data-sender.js enrichit uid/email
   ✅ Pas d'erreur dans console
   ```

4. **Test End-to-End**:
   ```bash
   ✅ Utilisateur se connecte
   ✅ Enregistre audio
   ✅ Clique "Envoyer"
   ✅ Vérifier résultat dans Google Sheet
   ```

---

## Étape 9: Performance & Limites

### Rate Limits
- **Whisper API**: 50 requêtes/minute
- **Claude API**: Dépend du plan (voir Anthropic)
- **Google Sheets API**: 300 requêtes/minute

### Timeouts
- Whisper: 120 secondes (audio max 25MB)
- Claude: 60 secondes
- Google Sheets: 30 secondes

### Optimisations
1. **Batch Processing**: Traiter plusieurs recordings séquentiellement (pas parallèle)
2. **Caching**: Cache Google Sheets lookup 5 minutes
3. **Compression**: Audio max 5MB en base64

---

## Étape 10: Monitoring

### Logs à Surveiller
```javascript
// Frontend (console du navigateur)
DataSender: Sending to endpoint: https://n8n.../webhook/DictaMed (mode: normal)

// n8n (logs du workflow)
✅ Webhook reçu
✅ Utilisateur trouvé: uid=abc123
✅ Whisper transcription: "Patient agé de 45..."
✅ Claude extraction: JSON valide
✅ Google Sheets append: Ligne 42 ajoutée
```

### Alertes à Configurer
- ❌ 404 Lookup: Utilisateur absent → Email admin
- ❌ 500 Whisper: API failover → Retry 3x
- ❌ 500 Claude: API failover → Email admin
- ⚠️ Timeout > 30s: Vérifier logs

---

## Checkliste de Déploiement

- [ ] Google Sheet "DictaMed_Users" créé et partagé
- [ ] Webhook `/webhook/DictaMed` configuré
- [ ] Webhook `/webhook/DictaMed-Test` configuré (optionnel)
- [ ] Variables d'environnement n8n: OPENAI_API_KEY, ANTHROPIC_API_KEY
- [ ] Google Sheets authentication configurée
- [ ] Test lookup utilisateur: ✅
- [ ] Test Whisper API: ✅
- [ ] Test Claude API: ✅
- [ ] Test Google Sheets append: ✅
- [ ] Test end-to-end frontend: ✅
- [ ] Monitoring & alertes configurés: ✅

---

## Support

- 📖 Architecture: [ARCHITECTURE_SIMPLIFIEE.md](ARCHITECTURE_SIMPLIFIEE.md)
- 🔧 Frontend: `js/components/data-sender.js`
- 🐍 Migration: `scripts/migrate-users-to-sheets.js`
- 💬 n8n Support: https://community.n8n.io/

**Version**: 5.0.0
**Dernière mise à jour**: 2025-01-15
