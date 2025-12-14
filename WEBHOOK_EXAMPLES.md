# Exemples Réels de Webhooks N8N

**Date**: 14 Décembre 2025

Exemples réels de payloads envoyés au webhook N8N avec les types de données identifiés.

---

## 🎵 Exemple 1: Mode Normal avec 2 Enregistrements Audio

### Contexte
- Utilisateur connecté: `jean@example.com`
- 2 enregistrements audio: Partie 1 (45s) et Partie 2 (120s)
- Pas de photos

### Payload JSON Reçu

```json
{
  "uid": "firebase_uid_12345",
  "email": "jean@example.com",
  "displayName": "Jean Dupont",
  "mode": "normal",
  "inputType": "audio",
  "inputTypes": ["audio"],
  "timestamp": "2025-12-14T15:30:00.000Z",
  "patientInfo": {
    "dossier": "DOS-2025-001",
    "patient": "Patient Test",
    "age": 45,
    "genre": "M"
  },
  "recordings": [
    {
      "sectionId": "partie1",
      "sectionIndex": 1,
      "inputType": "audio",
      "duration": 45.5,
      "size": 102400,
      "format": "webm",
      "timestamp": "2025-12-14T15:28:00.000Z",
      "audioData": "data:audio/webm;base64,GkXfo59Ch...[long base64 string]...==",
      "metadata": {
        "hasAudioData": true,
        "blobType": "audio/webm"
      }
    },
    {
      "sectionId": "partie2",
      "sectionIndex": 2,
      "inputType": "audio",
      "duration": 120.0,
      "size": 307200,
      "format": "webm",
      "timestamp": "2025-12-14T15:30:00.000Z",
      "audioData": "data:audio/webm;base64,GkXfo59Ch...[long base64 string]...==",
      "metadata": {
        "hasAudioData": true,
        "blobType": "audio/webm"
      }
    }
  ],
  "metadata": {},
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."
}
```

### Traitement N8N

```javascript
// Dans un nœud Code N8N

// ✅ Identifier le type: audio
if (webhookPayload.inputType === 'audio') {
  console.log(`Reçu ${webhookPayload.recordings.length} enregistrements audio`);

  // Traiter chaque enregistrement
  webhookPayload.recordings.forEach(recording => {
    if (recording.inputType === 'audio') {
      console.log(`Enregistrement ${recording.sectionId}: ${recording.duration}s, ${recording.format}`);

      // 1. Décoder le base64
      const audioData = recording.audioData.split(',')[1];
      const audioBuffer = Buffer.from(audioData, 'base64');

      // 2. Sauvegarder le fichier
      // fs.writeFileSync(`${recording.sectionId}.${recording.format}`, audioBuffer);

      // 3. Uploader vers Google Drive
      // await uploadToGoogleDrive(audioBuffer, `${recording.sectionId}.webm`);
    }
  });
}
```

---

## 🧪 Exemple 2: Mode Test avec 1 Enregistrement

### Contexte
- Utilisateur connecté: `test@example.com`
- 1 enregistrement audio: Partie 1 (60s)
- Mode: TEST (pour démonstration)

### Payload JSON Reçu

```json
{
  "uid": "firebase_uid_67890",
  "email": "test@example.com",
  "displayName": "Test User",
  "mode": "test",
  "inputType": "audio",
  "inputTypes": ["audio"],
  "timestamp": "2025-12-14T16:00:00.000Z",
  "patientInfo": {
    "dossier": "TEST-12345",
    "patient": "Test Patient"
  },
  "recordings": [
    {
      "sectionId": "partie1",
      "sectionIndex": 1,
      "inputType": "audio",
      "duration": 60.0,
      "size": 204800,
      "format": "webm",
      "timestamp": "2025-12-14T15:59:00.000Z",
      "audioData": "data:audio/webm;base64,GkXfo59Ch...[long base64 string]...==",
      "metadata": {
        "hasAudioData": true,
        "blobType": "audio/webm"
      }
    }
  ],
  "metadata": {},
  "userAgent": "Mozilla/5.0..."
}
```

### Différences avec Mode Normal
- ✅ Mode `test` au lieu de `normal`
- ✅ Peut utiliser un webhook séparé
- ✅ Données de test au lieu de données réelles

