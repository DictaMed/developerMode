# DictaMed v2.0 - Guide d'Implémentation
## Intégration des Nouveaux Composants

---

## 📋 Fichiers Modifiés et Créés

### Fichiers Modifiés
```
✅ js/core/config.js
   - Ajouté INPUT_TYPES
   - Ajouté AUDIO_CONFIG, TEXT_CONFIG, PHOTO_CONFIG

✅ js/components/data-sender.js
   - Ajouté méthodes v2.0 (determineInputType, validateInputData, processAudioData, etc.)
   - Ajouté sendRecordingData() pour nouveau workflow
   - Adapté sendToEndpoint() pour supporter v2.0
```

### Fichiers Créés
```
✅ js/components/multi-input-handler.js
   - Wrapper unifié pour 3 types d'entrée
   - Interface simple: handleAudio(), handleText(), handlePhoto()

✅ js/components/text-input-handler.js
   - Composant texte avec UI complète
   - Validation en temps réel
   - Compteur de caractères

✅ js/components/photo-input-handler.js
   - Composant photo avec drag & drop
   - Aperçu image
   - Validation format/taille

✅ scripts/validate-payload-v2.js
   - Validation complète des payloads

✅ scripts/audio-processor-v2.js
   - Compression audio
   - Conversion base64
```

---

## 🔌 Intégration dans le HTML

### 1. Charger les Scripts

```html
<!-- Core -->
<script src="js/core/config.js"></script>
<script src="js/components/data-sender.js"></script>

<!-- v2.0 Components -->
<script src="js/components/multi-input-handler.js"></script>
<script src="js/components/text-input-handler.js"></script>
<script src="js/components/photo-input-handler.js"></script>

<!-- Scripts helper -->
<script src="scripts/validate-payload-v2.js"></script>
<script src="scripts/audio-processor-v2.js"></script>
```

### 2. Initialiser dans le HTML

```html
<!-- Indicateur de mode (important pour déterminer le mode actuel) -->
<div data-current-mode="normal"></div>

<!-- Conteneur pour texte -->
<div id="textInputContainer"></div>

<!-- Conteneur pour photo -->
<div id="photoInputContainer"></div>

<!-- Notifications -->
<div id="notificationContainer"></div>
```

---

## 🚀 Initialisation JavaScript

```javascript
// Après chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // 1. Initialiser DataSender (classique)
    const dataSender = new DataSender(appState, audioRecorderManager);

    // 2. Initialiser MultiInputHandler
    const multiInputHandler = new MultiInputHandler(dataSender);

    // 3. Initialiser TextInputHandler
    const textInputHandler = new TextInputHandler(multiInputHandler);
    textInputHandler.init('#textInputContainer');

    // 4. Initialiser PhotoInputHandler
    const photoInputHandler = new PhotoInputHandler(multiInputHandler);
    photoInputHandler.init('#photoInputContainer');

    // Rendre disponibles globalement
    window.dataSender = dataSender;
    window.multiInputHandler = multiInputHandler;
    window.textInputHandler = textInputHandler;
    window.photoInputHandler = photoInputHandler;

    console.log('✅ v2.0 Components initialisés');
});
```

---

## 💬 Utilisation dans les Modes

### Mode Normal - Support Audio (Classique)

```javascript
// Code existant: envoyer audio classique
await dataSender.send('normal');
// Fonctionne toujours comme avant!
```

### Mode Texte - Support Nouveau

```html
<!-- Ajouter dans le mode texte -->
<div id="textInputContainer"></div>
```

```javascript
// Automatique: TextInputHandler gère tout
// Utilisateur remplit le formulaire et clique "Envoyer"
// Le handler appelle automatiquement multiInputHandler.handleText()
```

### Mode Photo - Support Nouveau

```html
<!-- Ajouter dans le mode photo -->
<div id="photoInputContainer"></div>
```

```javascript
// Automatique: PhotoInputHandler gère tout
// Utilisateur upload une photo
// Le handler appelle automatiquement multiInputHandler.handlePhoto()
```

