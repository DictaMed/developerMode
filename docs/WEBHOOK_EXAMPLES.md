# DictaMed - Exemples de Configuration des Webhooks

## 🎯 Exemples Pratiques

### Exemple 1: Un Seul Webhook pour Tout

Si vous avez un **seul workflow n8n** qui traite audio, texte ET photos:

**Fichier: `js/config/webhooks-config.js`**
```javascript
const WEBHOOKS_CONFIG = {
    audio: 'https://n8n.votre-domaine.com/webhook/dictamed-unified',
    text:  'https://n8n.votre-domaine.com/webhook/dictamed-unified',
    photo: 'https://n8n.votre-domaine.com/webhook/dictamed-unified'
};
```

**n8n Workflow:**
```
[Webhook] → [Conditions basées sur fileType]
  ├─ Si fileType = 'audio' → Traiter audio
  ├─ Si fileType = 'text'  → Traiter texte
  └─ Si fileType = 'photo' → Traiter photo
```

---

### Exemple 2: Webhooks Séparés par Type

Si vous avez des **workflows n8n différents** pour chaque type:

**Fichier: `js/config/webhooks-config.js`**
```javascript
const WEBHOOKS_CONFIG = {
    audio: 'https://n8n.votre-domaine.com/webhook/audio-transcribe',
    text:  'https://n8n.votre-domaine.com/webhook/text-extract',
    photo: 'https://n8n.votre-domaine.com/webhook/photo-ocr'
};
```

**n8n Workflows:**
- `/webhook/audio-transcribe` → Whisper API + Claude (audio)
- `/webhook/text-extract` → Claude avec prompt texte
- `/webhook/photo-ocr` → Google Vision + Claude (photo)

**Avantage:** Chaque workflow optimisé pour son type de données

---

### Exemple 3: Production avec Domaine Personnalisé

```javascript
const WEBHOOKS_CONFIG = {
    // Domaine de production
    audio: 'https://api.mon-application-medicale.com/webhooks/audio',
    text:  'https://api.mon-application-medicale.com/webhooks/text',
    photo: 'https://api.mon-application-medicale.com/webhooks/photo'
};
```

---

## 📤 Payloads Envoyés Selon le Mode

### Mode NORMAL - Envoie Audios (SÉPARÉMENT)

**Type détecté:** `audio`
**Webhook utilisé:** `WEBHOOKS_CONFIG.audio`

**⚠️ IMPORTANT v2.2.1**: Chaque audio est envoyé **INDIVIDUELLEMENT** au webhook (pas tous ensemble)

**Flux d'exécution (exemple 3 sections = 3 requêtes HTTP):**
```
1. Utilisateur enregistre dans 3 sections (partie1, partie2, partie3)
   ↓
2. Clique "Envoyer"
   ↓
3. Système envoie PREMIÈRE requête HTTP:
   - audioIndex: 1
   - totalAudios: 3
   - Webhook utilisé: WEBHOOKS_CONFIG.audio
   - Contient: partie1 audio
   ↓
4. Système envoie DEUXIÈME requête HTTP:
   - audioIndex: 2
   - totalAudios: 3
   - Webhook utilisé: WEBHOOKS_CONFIG.audio
   - Contient: partie2 audio
   ↓
5. Système envoie TROISIÈME requête HTTP:
   - audioIndex: 3
   - totalAudios: 3
   - Webhook utilisé: WEBHOOKS_CONFIG.audio
   - Contient: partie3 audio
```

**Payload pour CHAQUE audio (exemple partie1):**
```json
{
    "uid": "user123abc",
    "email": "student@med.fr",
    "displayName": "Dr. Martin",
    "mode": "normal",
    "fileType": "audio",
    "inputType": "audio",
    "timestamp": "2025-01-15T10:30:00Z",
    "patientInfo": {
        "numeroDossier": "D123456",
        "nomPatient": "Jean Dupont"
    },
    "audioIndex": 1,
    "totalAudios": 3,
    "recording": {
        "sectionId": "partie1",
        "sectionIndex": 1,
        "inputType": "audio",
        "duration": 45,
        "size": 36720,
        "format": "mp4",
        "timestamp": "2025-01-15T10:30:00Z",
        "audioData": "base64_encoded_audio..."
    },
    "metadata": {
        "totalRecordings": 3,
        "browserInfo": {...}
    }
}
```

---

### Mode TEST - Envoie Audio

Identique au mode NORMAL mais avec `"mode": "test"`

---

### Mode DMI - Envoie Texte

**Type détecté:** `text`
**Webhook utilisé:** `WEBHOOKS_CONFIG.text`

**Payload:**
```json
{
    "uid": "user123abc",
    "email": "student@med.fr",
    "displayName": "Dr. Martin",
    "mode": "dmi",
    "fileType": "text",
    "inputType": "text",
    "timestamp": "2025-01-15T10:30:00Z",
    "numeroDossier": "D123456",
    "nomPatient": "Jean Dupont",
    "texte": "Anamnèse du patient... texte libre saisi...",
    "userEmail": "student@med.fr"
}
```

---

### Mode DMI - Envoie Photos

**Type détecté:** `photo`
**Webhook utilisé:** `WEBHOOKS_CONFIG.photo`