---

## 📝 Exemple 3: Mode DMI avec Texte et 3 Photos

### Contexte
- Utilisateur connecté: `marie@example.com`
- Texte libre: Observations cliniques
- 3 photos téléchargées
- Mode: DMI (données médico-informatiques)

### Payload JSON Reçu

```json
{
  "mode": "dmi",
  "inputType": "text",
  "recordedAt": "2025-12-14T16:30:00.000Z",
  "NumeroDeDossier": "DMI-2025-042",
  "NomDuPatient": "Marie Dubois",
  "texte": "Patiente présentant une inflammation légère de la partie antérieure du genou droit. Pas de suintement. Les mouvements sont limités à 80% de l'amplitude normale. Aucune douleur à la palpation du ligament croisé antérieur. Recommandations: repos, glaçage, compression et surélevation pendant 3 jours.",
  "photos": [
    {
      "inputType": "photo",
      "data": "/9j/4AAQSkZJRgABAQEAYABgAAD...[long base64 string]...==",
      "index": 0,
      "timestamp": "2025-12-14T16:28:00.000Z"
    },
    {
      "inputType": "photo",
      "data": "/9j/4AAQSkZJRgABAQEAYABgAAD...[long base64 string]...==",
      "index": 1,
      "timestamp": "2025-12-14T16:28:30.000Z"
    },
    {
      "inputType": "photo",
      "data": "/9j/4AAQSkZJRgABAQEAYABgAAD...[long base64 string]...==",
      "index": 2,
      "timestamp": "2025-12-14T16:29:00.000Z"
    }
  ],
  "userEmail": "marie@example.com"
}
```

### Traitement N8N

```javascript
// Dans un nœud Code N8N

// ✅ Identifier le type: texte + photos
if (webhookPayload.inputType === 'text') {
  console.log(`Reçu texte DMI avec ${webhookPayload.photos.length} photos`);

  // 1. Sauvegarder le texte
  const docName = `DMI_${webhookPayload.NumeroDeDossier}_${new Date().getTime()}`;
  // await saveToGoogleDocs(webhookPayload.texte, docName);

  // 2. Traiter chaque photo
  webhookPayload.photos.forEach(photo => {
    if (photo.inputType === 'photo') {
      console.log(`Photo ${photo.index} - Type: ${photo.inputType}`);

      // Décoder et sauvegarder
      const photoBuffer = Buffer.from(photo.data, 'base64');
      const filename = `DMI_${webhookPayload.NumeroDeDossier}_photo_${photo.index}.jpg`;

      // await uploadPhotoToDrive(photoBuffer, filename);
    }
  });
}
```

---

## 📊 Exemple 4: Mode DMI avec Texte Seulement (Pas de Photos)

### Contexte
- Utilisateur connecté: `doctor@example.com`
- Texte libre: Notes cliniques
- Pas de photos

### Payload JSON Reçu

```json
{
  "mode": "dmi",
  "inputType": "text",
  "recordedAt": "2025-12-14T17:00:00.000Z",
  "NumeroDeDossier": "DMI-2025-043",
  "NomDuPatient": "Jean Martin",
  "texte": "Suivi post-opératoire 2 semaines après intervention arthroscopique. Patient rapporte une diminution significative de la douleur. Les points de suture ont été retirés. Pas de signe d'infection.",
  "photos": [],
  "userEmail": "doctor@example.com"
}
```

### Traitement N8N

```javascript
// Photos vide, traiter le texte uniquement

if (webhookPayload.inputType === 'text' && webhookPayload.photos.length === 0) {
  console.log('Reçu texte DMI sans photos');

  // Sauvegarder le texte uniquement
  // await saveToGoogleDocs(webhookPayload.texte, webhookPayload.NumeroDeDossier);
}
```

---

## 🔄 Comparaison des Types de Données

### Payload Audio (Mode Normal/Test)

| Champ | Valeur | Type |
|-------|--------|------|
| `inputType` | `"audio"` | string |
| `inputTypes` | `["audio"]` | array |
| `recordings[].inputType` | `"audio"` | string |
| `recordings[].format` | `"webm"` ou `"mp4"` | string |
| `recordings[].duration` | `45.5` | number (secondes) |
| `recordings[].audioData` | `base64string` | string |