### Utilisation Programmée (Avancé)

```javascript
// Audio programmé
await multiInputHandler.handleAudio(audioBlob, duration, 'normal');

// Texte programmé
await multiInputHandler.handleText('Patient ayant des symptômes...', 'normal');

// Photo programmée
await multiInputHandler.handlePhoto(photoBlob, 'image/jpeg', 'Description', 'normal');
```

---

## 📊 Architecture de Flux de Données

### Cas 1: Audio (Classique + v2.0 Supporté)

```
AudioRecorder → audioBlob + duration
    ↓
[Click "Envoyer"]
    ↓
dataSender.send('normal')  OU  multiInputHandler.handleAudio(blob, dur, 'normal')
    ↓
DataSender.sendRecordingData() [NEW v2.0]
    ↓
determineInputType() → 'audio'
processAudioData() → base64
buildPayload() → payload v2.0
    ↓
sendToEndpoint() → webhook n8n
    ↓
n8n: Whisper → Agent → Google Sheets
```

### Cas 2: Texte (Nouveau v2.0)

```
TextInputHandler UI (textarea)
    ↓
[Click "Envoyer"]
    ↓
handleSendText()
    ↓
multiInputHandler.handleText()
    ↓
DataSender.sendRecordingData()
    ↓
determineInputType() → 'text'
processTextData() → validation + trim
buildPayload() → payload v2.0
    ↓
sendToEndpoint() → webhook n8n
    ↓
n8n: (Skip Whisper) → Agent → Google Sheets
```

### Cas 3: Photo (Nouveau v2.0)

```
PhotoInputHandler UI (drag & drop)
    ↓
[Click "Envoyer Photo"]
    ↓
handleSendPhoto()
    ↓
multiInputHandler.handlePhoto()
    ↓
DataSender.sendRecordingData()
    ↓
determineInputType() → 'photo'
processPhotoData() → validation + base64
buildPayload() → payload v2.0
    ↓
sendToEndpoint() → webhook n8n
    ↓
n8n: Vision → Agent → Google Sheets
```

---

## 🎨 Styles CSS Recommandés

Ajouter aux styles CSS globaux:

```css
/* Text Input */
.text-input-section {
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 15px 0;
}

.text-input-area {
    border: 2px solid #dee2e6;
    border-radius: 4px;
    resize: vertical;
}

.text-input-area.is-invalid {
    border-color: #dc3545;
    background-color: #fff5f5;
}

.text-input-area:focus {
    border-color: #0d6efd;
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
}

/* Photo Input */
.photo-input-section {
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 15px 0;
}

.photo-upload-area {
    border: 3px dashed #dee2e6;
    border-radius: 8px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    background: #fff;
}

.photo-upload-area:hover {
    border-color: #0d6efd;
    background: #f0f6ff;
}

.photo-upload-area.drag-over {
    border-color: #0d6efd;
    background: #e7f0ff;
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
}

.upload-icon {
    font-size: 48px;
    margin-bottom: 10px;
}

.upload-text {
    color: #666;
    margin: 10px 0;
}

.photo-preview {
    margin: 20px 0;
    position: relative;
}

.photo-preview.d-none {
    display: none !important;
}

.preview-image {
    max-width: 100%;
    max-height: 300px;
    border-radius: 4px;
    border: 1px solid #dee2e6;
}

.photo-description-area {
    border: 1px solid #dee2e6;
    border-radius: 4px;
}

/* Buttons */
.button-group {
    margin: 15px 0;
    display: flex;
    gap: 10px;
}

.button-group .btn {
    flex: 1;
    padding: 10px 20px;
}

/* Status Messages */
.alert {
    margin-top: 15px;
    border-radius: 4px;
}

.alert.d-none {
    display: none !important;
}
```

---

## 🧪 Tests d'Intégration

### Test 1: Texte

