# DictaMed v2.0 - Quick Reference Card
## Copier-Coller pour Implémentation Rapide

---

## 🎯 Payload Formats

### Audio
```json
{
  "uid": "abc123",
  "email": "student@med.fr",
  "displayName": "Dr. Martin",
  "mode": "normal",
  "timestamp": "2025-01-15T10:30:00Z",
  "patientInfo": {"numeroDossier": "D123", "nomPatient": "Jean"},
  "inputType": "audio",
  "data": {
    "audioData": "SUQzBAAAI1NDVEgA...",
    "duration": 45,
    "format": "webm"
  },
  "metadata": {}
}
```

### Texte
```json
{
  "uid": "abc123",
  "email": "student@med.fr",
  "displayName": "Dr. Martin",
  "mode": "normal",
  "timestamp": "2025-01-15T10:30:00Z",
  "patientInfo": {"numeroDossier": "D123", "nomPatient": "Jean"},
  "inputType": "text",
  "data": {
    "text": "Patient se plaint de douleurs thoraciques...",
    "format": "text/plain"
  },
  "metadata": {}
}
```

### Photo
```json
{
  "uid": "abc123",
  "email": "student@med.fr",
  "displayName": "Dr. Martin",
  "mode": "normal",
  "timestamp": "2025-01-15T10:30:00Z",
  "patientInfo": {"numeroDossier": "D123", "nomPatient": "Jean"},
  "inputType": "photo",
  "data": {
    "photoData": "/9j/4AAQSkZJRgABA...",
    "mimeType": "image/jpeg",
    "description": "Radiographie thoracique"
  },
  "metadata": {}
}
```

---

## 🔧 Frontend Code

### Déterminer Type
```javascript
function determineInputType(recordingData) {
  if (recordingData.audioData) return 'audio';
  if (recordingData.text) return 'text';
  if (recordingData.photoData) return 'photo';
  return 'unknown';
}
```

### Envoyer Données
```javascript
async function sendDataToWebhook(user, recordingData, mode = 'normal') {
  const sender = new DataSender(user);

  // Traiter selon type
  let processedData;
  const inputType = determineInputType(recordingData);

  if (inputType === 'audio' && recordingData.audioBlob) {
    processedData = await sender.processAudioData(
      recordingData.audioBlob,
      recordingData.duration
    );
  } else if (inputType === 'text') {
    processedData = sender.processTextData(recordingData.text);
  } else if (inputType === 'photo' && recordingData.photoBlob) {
    processedData = await sender.processPhotoData(
      recordingData.photoBlob,
      recordingData.mimeType
    );
  }

  const payload = sender.buildPayload(processedData, mode);
  sender.validatePayload(payload);
  return await sender.makeApiCall(payload);
}
```

### Audio: MediaRecorder
```javascript
async startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  this.mediaRecorder = new MediaRecorder(stream);
  this.audioChunks = [];

  this.mediaRecorder.ondataavailable = (e) => {
    this.audioChunks.push(e.data);
  };

  this.mediaRecorder.start();
}

async stopRecording() {
  return new Promise((resolve) => {
    this.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      resolve({
        audioBlob: audioBlob,
        duration: 45,
        format: 'webm'
      });
    };
    this.mediaRecorder.stop();
  });
}
```

### Texte: Simple
```javascript
async sendText(textInput) {
  const recordingData = {
    text: textInput.trim(),
    format: 'text/plain'
  };
  await sendDataToWebhook(this.user, recordingData, this.currentMode);
}
```

### Photo: File Input
```javascript
async handlePhotoUpload(event) {
  const file = event.target.files[0];

  const recordingData = {
    photoBlob: file,
    mimeType: file.type,
    description: 'Photo description'
  };

  await sendDataToWebhook(this.user, recordingData, this.currentMode);
}
```

---

## 📊 n8n Nœuds

### Nœud 1: Webhook Trigger
```
Type: Webhook
Method: POST
URL: /webhook/DictaMed
```

