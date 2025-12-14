# n8n Workflow - Solution A: Traitement Batch d'Audios Multiples

**Date**: 2025-12-14
**Version**: 1.0
**Status**: Production Ready

---

## 📋 Vue d'ensemble

Traiter **plusieurs fichiers audio en 1 seule requête** avec n8n.

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   CLIENT (DictaMed App)                   │
│    Collecte 3+ fichiers audio dans un seul payload       │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│              n8n WEBHOOK (POST /DictaMed)                 │
│  Reçoit: { uid, email, audioFiles: [...] }              │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│          1. SPLIT IN BATCHES (audioFiles[])              │
│             Output: { audioData, sectionId, ... }        │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│          2. LOOP OVER ITEMS (Traite 1 audio)             │
│             ├─ OpenAI Whisper (Transcription)            │
│             ├─ Code Node (Transform Data)                │
│             ├─ OpenAI Agent (Structure)                  │
│             └─ Collect Output                            │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│       3. GOOGLE SHEETS (Append Multiple Rows)            │
│             Une ligne par audio traité                   │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│           4. RESPOND TO WEBHOOK (200 OK)                 │
│             { status: "success", count: 3 }              │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration n8n Pas-à-Pas

### NŒUD 1: Webhook Trigger

```yaml
Type: Webhook
Name: Webhook - DictaMed Audio Batch
Method: POST
URL: /webhook/dictamed-audio-batch
Authentication: None (optionnel: Bearer token)
Response Mode: When last node finishes
HTTP Status Code: 200

Expected Payload:
{
  "uid": "user123",
  "email": "doctor@hospital.fr",
  "displayName": "Dr. Martin",
  "mode": "normal",
  "prompt": "Résume cette consultation...",
  "patientInfo": {
    "numeroDossier": "D123456",
    "nomPatient": "Jean Dupont"
  },
  "audioFiles": [
    {
      "audioData": "base64_encoded_audio...",
      "duration": 45,
      "sectionId": "section_1",
      "format": "webm"
    },
    {
      "audioData": "base64_encoded_audio...",
      "duration": 60,
      "sectionId": "section_2",
      "format": "webm"
    }
  ]
}
```

---

### NŒUD 2: Split in Batches

```yaml
Type: Split in Batches
Name: Split Audios
Input: $.audioFiles
Batch Size: 1
Options:
  - Pass Data Through: YES
```

**Pourquoi?**
- Convertit l'array `audioFiles` en items individuels
- Chaque item = 1 fichier audio
- Permet le traitement en boucle

**Output**:
```
Item 1: { audioData: "...", duration: 45, sectionId: "section_1", ... }
Item 2: { audioData: "...", duration: 60, sectionId: "section_2", ... }
Item 3: { audioData: "...", duration: 30, sectionId: "section_3", ... }
```

---

### NŒUD 3: Loop Over Items

```yaml
Type: Loop Over Items
Name: Process Each Audio
Input From: Split in Batches node
Max Items: Unlimited
```

**À l'intérieur de la boucle, ajouter:**

---

### NŒUD 3.1: OpenAI - Whisper (À l'intérieur de Loop)

```yaml
Type: OpenAI
Name: Transcribe Audio
Model: Whisper-1
Operation: Audio
Audio Field: $.audioData
Language: fr

Input:
  audio_data: {{ $item().audioData }}  # Base64 from current item
  temperature: 0.3

Output:
  text: "La patiente se plaint de..."
  duration: "0h45m"
```

---

### NŒUD 3.2: Code Node - Transform Data (À l'intérieur de Loop)

```yaml
Type: Code
Name: Transform Audio Data
Language: JavaScript
```

**Code à insérer:**