```javascript
// Console browser
const text = "Patient se plaint de douleurs thoraciques depuis 3 jours";
await multiInputHandler.handleText(text, 'normal');
// Devrait envoyer et afficher succès
```

### Test 2: Photo

```javascript
// À partir du sélecteur de fichier
const fileInput = document.querySelector('#photoInput');
const file = fileInput.files[0];
await multiInputHandler.handlePhoto(file, file.type, 'Radiographie', 'normal');
// Devrait envoyer et afficher succès
```

### Test 3: Audio (Rétrocompatibilité)

```javascript
// Classique: toujours fonctionne
await dataSender.send('normal');
// ET aussi avec v2.0 si on utilise audioBlob:
const audioBlob = new Blob([...], { type: 'audio/webm' });
await multiInputHandler.handleAudio(audioBlob, 45, 'normal');
```

---

## 📝 Adapter les Modes Existants

### Mode Normal

```javascript
// normal-mode.js

document.addEventListener('DOMContentLoaded', function() {
    // ... code existant ...

    // Ajouter support texte (optionnel)
    const textInputHandler = window.textInputHandler;
    if (textInputHandler) {
        textInputHandler.init('#textInputContainer');
    }

    // Ajouter support photo (optionnel)
    const photoInputHandler = window.photoInputHandler;
    if (photoInputHandler) {
        photoInputHandler.init('#photoInputContainer');
    }
});
```

### Mode Test

```javascript
// test-mode.js

document.addEventListener('DOMContentLoaded', function() {
    // ... code existant ...

    // Même code que Mode Normal
    const textInputHandler = window.textInputHandler;
    if (textInputHandler) {
        textInputHandler.init('#textInputContainer');
    }

    const photoInputHandler = window.photoInputHandler;
    if (photoInputHandler) {
        photoInputHandler.init('#photoInputContainer');
    }
});
```

---

## 🔍 Débogage

### Activer les logs détaillés

```javascript
// Dans la console
window.DataSender.prototype.logger.level = 'debug';
window.MultiInputHandler.prototype.logger.level = 'debug';
```

### Inspecter les payloads

```javascript
// Ajouter à data-sender.js avant sendToEndpoint
console.log('Payload v2.0:', JSON.stringify(payload, null, 2));
```

### Vérifier les types détectés

```javascript
const recorder = { audioBlob: new Blob() };
const type = window.dataSender.determineInputType(recorder);
console.log('Type détecté:', type); // Devrait être 'audio'
```

---

## ✅ Checklist d'Implémentation

- [ ] config.js mis à jour
- [ ] data-sender.js refactorisé
- [ ] multi-input-handler.js créé
- [ ] text-input-handler.js créé
- [ ] photo-input-handler.js créé
- [ ] Scripts charger dans HTML
- [ ] Initialisation JS en place
- [ ] Conteneurs HTML ajoutés
- [ ] Styles CSS appliqués
- [ ] Modes adapté (normal, test)
- [ ] Tests manuels passés (audio, texte, photo)
- [ ] Logs console sans erreurs

---

## 🚨 Problèmes Courants

### "multiInputHandler est undefined"
```
→ Vérifier que les scripts sont chargés dans le bon ordre
→ Vérifier l'initialisation dans DOMContentLoaded
```

### "Type détecté: unknown"
```
→ Vérifier que recordingData a les bonnes propriétés
→ Audio: audioBlob ou audioData + duration
→ Texte: text
→ Photo: photoBlob ou photoData + mimeType
```

### "Envoyer est désactivé"
```
Texte: → Vérifier que texte.length >= 5
Photo: → Vérifier qu'une image est sélectionnée
```

### "Erreur: User not authenticated"
```
→ Vérifier que FirebaseAuthManager est initialisé
→ Vérifier que l'utilisateur est connecté
→ Vérifier window.FirebaseAuthManager?.getCurrentUser?.()
```

---

**Version:** 2.2.0
**Date:** 2025-01-15
**Statut:** ✅ Prêt pour déploiement