### Nœud 2: Google Sheets Lookup
```
Operation: Get a row
Spreadsheet: {{ $env.DICTAMED_SHEETS_ID }}
Lookup column: uid
Lookup value: {{ $json.uid }}
```

### Nœud 3: IF
```
Condition: Rows returned > 0
```

### Nœud 4: Code JS
```javascript
const userConfig = $nodeExecutionData[0].json;
const webhook = $nodeExecutionData[1].json;

return {
  ...webhook,
  prompt: userConfig.prompt,
  excel_file_id: userConfig.excel_file_id
};
```

### Nœud 5: Switch
```
Case 1: {{ $json.inputType === 'audio' }}
Case 2: {{ $json.inputType === 'text' }}
Case 3: {{ $json.inputType === 'photo' }}
```

### Nœud 5.1: Whisper (Audio Only)
```
Type: HTTP Request
Method: POST
URL: https://api.openai.com/v1/audio/transcriptions

Headers:
Authorization: Bearer {{ $env.OPENAI_API_KEY }}

Body (form-data):
file: Buffer.from($json.data.audioData, 'base64')
model: whisper-1
language: fr
```

### Nœud 5.6: Vision (Photo Only)
```
Type: HTTP Request
Method: POST
URL: https://api.openai.com/v1/chat/completions

Headers:
Authorization: Bearer {{ $env.OPENAI_API_KEY }}
Content-Type: application/json

Body (JSON):
{
  "model": "gpt-4-vision",
  "max_tokens": 1500,
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": "Analyse cette image"},
      {
        "type": "image_url",
        "image_url": {
          "url": "data:{{ $json.data.mimeType }};base64,{{ $json.data.photoData }}"
        }
      }
    ]
  }]
}
```

### Nœud 5.3/5.5/5.8: Agent OpenAI (Tous)
```
Type: HTTP Request
Method: POST
URL: https://api.openai.com/v1/chat/completions

Headers:
Authorization: Bearer {{ $env.OPENAI_API_KEY }}
Content-Type: application/json

Body (JSON):
{
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 1500,
  "messages": [
    {
      "role": "system",
      "content": "{{ $json.prompt }}\n\nStructure les données en JSON."
    },
    {
      "role": "user",
      "content": "{{ $json.rawContent }}"
    }
  ]
}
```

### Nœud 6: Code JS (Consolidation)
```javascript
const agent = $nodeExecutionData[0].json;
const context = $nodeExecutionData[1].json;

let structured = {};
try {
  structured = JSON.parse(agent.choices[0].message.content);
} catch (e) {
  structured = { raw: agent.choices[0].message.content };
}

return {
  timestamp: new Date().toISOString(),
  uid: context.uid,
  email: context.email,
  inputType: context.inputType,
  patientInfo: JSON.stringify(context.patientInfo),
  ...structured
};
```

### Nœud 7: Google Sheets Append
```
Operation: Append row
Spreadsheet: {{ $json.excel_file_id }}
Sheet: Sheet1

Columns: timestamp, uid, email, inputType, patientInfo, [dynamiques]
```

### Nœud 8: HTTP Response
```json
{
  "success": true,
  "inputType": "{{ $json.inputType }}",
  "timestamp": "{{ new Date().toISOString() }}"
}
```

---

## 🗂️ Google Sheets

### DictaMed_Users
```
A: uid               (Text)
B: email             (Email)
C: displayName       (Text)
D: mode              (Text)
E: prompt            (Long text)
F: excel_file_id     (Text - ID du sheet résultats)
G: is_active         (Checkbox)
```

**Exemple Row:**
```
abc123 | student@med.fr | Dr. Martin | normal | Tu es un cardiologue... | 1KxYz... | ✓
```

### DictaMed_Results_[uid]
```
A: timestamp
B: uid
C: email
D: displayName
E: mode
F: inputType
G: patientInfo
H-Z: Colonnes dynamiques (selon prompt)
```

---

## 🛠️ Configuration