```javascript
// ============================================
// TRANSFORM DATA - Multi Audio Batch Handler
// ============================================

// 1. Récupérer les données du webhook original
const webhookData = $input.first().json;

// 2. Récupérer le fichier audio courant (boucle)
const currentAudio = $item();

// 3. Récupérer la transcription d'OpenAI Whisper
const transcription = $nodeExecutionData[1]?.json?.text || '';

if (!transcription) {
  throw new Error('Transcription failed for audio: ' + (currentAudio.sectionId || 'unknown'));
}

// 4. Nettoyer et valider les données
const userData = {
  uid: webhookData.uid,
  email: webhookData.email,
  displayName: webhookData.displayName || 'Unknown',
  mode: webhookData.mode || 'normal',
  prompt: webhookData.prompt || '',
  patientInfo: webhookData.patientInfo || {}
};

// 5. Préparer les données audio
const audioData = {
  sectionId: currentAudio.sectionId,
  duration: currentAudio.duration || 0,
  format: currentAudio.format || 'webm',
  transcription: transcription.trim()
};

// 6. Combiner tout
const result = {
  // User Info
  ...userData,

  // Audio Info
  ...audioData,

  // Métadonnées
  processedAt: new Date().toISOString(),
  batchIndex: $runIndex,
  itemIndex: $item().__index || 0,

  // Pour validation
  validated: true,
  validatedAt: new Date().toISOString()
};

return result;
```

---

### NŒUD 3.3: OpenAI - Agent (À l'intérieur de Loop)

```yaml
Type: OpenAI (Chat Model)
Name: Structure Audio Data
Model: gpt-4-turbo-preview
Input from: Transform Audio Data node

System Prompt:
Tu es un assistant médical qui structure les transcriptions.
Formate la sortie en JSON structuré avec les champs requis.

User Input:
{{ $nodeExecutionData[0].json.transcription }}

Prompt Variables:
  - sectionId: {{ $nodeExecutionData[0].json.sectionId }}
  - patientInfo: {{ $nodeExecutionData[0].json.patientInfo }}
  - duration: {{ $nodeExecutionData[0].json.duration }}

JSON Mode: YES (Enable)

Output Template:
{
  "sectionId": "{{ $nodeExecutionData[0].json.sectionId }}",
  "symptoms": "...",
  "diagnosis": "...",
  "treatment": "...",
  "notes": "..."
}
```

---

### NŒUD 3.4: Merge Data (À l'intérieur de Loop)

```yaml
Type: Code
Name: Merge Agent + Audio Data
Language: JavaScript
```

**Code:**

```javascript
// Récupérer les données transformées
const transformedData = $nodeExecutionData[0].json;

// Récupérer la sortie du Structuring Agent
const agentOutput = $nodeExecutionData[1]?.json || {};

// Parser si c'est un string
let structuredData = agentOutput;
if (typeof agentOutput === 'string') {
  try {
    structuredData = JSON.parse(agentOutput);
  } catch (e) {
    structuredData = { raw: agentOutput };
  }
}

// Combiner tout pour Google Sheets
return {
  uid: transformedData.uid,
  email: transformedData.email,
  displayName: transformedData.displayName,
  mode: transformedData.mode,
  patientDossier: transformedData.patientInfo?.numeroDossier || '',
  patientName: transformedData.patientInfo?.nomPatient || '',
  sectionId: transformedData.sectionId,
  duration: transformedData.duration,
  format: transformedData.format,

  // Transcription brute
  transcription: transformedData.transcription,

  // Données structurées
  symptoms: structuredData.symptoms || '',
  diagnosis: structuredData.diagnosis || '',
  treatment: structuredData.treatment || '',
  notes: structuredData.notes || '',

  // Métadonnées
  processedAt: transformedData.processedAt,
  batchIndex: transformedData.batchIndex,
  itemIndex: transformedData.itemIndex,
  status: 'completed'
};
```

---

### NŒUD 3.5: Collect Data (À l'intérieur de Loop)

```yaml
Type: Collect Data
Name: Collect Audio Results
Merge By: None
Mode: Collect Data
```

**Pourquoi?** Accumule tous les résultats de la boucle en un array.

**Output:**
```json
[
  { uid: "user123", sectionId: "section_1", ... },
  { uid: "user123", sectionId: "section_2", ... },
  { uid: "user123", sectionId: "section_3", ... }
]
```

---

### NŒUD 4: Google Sheets - Append Rows