### Payload Texte/Photo (Mode DMI)

| Champ | Valeur | Type |
|-------|--------|------|
| `inputType` | `"text"` | string |
| `texte` | `"Observations..."` | string |
| `photos[].inputType` | `"photo"` | string |
| `photos[].data` | `base64string` | string |
| `photos[].index` | `0`, `1`, `2`... | number |

---

## 🎯 Patterns N8N Utiles

### Pattern 1: Router par Type de Données

```javascript
const inputType = webhookPayload.inputType;

if (inputType === 'audio') {
  // Branche 1: Traiter audio
} else if (inputType === 'text') {
  // Branche 2: Traiter texte/photos
} else {
  // Branche 3: Erreur
}
```

### Pattern 2: Compter les Données

```javascript
return {
  mode: webhookPayload.mode,
  dataType: webhookPayload.inputType,
  recordingCount: webhookPayload.recordings?.length || 0,
  photoCount: webhookPayload.photos?.length || 0,
  hasText: !!webhookPayload.texte,
  hasAudio: webhookPayload.inputType === 'audio',
  hasDMI: webhookPayload.inputType === 'text'
};
```

### Pattern 3: Valider les Données

```javascript
// Valider que les données sont présentes

if (webhookPayload.inputType === 'audio') {
  if (!webhookPayload.recordings || webhookPayload.recordings.length === 0) {
    throw new Error('Audio payload doit inclure au moins un recording');
  }
} else if (webhookPayload.inputType === 'text') {
  if (!webhookPayload.NumeroDeDossier) {
    throw new Error('DMI payload doit inclure NumeroDeDossier');
  }
}
```

### Pattern 4: Mapper les Types de Données

```javascript
const dataTypesPresents = webhookPayload.inputTypes || [webhookPayload.inputType];

const typeMapping = {
  'audio': 'Enregistrement Audio',
  'text': 'Texte Libre',
  'photo': 'Photo'
};

const dataTypeLabels = dataTypesPresents.map(t => typeMapping[t]);
console.log(`Types de données: ${dataTypeLabels.join(', ')}`);
```

---

## 🐛 Débogage

### Vérifier le Type Reçu

```javascript
// Dans la première action du workflow N8N

console.log('=== WEBHOOK PAYLOAD DEBUG ===');
console.log('Mode:', webhookPayload.mode);
console.log('Input Type:', webhookPayload.inputType);
console.log('Input Types:', webhookPayload.inputTypes);
console.log('Recording Count:', webhookPayload.recordings?.length || 0);
console.log('Photo Count:', webhookPayload.photos?.length || 0);
console.log('Has Text:', !!webhookPayload.texte);
console.log('================');
```

### Logs Console Attendus

**Mode Normal:**
```
=== WEBHOOK PAYLOAD DEBUG ===
Mode: normal
Input Type: audio
Input Types: ["audio"]
Recording Count: 2
Photo Count: 0
Has Text: false
================
```

**Mode DMI:**
```
=== WEBHOOK PAYLOAD DEBUG ===
Mode: dmi
Input Type: text
Input Types: ["text"]
Recording Count: 0
Photo Count: 3
Has Text: true
================
```

---

## ✅ Checklist de Vérification

### Pour Chaque Webhook Reçu:

- [ ] `inputType` est présent dans le payload
- [ ] `inputType` correspond au mode (`audio` pour Normal/Test, `text` pour DMI)
- [ ] `inputTypes` est un tableau avec au moins un type
- [ ] Chaque enregistrement/photo a un `inputType`
- [ ] Les données correspondent au type déclaré
- [ ] N8N peut identifier le type et router correctement

---

## 📈 Statistiques Attendues

### Mode Normal (Exemple)
- Enregistrements: 2-4 par payload
- Taille moyenne par audio: 100-500 KB
- Durée moyenne: 45-120 secondes

### Mode Test (Exemple)
- Enregistrements: 1-2 par payload
- Taille moyenne par audio: 100-300 KB
- Durée moyenne: 30-90 secondes

### Mode DMI (Exemple)
- Photos: 0-5 par payload
- Taille moyenne par photo: 200-800 KB
- Texte: 100-1000 caractères

---

**Dernière mise à jour**: 14 Décembre 2025