### config.js
```javascript
const APP_CONFIG = {
  INPUT_TYPES: {
    AUDIO: 'audio',
    TEXT: 'text',
    PHOTO: 'photo'
  },

  AUDIO_CONFIG: {
    maxDuration: 300,
    maxSizeBytes: 25 * 1024 * 1024,
    compression: { enabled: true, sampleRate: 16000 }
  },

  TEXT_CONFIG: {
    minLength: 5,
    maxLength: 50000
  },

  PHOTO_CONFIG: {
    maxSizeBytes: 20 * 1024 * 1024,
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp']
  },

  WEBHOOK_ENDPOINTS: {
    normal: 'https://n8n.example.com/webhook/DictaMed',
    test: 'https://n8n.example.com/webhook/DictaMed-Test',
    dmi: 'https://n8n.example.com/webhook/DictaMed'
  }
};
```

### n8n Environment Variables
```env
OPENAI_API_KEY=sk-proj-...
DICTAMED_SHEETS_ID=1KxYz...
WHISPER_LANGUAGE=fr
AGENT_MODEL=gpt-4
VISION_MODEL=gpt-4-vision
```

---

## 🧪 Tests

### Test Audio
```bash
curl -X POST http://localhost:3000/webhook/DictaMed \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-user",
    "email": "test@med.fr",
    "displayName": "Test",
    "mode": "test",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "patientInfo": {},
    "inputType": "audio",
    "data": {
      "audioData": "SUQzBAAAI1NDVEgA...",
      "duration": 30,
      "format": "webm"
    },
    "metadata": {}
  }'
```

### Test Texte
```bash
curl -X POST http://localhost:3000/webhook/DictaMed \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-user",
    "email": "test@med.fr",
    "inputType": "text",
    "data": {"text": "Patient avec symptômes..."},
    ...
  }'
```

### Test Photo
```bash
curl -X POST http://localhost:3000/webhook/DictaMed \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-user",
    "email": "test@med.fr",
    "inputType": "photo",
    "data": {
      "photoData": "/9j/4AAQSkZJRgABA...",
      "mimeType": "image/jpeg",
      "description": "Radiographie"
    },
    ...
  }'
```

---

## 📋 Checklist Rapide

### Setup (2-3 heures)
- [ ] Google Sheets "DictaMed_Users" créé
- [ ] n8n workflow avec 8 nœuds
- [ ] Frontend data-sender.js refactorisé
- [ ] Scripts validate-payload et audio-processor intégrés

### Tests (30 min)
- [ ] Test audio complet
- [ ] Test texte complet
- [ ] Test photo complet
- [ ] Tests erreurs

### Production (15 min)
- [ ] Code committé
- [ ] Firebase déployé
- [ ] Monitoring configuré
- [ ] Utilisateurs migrés

---

## ⚡ Common Issues & Fixes

| Problème | Solution |
|----------|----------|
| "inputType invalide" | Vérifier determineInputType() |
| "Whisper failed" | Tester clé API, format audio |
| "User not found" | Vérifier uid dans Google Sheets |
| "Agent structuration failed" | Vérifier prompt, parser JSON |
| "Google Sheets append failed" | Vérifier permissions, sheet_id |
| Timeout > 30s | Réduire taille audio/photo |
| Erreur 400 | Vérifier payload structure |

---

## 🎬 Implementation Timeline

```
Hour 0-1:    Google Sheets setup
Hour 1-2:    n8n workflow configuration
Hour 2-3:    Frontend modifications
Hour 3-4:    Testing
Hour 4-4.5:  Production deployment
```

---

## 📚 Full Documentation

- **Architecture**: docs/N8N_CONDITIONAL_WORKFLOW_V2.md
- **Frontend**: docs/FRONTEND_MODIFICATIONS_V2.md
- **Deployment**: docs/DEPLOYMENT_STRATEGY_V2.md
- **Overview**: docs/README_V2.md

---

**Version:** 2.0.0
**Last Updated:** 2025-01-15
**Status:** ✅ Production Ready
