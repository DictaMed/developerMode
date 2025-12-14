# Résumé: Identification des Types de Données par Mode

**Date**: 14 Décembre 2025
**Commit**: b369db0

---

## 🎯 Résumé Exécutif

Chaque mode DictaMed envoie maintenant des payloads webhook avec une **identification explicite du type de données**. Cela permet à votre workflow N8N de:

✅ Identifier rapidement le type de contenu reçu
✅ Router les données vers le bon processus
✅ Traiter les données de manière appropriée
✅ Générer des rapports par type de données

---

## 📊 Tableau Récapitulatif

```
┌─────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│   Mode      │ Input Type   │ Input Types  │  Contenu     │  Traitement  │
├─────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│  Normal     │ "audio"      │ ["audio"]    │ Audio 🎵     │ Recordings   │
│  Test       │ "audio"      │ ["audio"]    │ Audio 🎵     │ Recordings   │
│  DMI        │ "text"       │ ["text"]     │ Texte 📝 +   │ Texte +      │
│             │              │              │ Photos 📷    │ Photos       │
└─────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## 🎵 Mode NORMAL - Audio

```javascript
payload.inputType = "audio"           // Type principal
payload.inputTypes = ["audio"]        // Liste des types

recording.inputType = "audio"         // Type de chaque enregistrement
recording.format = "webm"             // Format audio
recording.duration = 45.5             // Durée en secondes
recording.audioData = "base64..."     // Données encodées
```

**Identification N8N:**
```javascript
if (payload.inputType === "audio" && payload.mode === "normal") {
  // Traiter enregistrements audio Mode Normal
}
```

---

## 🧪 Mode TEST - Audio

```javascript
payload.inputType = "audio"           // Type principal (identique au Normal)
payload.inputTypes = ["audio"]        // Liste des types

recording.inputType = "audio"         // Type de chaque enregistrement
recording.format = "webm"             // Format audio
```

**Identification N8N:**
```javascript
if (payload.inputType === "audio" && payload.mode === "test") {
  // Traiter enregistrements audio Mode Test (données de démo)
}
```

---

## 📝 Mode DMI - Texte + Photos

```javascript
payload.inputType = "text"            // Type principal (Texte)
payload.inputTypes = ["text"]         // Note: Photos détectées via photos array

payload.texte = "Observations..."     // Contenu texte
payload.photos = [                    // Tableau de photos
  {
    inputType: "photo",               // Type de chaque photo
    data: "base64...",                // Données d'image
    index: 0                          // Index dans le tableau
  },
  // ... autres photos
]
```

**Identification N8N:**
```javascript
if (payload.inputType === "text" && payload.mode === "dmi") {
  // Traiter texte + photos Mode DMI
  const hasPhotos = payload.photos && payload.photos.length > 0;
  const photoTypes = payload.photos.map(p => p.inputType); // ["photo", "photo"]
}
```

---

## 🔄 Champs de Routing Disponibles

### Niveau Payload (Haut niveau)

| Champ | Valeur | Usage |
|-------|--------|-------|
| `mode` | `"normal"` \| `"test"` \| `"dmi"` | Identifier le mode |
| `inputType` | `"audio"` \| `"text"` | Identifier le type principal |
| `inputTypes` | `["audio"]` ou `["text"]` | Lister tous les types présents |

### Niveau Objet (Items individuels)

Pour **Recordings (Audio):**
```javascript
recording.inputType = "audio"
recording.format = "webm" | "mp4" | ...
recording.sectionId = "partie1" | "partie2" | ...
```

Pour **Photos (DMI):**
```javascript
photo.inputType = "photo"
photo.index = 0, 1, 2, ...
```

---

## 🎯 Patterns de Routing N8N

### Pattern 1: Simple - Par Mode

```javascript
switch(payload.mode) {
  case "normal":
  case "test":
    // Traiter audio
    break;
  case "dmi":
    // Traiter texte/photos
    break;
}
```

### Pattern 2: Avancé - Par Type + Mode

```javascript
if (payload.inputType === "audio" && ["normal", "test"].includes(payload.mode)) {
  // Traiter audio
  const recordingCount = payload.recordings.length;
  payload.recordings.forEach(rec => {
    if (rec.inputType === "audio") {
      // Chaque enregistrement est du audio
    }
  });
} else if (payload.inputType === "text" && payload.mode === "dmi") {
  // Traiter texte
  const text = payload.texte;

  // Traiter photos
  const photos = payload.photos.filter(p => p.inputType === "photo");
  photos.forEach(photo => {
    // Chaque photo est du photo
  });
}
```

### Pattern 3: Détection Dynamique

```javascript
// Détecter automatiquement ce qui est présent

const hasAudio = payload.inputType === "audio" || payload.inputTypes?.includes("audio");
const hasText = payload.inputType === "text";
const hasPhotos = Array.isArray(payload.photos) && payload.photos.length > 0;