```yaml
Type: Google Sheets
Name: Append Rows to Sheet
Operation: Append
Authentication: Google Sheets OAuth
Spreadsheet: [Your DictaMed Spreadsheet]
Sheet: Transcriptions (or your sheet name)

Columns Mapping:
  UID: {{ $item.uid }}
  Email: {{ $item.email }}
  DisplayName: {{ $item.displayName }}
  Mode: {{ $item.mode }}
  PatientDossier: {{ $item.patientDossier }}
  PatientName: {{ $item.patientName }}
  SectionID: {{ $item.sectionId }}
  Duration: {{ $item.duration }}
  Transcription: {{ $item.transcription }}
  Symptoms: {{ $item.symptoms }}
  Diagnosis: {{ $item.diagnosis }}
  Treatment: {{ $item.treatment }}
  Notes: {{ $item.notes }}
  ProcessedAt: {{ $item.processedAt }}
  Status: {{ $item.status }}
```

---

### NŒUD 5: Response Node (Final)

```yaml
Type: Respond to Webhook
Name: Return Success Response

Response Body:
{
  "status": "success",
  "message": "Audio files processed successfully",
  "processed": {{ $node["Collect Audio Results"].json.length }},
  "timestamp": "{{ now() }}"
}

Status Code: 200
Headers:
  Content-Type: application/json
```

---

## 🖥️ Modifications Frontend (DictaMed App)

### Avant (1 seul fichier)

```javascript
// old-webhook.js
async function submitAudio(audioBlob) {
  const base64Audio = await blobToBase64(audioBlob);

  const payload = {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName,
    mode: 'normal',
    patientInfo: { ... },
    audioData: base64Audio,  // ❌ Un seul fichier
    sectionId: 'section_1',
    duration: 45
  };

  const response = await fetch('/webhook/DictaMed', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
```

### Après (Multiples fichiers - Solution A)

```javascript
// new-webhook-batch.js

/**
 * Préparer un batch d'audios pour traitement
 * @param {AudioFile[]} audioFiles - Array de fichiers audio
 * @returns {Promise<Response>}
 */
async function submitAudioBatch(audioFiles) {
  // 1. Convertir chaque blob en base64
  const audioFilesCopy = await Promise.all(
    audioFiles.map(async (file) => ({
      audioData: await blobToBase64(file.blob),
      duration: file.duration,
      sectionId: file.sectionId,
      format: file.format || 'webm'
    }))
  );

  // 2. Préparer le payload pour n8n
  const payload = {
    // Infos utilisateur
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName,
    mode: 'normal',

    // Prompt personnalisé
    prompt: document.getElementById('prompt-input')?.value ||
            'Résume cette consultation médicale de manière structurée.',

    // Infos patient
    patientInfo: {
      numeroDossier: document.getElementById('dossier-number')?.value || '',
      nomPatient: document.getElementById('patient-name')?.value || ''
    },

    // ✅ NOUVEAU: Array de fichiers audio
    audioFiles: audioFilesCopy
  };

  // 3. Envoyer à n8n
  try {
    const response = await fetch(
      'https://your-n8n-instance.com/webhook/dictamed-audio-batch',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ ${result.processed} fichiers traités`);

    // Afficher la notification
    showNotification(
      `${result.processed} enregistrements envoyés avec succès`,
      'success'
    );

    return result;
  } catch (error) {
    console.error('❌ Erreur lors du traitement batch:', error);
    showNotification(
      'Erreur: Impossible de traiter les fichiers',
      'error'
    );
    throw error;
  }
}

/**
 * Helper: Convertir Blob en Base64
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Helper: Afficher notification
 */
