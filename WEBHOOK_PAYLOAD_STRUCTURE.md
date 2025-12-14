# Webhook Payload Structure avec Types de Données

**Date**: 14 Décembre 2025
**Commit**: b369db0 - feat: add explicit input type identification to webhook payloads

---

## 📋 Vue d'Ensemble

Chaque mode envoie un payload JSON au webhook N8N avec des champs `inputType` et `inputTypes` pour identifier clairement le type de données envoyées.

### Types de Données Supportés
- 🎵 **audio**: Enregistrements audio (Mode Normal, Mode Test)
- 📝 **text**: Texte libre (Mode DMI)
- 📷 **photo**: Images/photos (Mode DMI)

---

## 🎵 Mode NORMAL - Payload Audio

### Structure Complète

```javascript
{
  // === User Information ===
  uid: "user123",
  email: "utilisateur@example.com",
  displayName: "John Doe",

  // === Identification des Données ===
  mode: "normal",
  inputType: "audio",          // ✅ Primary data type
  inputTypes: ["audio"],        // ✅ List of all input types
  timestamp: "2025-12-14T15:30:00.000Z",

  // === Patient Information ===
  patientInfo: {
    dossier: "DOS-12345",
    patient: "Jean Dupont",
    // ... autres champs patient
  },

  // === Audio Recordings ===
  recordings: [
    {
      sectionId: "partie1",
      sectionIndex: 1,
      inputType: "audio",           // ✅ Data type of this recording
      duration: 45.5,               // en secondes
      size: 102400,                 // en bytes
      format: "webm",               // format MIME type suffix
      timestamp: "2025-12-14T15:28:00.000Z",
      audioData: "base64encodedAudioData...",
      metadata: {
        hasAudioData: true,
        blobType: "audio/webm"
      }
    },
    {
      sectionId: "partie2",
      sectionIndex: 2,
      inputType: "audio",           // ✅ Data type of this recording
      duration: 120.0,
      size: 307200,
      format: "webm",
      timestamp: "2025-12-14T15:30:00.000Z",
      audioData: "base64encodedAudioData...",
      metadata: {
        hasAudioData: true,
        blobType: "audio/webm"
      }
    }
  ],

  // === Metadata ===
  metadata: {
    // Browser/system information
  },

  userAgent: "Mozilla/5.0..."
}
```

### Exemple Minimal

```json
{
  "uid": "firebase_uid",
  "email": "user@example.com",
  "mode": "normal",
  "inputType": "audio",
  "inputTypes": ["audio"],
  "timestamp": "2025-12-14T15:30:00Z",
  "recordings": [
    {
      "sectionId": "partie1",
      "inputType": "audio",
      "duration": 45.5,
      "size": 102400,
      "format": "webm"
    }
  ]
}
```

---

## 🧪 Mode TEST - Payload Audio (Identique au Mode Normal)

### Structure

Identique au Mode Normal, avec `mode: "test"` au lieu de `mode: "normal"`

```javascript
{
  uid: "user123",
  email: "utilisateur@example.com",
  mode: "test",              // ✅ Mode TEST
  inputType: "audio",        // ✅ Audio data type
  inputTypes: ["audio"],
  timestamp: "2025-12-14T15:30:00.000Z",
  patientInfo: {
    dossier: "TEST-001",
    patient: "Patient Test"
  },
  recordings: [
    {
      sectionId: "partie1",
      inputType: "audio",    // ✅ Audio type
      duration: 60.0,
      size: 204800,
      format: "webm"
    }
  ]
}
```

---

## 📝 Mode DMI - Payload Texte + Photos

### Structure Complète