**Payload (1 par photo):**
```json
{
    "uid": "user123abc",
    "email": "student@med.fr",
    "displayName": "Dr. Martin",
    "mode": "dmi",
    "fileType": "photo",
    "inputType": "photo",
    "timestamp": "2025-01-15T10:30:00Z",
    "numeroDossier": "D123456",
    "nomPatient": "Jean Dupont",
    "photoIndex": 1,
    "totalPhotos": 3,
    "photo": {
        "data": "iVBORw0KGgoAAAANSUhEUgAA...",
        "index": 0,
        "timestamp": "2025-01-15T10:30:00Z"
    }
}
```

---

## 🔄 Flux d'Exécution Complet

### Scénario: Utilisateur en Mode DMI avec Texte ET Photos

```
1. Utilisateur ouvre Mode DMI
   ↓
2. Entre texte libre: "Anamnèse du patient..."
   ↓
3. Ajoute 3 photos
   ↓
4. Clique "Envoyer les données DMI"
   ↓
5. Système prépare le payload
   ↓
6. PREMIÈRE REQUÊTE:
   - fileType = 'text'
   - Webhook utilisé: WEBHOOKS_CONFIG.text
   - Envoie texte au webhook TEXT
   - Attend réponse...
   ↓
7. DEUXIÈME REQUÊTE:
   - fileType = 'photo'
   - Webhook utilisé: WEBHOOKS_CONFIG.photo
   - Envoie PHOTO 1/3 au webhook PHOTO
   - Attend réponse...
   ↓
8. TROISIÈME REQUÊTE:
   - fileType = 'photo'
   - Envoie PHOTO 2/3 au webhook PHOTO
   - Attend réponse...
   ↓
9. QUATRIÈME REQUÊTE:
   - fileType = 'photo'
   - Envoie PHOTO 3/3 au webhook PHOTO
   - Attend réponse...
   ↓
10. Toutes les requêtes réussies
    ↓
11. Affiche "Données envoyées avec succès"
    ↓
12. Propose réinitialiser le formulaire
```

---

## 🧪 Tester les Webhooks Localement

### Avec curl

```bash
# Tester webhook AUDIO
curl -X POST https://n8n.votre-domaine.com/webhook/audio \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test123",
    "email": "test@med.fr",
    "fileType": "audio",
    "inputType": "audio",
    "recordings": [{"sectionId": "partie1"}]
  }'

# Tester webhook TEXT
curl -X POST https://n8n.votre-domaine.com/webhook/text \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test123",
    "email": "test@med.fr",
    "fileType": "text",
    "inputType": "text",
    "texte": "Texte de test"
  }'

# Tester webhook PHOTO
curl -X POST https://n8n.votre-domaine.com/webhook/photo \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test123",
    "email": "test@med.fr",
    "fileType": "photo",
    "inputType": "photo",
    "photo": {"data": "base64_image..."}
  }'
```

### Avec Postman

1. Créer 3 collections: Audio, Text, Photo
2. Pour chaque:
   - Method: POST
   - URL: Votre webhook
   - Body (JSON): Voir payloads ci-dessus
   - Send

---

## 📊 Configuration n8n pour Chaque Type

### Workflow AUDIO (traite 1 audio à la fois)

**⚠️ IMPORTANT v2.2.1**: Le webhook reçoit **UN SEUL audio** à la fois (pas un array)

Structure du payload reçu:
```
{
  uid: "user123",
  email: "student@med.fr",
  audioIndex: 1,        ← Index de l'audio (1-based)
  totalAudios: 3,       ← Nombre total d'audios envoyés
  recording: {
    sectionId: "partie1",
    audioData: "base64...",
    duration: 45,
    ...
  },
  patientInfo: {...}
}
```

**Flux n8n:**
```
[Webhook Trigger]
    ↓
[Filter: fileType = 'audio']
    ↓
[Extract from payload: recording.audioData]
    ↓
[Whisper API] → Transcription (audio-to-text)
    ↓
[Claude API] → Extraction structurée
    ↓
[Google Sheets] → Append résultats (1 ligne par audio)
    ↓
[Response] {success: true, audioIndex: 1, totalAudios: 3}
```

**Avantages de ce système:**
- ✅ Traite 1 audio à la fois (plus rapide que tous à la fois)
- ✅ Redémarrage automatique si Whisper échoue
- ✅ Meilleur tracking avec audioIndex/totalAudios
- ✅ Cohérent avec le système de photos en DMI

### Workflow TEXT

```
[Webhook Trigger]
    ↓
[Filter: fileType = 'text']
    ↓
[Claude API] → Traitement texte
    ↓
[Google Sheets] → Append résultats
    ↓
[Response] 200 OK
```

### Workflow PHOTO

```
[Webhook Trigger]
    ↓
[Filter: fileType = 'photo']
    ↓
[Google Vision] → OCR
    ↓
[Claude API] → Analyse
    ↓
[Google Sheets] → Append résultats
    ↓
[Response] 200 OK
```

---

## ⚡ Performance Tips

1. **Paralléliser les photos**:
   - Envoyer les 3 photos en parallèle (pas en boucle)
   - Utiliser Promise.all() dans n8n

2. **Compression d'audio**:
   - Limiter à 5MB par enregistrement
   - Réduire la fréquence d'échantillonnage si nécessaire

3. **Timeout approprié**:
   - Audio: 60-120s (Whisper peut être lent)
   - Texte: 30-45s
   - Photo: 30-45s

---

**Version**: 5.1.0
**Dernière mise à jour**: 2025-01-15