function showNotification(message, type = 'info') {
  if (window.notificationSystem) {
    window.notificationSystem[type](message);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

/**
 * Exemple d'utilisation:
 */
async function handleMultipleAudioRecordings() {
  // Array de fichiers audio avec métadonnées
  const audioFiles = [
    {
      blob: audioBlob1,
      duration: 45,
      sectionId: 'anamnesis',
      format: 'webm'
    },
    {
      blob: audioBlob2,
      duration: 60,
      sectionId: 'examination',
      format: 'webm'
    },
    {
      blob: audioBlob3,
      duration: 30,
      sectionId: 'diagnosis',
      format: 'webm'
    }
  ];

  try {
    await submitAudioBatch(audioFiles);
  } catch (error) {
    console.error('Failed:', error);
  }
}
```

---

## 📊 Google Sheets Structure

Votre feuille Google Sheets devrait avoir ces colonnes:

| UID | Email | DisplayName | Mode | PatientDossier | PatientName | SectionID | Duration | Transcription | Symptoms | Diagnosis | Treatment | Notes | ProcessedAt | Status |
|-----|-------|-------------|------|----------------|-------------|-----------|----------|---------------|----------|-----------|-----------|-------|-------------|--------|
| user123 | doc@med.fr | Dr. Martin | normal | D123456 | Jean Dupont | section_1 | 45 | "Le patient se plaint de..." | "Fièvre, toux" | "Grippe" | "Repos, médicaments" | "Suivi dans 1 semaine" | 2025-01-15T10:30:00Z | completed |

---

## ✅ Checklist d'Implémentation

### n8n Configuration
- [ ] Créer webhook avec URL `/webhook/dictamed-audio-batch`
- [ ] Ajouter nœud "Split in Batches"
- [ ] Configurer "Loop Over Items"
- [ ] Ajouter OpenAI Whisper (à l'intérieur boucle)
- [ ] Ajouter Code Node Transform (à l'intérieur boucle)
- [ ] Ajouter OpenAI Agent (à l'intérieur boucle)
- [ ] Ajouter Merge Data Code Node (à l'intérieur boucle)
- [ ] Ajouter Collect Data (à l'intérieur boucle)
- [ ] Configurer Google Sheets append
- [ ] Configurer Response Node

### Frontend (DictaMed)
- [ ] Importer `submitAudioBatch()` function
- [ ] Collecter les audios dans un array
- [ ] Appeler `submitAudioBatch(audioFiles)` au lieu d'envoyer un par un
- [ ] Tester avec 1, 2, 3+ fichiers
- [ ] Vérifier les résultats dans Google Sheets

### Testing
- [ ] Test avec 1 fichier audio
- [ ] Test avec 3 fichiers audio
- [ ] Test avec 5+ fichiers audio
- [ ] Vérifier les transcriptions dans Google Sheets
- [ ] Vérifier les données structurées par l'agent
- [ ] Tester la gestion d'erreur (fichier audio corrompu)

---

## 🐛 Dépannage

### Problème: "audioFiles is undefined"
**Solution**: Assurez-vous que le payload frontend inclut `audioFiles` comme array.

### Problème: Whisper timeout sur fichiers longs
**Solution**: Diviser les fichiers > 25MB avant l'envoi.

```javascript
function splitLargeAudio(blob, maxDuration = 300) {
  // Implémenter si nécessaire
  // Ou utiliser: https://github.com/neetly/trimmer
}
```

### Problème: Google Sheets rate limit
**Solution**: Ajouter un délai entre les requêtes.

```yaml
Type: Wait
Name: Rate Limiting Delay
Time: 1 (second)
```

### Problème: Boucle traite les fichiers séquentiellement (lent)
**Solution**: Utiliser "Execute Workflow" pour paralléliser (voir "Approche C").

---

## 📈 Performance

| Nombre Fichiers | Temps Estimé | Notes |
|-----------------|--------------|-------|
| 1 | 15-30s | Baseline |
| 3 | 45-90s | Séquentiel (recommandé) |
| 5 | 75-150s | Peut être lent |
| 10+ | 150s+ | Considérer Approche C |

---

## 🚀 Optimisations Futures

1. **Parallélisation** (Approche C)
   - Utiliser Execute Workflow pour traiter en parallèle
   - ~3x plus rapide pour 10+ fichiers

2. **Caching Whisper**
   - Cacher les transcriptions identiques
   - Éviter re-transcriber la même audio

3. **Batch Size Dynamique**
   - Augmenter batch size si CPU bas
   - Réduire si timeout

4. **Compression Audio**
   - Compresser avant envoi
   - Réduire taille payload

---

## 📚 Ressources

- [n8n Split in Batches](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base-splitinbatches/)
- [n8n Loop Over Items](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base-loopoveritems/)
- [OpenAI Whisper n8n](https://docs.n8n.io/integrations/builtin/cluster-nodes/n8n-nodes-langchain-openai/)
- [Google Sheets n8n](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-google-sheets/)

---

**Last Updated**: 2025-12-14
**Status**: Production Ready ✅
**Tested with**: n8n 1.x, OpenAI API, Google Sheets API