// Créer un rapport
return {
  dataTypes: {
    audio: hasAudio,
    text: hasText,
    photo: hasPhotos
  },
  counts: {
    recordings: payload.recordings?.length || 0,
    photos: payload.photos?.length || 0
  }
};
```

---

## 📋 Exemples Concrets de Traitement

### Audio: Télécharger vers Google Drive

```javascript
if (payload.inputType === "audio") {
  for (const recording of payload.recordings) {
    if (recording.inputType === "audio") {
      // Décoder base64
      const audioBuffer = Buffer.from(recording.audioData.split(',')[1], 'base64');

      // Créer le nom du fichier
      const filename = `${payload.email}_${recording.sectionId}_${recording.format}`;

      // Uploader
      // await uploadToDrive(audioBuffer, filename);
    }
  }
}
```

### Texte/Photos: Créer un Document

```javascript
if (payload.inputType === "text" && payload.mode === "dmi") {
  // Préparer le contenu du document
  let docContent = `
    Dossier: ${payload.NumeroDeDossier}
    Patient: ${payload.NomDuPatient}

    Notes:
    ${payload.texte}
  `;

  // Ajouter les photos
  const photos = payload.photos.filter(p => p.inputType === "photo");
  if (photos.length > 0) {
    docContent += `\n\nPhotos (${photos.length}):`;
    photos.forEach(p => {
      docContent += `\n[Photo ${p.index}]`;
    });
  }

  // Créer le document
  // await createGoogleDoc(docContent, payload.NumeroDeDossier);
}
```

---

## 🔐 Validation des Données

### Validation Audio

```javascript
// Vérifier que l'audio est bien identifié

if (payload.inputType !== "audio") {
  throw new Error("Expected audio data but got: " + payload.inputType);
}

if (!payload.recordings || payload.recordings.length === 0) {
  throw new Error("Audio payload doit inclure au moins un recording");
}

payload.recordings.forEach((rec, i) => {
  if (rec.inputType !== "audio") {
    throw new Error(`Recording ${i} n'est pas du audio: ${rec.inputType}`);
  }

  if (!rec.audioData) {
    throw new Error(`Recording ${i} manque les données audio`);
  }

  if (!rec.format) {
    throw new Error(`Recording ${i} manque le format`);
  }
});
```

### Validation DMI

```javascript
// Vérifier que le texte/photos est bien identifié

if (payload.inputType !== "text") {
  throw new Error("Expected text data but got: " + payload.inputType);
}

if (!payload.NumeroDeDossier) {
  throw new Error("DMI payload doit inclure NumeroDeDossier");
}

if (payload.photos && payload.photos.length > 0) {
  payload.photos.forEach((photo, i) => {
    if (photo.inputType !== "photo") {
      throw new Error(`Photo ${i} n'est pas du photo: ${photo.inputType}`);
    }
  });
}
```

---

## 📊 Logs de Débogage pour N8N

### Ajouter ce Code dans un Nœud N8N

```javascript
// Afficher les informations de type reçues

const infoMessage = `
WEBHOOK REÇU:
- Mode: ${webhookPayload.mode}
- Input Type: ${webhookPayload.inputType}
- Input Types: ${JSON.stringify(webhookPayload.inputTypes)}
- Recordings: ${webhookPayload.recordings?.length || 0}
- Photos: ${webhookPayload.photos?.length || 0}
- Has Text: ${!!webhookPayload.texte}
`;

console.log(infoMessage);

// Retourner pour affichage
return {
  message: infoMessage,
  mode: webhookPayload.mode,
  dataType: webhookPayload.inputType,
  dataTypes: webhookPayload.inputTypes
};
```

---

## ✨ Bénéfices de Cette Approche

| Bénéfice | Description |
|----------|-------------|
| **Clarté** | Chaque payload déclare explicitement son type |
| **Routing** | N8N peut router basé sur inputType directement |
| **Robustesse** | Détection d'erreurs si type reçu ≠ type attendu |
| **Logs** | Debug facile avec type clair dans les logs |
| **Scalabilité** | Ajouter de nouveaux types devient trivial |
| **Documentation** | La structure du payload est auto-documentée |

---

## 🚀 Prochaines Étapes

1. **Mettre à jour N8N Workflow**
   ```javascript
   // Utiliser inputType pour le routing
   if (webhookPayload.inputType === "audio") {
     // Branche audio
   } else if (webhookPayload.inputType === "text") {
     // Branche texte/photos
   }
   ```

2. **Ajouter de la Validation**
   ```javascript
   if (webhookPayload.inputType !== expectedType) {
     throw new Error(`Type mismatch: expected ${expectedType}`);
   }
   ```

3. **Générer des Rapports**
   ```javascript
   // Compter par type
   const audioCount = records.filter(r => r.inputType === "audio").length;
   const photoCount = records.filter(r => r.inputType === "photo").length;
   ```

4. **Tester les Trois Modes**
   - Mode Normal: Vérifier `inputType: "audio"`
   - Mode Test: Vérifier `inputType: "audio"`
   - Mode DMI: Vérifier `inputType: "text"` + photos

---

## 📚 Documentation Complète

- **WEBHOOK_PAYLOAD_STRUCTURE.md** - Structure détaillée des payloads
- **WEBHOOK_EXAMPLES.md** - Exemples réels de webhooks reçus
- **N8N_CONDITIONAL_WORKFLOW_V2.md** - Patterns N8N avancés

---

## 📌 Résumé Rapide

| Mode | inputType | Contenu |
|------|-----------|---------|
| 🎵 Normal | `"audio"` | Enregistrements audio uniquement |
| 🎵 Test | `"audio"` | Enregistrements audio (démo) |
| 📝 DMI | `"text"` | Texte libre + Photos optionnelles |

**Tous les payloads incluent**: `inputType`, `inputTypes`, `mode`, et timestamp

**Tous les items individuels incluent**: `inputType` propre à l'item

---

**Dernière mise à jour**: 14 Décembre 2025
**Commit**: b369db0