```javascript
{
  // === Mode Information ===
  mode: "dmi",
  inputType: "text",                    // ✅ Primary data type: TEXT
  recordedAt: "2025-12-14T15:30:00.000Z",

  // === Patient Information ===
  NumeroDeDossier: "DMI-2025-001",
  NomDuPatient: "Marie Curie",

  // === Text Content ===
  texte: "Observations cliniques détaillées du patient...",

  // === Photos with Type Information ===
  photos: [
    {
      inputType: "photo",               // ✅ Data type: PHOTO
      data: "base64encodedPhotoData...",
      index: 0,
      timestamp: "2025-12-14T15:28:00.000Z"
    },
    {
      inputType: "photo",               // ✅ Data type: PHOTO
      data: "base64encodedPhotoData2...",
      index: 1,
      timestamp: "2025-12-14T15:29:00.000Z"
    }
  ],

  // === User Information ===
  userEmail: "utilisateur@example.com"
}
```

### Exemple Minimal

```json
{
  "mode": "dmi",
  "inputType": "text",
  "NumeroDeDossier": "DMI-2025-001",
  "NomDuPatient": "Nom Patient",
  "texte": "Observations...",
  "photos": [
    {
      "inputType": "photo",
      "data": "base64...",
      "index": 0
    }
  ],
  "userEmail": "user@example.com"
}
```

---

## 🔄 Utilisation dans N8N Workflow

### Routage Basé sur le Type de Données

```javascript
// Exemple de nœud Code N8N pour router les données

const webhookPayload = $nodeExecutionData[0].json;

// Router basé sur inputType
switch(webhookPayload.inputType) {
  case 'audio':
    // Traiter les données audio
    // - Télécharger vers Google Drive
    // - Sauvegarder métadonnées dans Google Sheets
    // - Envoyer à un service de transcription
    return {
      dataType: 'audio',
      recordingCount: webhookPayload.recordings.length,
      mode: webhookPayload.mode
    };

  case 'text':
    // Traiter les données texte et photos
    // - Sauvegarder le texte dans base de données
    // - Traiter les photos
    return {
      dataType: 'text',
      photoCount: webhookPayload.photos.length,
      hasText: !!webhookPayload.texte
    };

  default:
    throw new Error(`Unknown inputType: ${webhookPayload.inputType}`);
}
```

### Workflow Conditionnel

```javascript
// Nœud IF dans N8N pour décider du traitement

if (webhookPayload.inputType === 'audio' && webhookPayload.inputTypes.includes('audio')) {
  // Branche Audio: traiter enregistrements
} else if (webhookPayload.inputType === 'text' && webhookPayload.inputTypes.includes('photo')) {
  // Branche DMI: traiter texte + photos
} else {
  // Erreur: type de données inconnu
}
```

### Traitement des Photos avec Type

```javascript
// Traiter chaque photo avec son type identifié

webhookPayload.photos.forEach(photo => {
  if (photo.inputType === 'photo') {
    // Décoder base64
    const photoBuffer = Buffer.from(photo.data, 'base64');

    // Sauvegarder le fichier
    // fs.writeFileSync(`photo_${photo.index}.jpg`, photoBuffer);

    console.log(`Photo ${photo.index} (type: ${photo.inputType}) traité`);
  }
});
```

---

## 📊 Tableau Comparatif des Payloads

| Champ | Mode Normal | Mode Test | Mode DMI |
|-------|-------------|-----------|----------|
| **inputType** | `audio` | `audio` | `text` |
| **inputTypes** | `["audio"]` | `["audio"]` | `["text", "photo"]` |
| **mode** | `normal` | `test` | `dmi` |
| **recordings** | ✅ Oui | ✅ Oui | ❌ Non |
| **patientInfo** | ✅ Oui | ✅ Oui | ❌ Non |
| **texte** | ❌ Non | ❌ Non | ✅ Oui |
| **photos** | ❌ Non | ❌ Non | ✅ Oui |

---

## 🎵 Détails des Enregistrements Audio

Chaque objet recording inclut:

```javascript
{
  sectionId: "partie1",          // Identifiant de section
  sectionIndex: 1,               // Index numérique (1-4)
  inputType: "audio",            // ✅ Type de données
  duration: 45.5,                // Durée en secondes
  size: 102400,                  // Taille en bytes
  format: "webm",                // Format audio (webm, mp4, wav, etc.)
  timestamp: "ISO8601",          // Horodatage de l'enregistrement
  audioData: "base64string",     // Données audio encodées en base64
  metadata: {
    hasAudioData: true,
    blobType: "audio/webm"       // MIME type complet
  }
}
```

### Formats Audio Possibles
- `webm` → `audio/webm`
- `mp4` → `audio/mp4`
- `wav` → `audio/wav`
- `ogg` → `audio/ogg`
- `m4a` → `audio/mp4` ou `audio/m4a`

---

## 📷 Détails des Photos DMI

Chaque objet photo inclut:

```javascript
{
  inputType: "photo",            // ✅ Type de données
  data: "base64string",          // Données d'image encodées
  index: 0,                       // Index dans le tableau photos
  timestamp: "ISO8601"           // Horodatage de l'upload
}
```

### Formats Photo Possibles
- JPG/JPEG
- PNG
- GIF
- WebP
- TIFF

---

## 🔐 Authentification et Identification

Tous les payloads incluent:

### Mode Normal & Test
```javascript
{
  uid: "firebase_user_id",
  email: "utilisateur@example.com",
  displayName: "Nom Utilisateur"
}
```

### Mode DMI
```javascript
{
  userEmail: "utilisateur@example.com"
}
```

---

## 📈 Logs de Débogage

### Mode Normal/Test
```
DataSender: Payload structure for normal: {
  inputType: "audio",
  inputTypes: ["audio"],
  recordingCount: 2,
  hasPatientInfo: true
}
```

### Mode DMI
```
Payload inputTypes: {
  primaryInput: "text",
  hasText: true,
  photoCount: 2,
  photoInputType: "photo"
}
2 photos added with inputType: 'photo'
```

---

## ✅ Checklist de Vérification

- [ ] Mode Normal envoie `inputType: 'audio'` ✅
- [ ] Mode Test envoie `inputType: 'audio'` ✅
- [ ] Mode DMI envoie `inputType: 'text'` ✅
- [ ] Chaque enregistrement audio inclut `inputType: 'audio'` ✅
- [ ] Chaque photo inclut `inputType: 'photo'` ✅
- [ ] Payloads incluent liste `inputTypes` ✅
- [ ] N8N peut router basé sur inputType ✅
- [ ] Logs affichent les types de données ✅

---

## 🎯 Cas d'Usage dans N8N

### 1. Sauvegarder audio dans Google Drive
```javascript
if (webhookPayload.inputType === 'audio') {
  // Pour chaque recording avec inputType === 'audio'
  // 1. Décoder base64 → fichier audio
  // 2. Créer dossier dans Google Drive
  // 3. Uploader le fichier
  // 4. Sauvegarder les métadonnées dans Google Sheets
}
```

### 2. Traiter texte + photos DMI
```javascript
if (webhookPayload.inputType === 'text') {
  // 1. Sauvegarder le texte
  // 2. Pour chaque photo (inputType === 'photo')
  //    - Télécharger l'image
  //    - Uploader vers stockage
  //    - Créditer la photo à l'utilisateur
  // 3. Créer un document avec texte + photos
}
```

### 3. Compter les données par type
```javascript
const audioCount = webhookPayload.recordings?.filter(r => r.inputType === 'audio').length || 0;
const photoCount = webhookPayload.photos?.filter(p => p.inputType === 'photo').length || 0;
const hasText = webhookPayload.inputType === 'text' && webhookPayload.texte;

console.log(`Reçu: ${audioCount} audios, ${photoCount} photos, texte: ${hasText}`);
```

---

## 🚀 Version du Format

**Format Version**: 2.0 (14 Décembre 2025)
- Ajout de `inputType` par payload
- Ajout de `inputTypes` (liste)
- Ajout de `inputType` par recording/photo
- Structure cohérente entre les modes

---

**Dernière mise à jour**: 14 Décembre 2025
**Commit**: b369db0
