# DictaMed - Modifications Frontend v2.0
## Guide pour supporter Audio | Texte | Photos

---

## 📋 Vue d'Ensemble

Cette guide explique comment modifier le frontend pour supporter les 3 types d'entrées (audio, texte, photos) et envoyer les payloads formatés pour le nouveau workflow n8n v2.

### Fichiers à Modifier
```
js/components/data-sender.js          ← Refactor principal
js/core/config.js                     ← Ajouter INPUT_TYPES
scripts/audio-processor-v2.js         ← Déjà créé
scripts/validate-payload-v2.js        ← Déjà créé
[Composants mode]                     ← Adapter UI pour inputs
```

---

## 🔧 Modifications data-sender.js

### 1. Importer les Helpers

```javascript
/**
 * js/components/data-sender.js - REFACTORISÉ V2.0
 */

// Importer les scripts d'aide
import { validatePayload, printValidationResult } from '../scripts/validate-payload-v2.js';
import { AudioProcessor } from '../scripts/audio-processor-v2.js';
import { APP_CONFIG } from '../core/config.js';

// Initialiser
const audioProcessor = new AudioProcessor({
  maxSizeBytes: 5 * 1024 * 1024,
  sampleRate: 16000
});
```

### 2. Helper - Déterminer Type d'Entrée

```javascript
/**
 * Déterminer le type d'entrée basé sur les données disponibles
 */
function determineInputType(recordingData) {
  if (recordingData.audioData) {
    return 'audio';
  } else if (recordingData.text) {
    return 'text';
  } else if (recordingData.photoData) {
    return 'photo';
  }
  return 'unknown';
}

/**
 * Valider les données selon le type
 */
function validateInputData(inputType, data) {
  const result = { valid: true, errors: [] };

  if (inputType === 'audio') {
    if (!data.audioData) result.errors.push('Audio data manquant');
    if (!data.duration) result.errors.push('Durée audio manquante');
    if (!data.format) result.errors.push('Format audio manquant');
  } else if (inputType === 'text') {
    if (!data.text) result.errors.push('Texte manquant');
    if (data.text && data.text.length < 5) result.errors.push('Texte trop court');
  } else if (inputType === 'photo') {
    if (!data.photoData) result.errors.push('Photo data manquante');
    if (!data.mimeType) result.errors.push('MIME type manquant');
  }

  result.valid = result.errors.length === 0;
  return result;
}
```

### 3. Classe DataSender Refactorisée

```javascript
class DataSender {
  constructor(user, config = {}) {
    this.user = user;
    this.webhookEndpoints = config.webhookEndpoints || APP_CONFIG.WEBHOOK_ENDPOINTS;
    this.timeout = config.timeout || 30000;
    this.retryCount = config.retryCount || 3;
    this.retryDelay = config.retryDelay || 2000;
  }

  /**
   * Construire le payload complet
   */
  buildPayload(recordingData, mode = 'normal') {
    const inputType = determineInputType(recordingData);

    // Valider les données d'entrée
    const validation = validateInputData(inputType, recordingData);
    if (!validation.valid) {
      throw new Error(`Données invalides (${inputType}): ${validation.errors.join(', ')}`);
    }

    // Construire le payload principal
    const payload = {
      // ===== INFOS UTILISATEUR =====
      uid: this.user.uid,
      email: this.user.email,
      displayName: this.user.displayName || 'Anonymous',

      // ===== CONTEXTE =====
      mode: mode,
      timestamp: new Date().toISOString(),

      // ===== INFOS PATIENT =====
      patientInfo: this.getPatientInfo(),

      // ===== TYPE D'ENTRÉE (NOUVEAU) =====
      inputType: inputType,

      // ===== DONNÉES SELON TYPE (NOUVEAU) =====
      data: this.formatDataByType(inputType, recordingData),

      // ===== MÉTADONNÉES =====
      metadata: {
        appVersion: '2.0.0',
        clientType: this.getClientType(),
        userAgent: navigator.userAgent
      }
    };

    return payload;
  }

  /**
   * Formater les données selon le type d'entrée
   */
  formatDataByType(inputType, recordingData) {
    if (inputType === 'audio') {
      return {
        audioData: recordingData.audioData,
        duration: recordingData.duration,
        format: recordingData.format || 'webm'
      };
    } else if (inputType === 'text') {
      return {
        text: recordingData.text,
        format: recordingData.format || 'text/plain'
      };
    } else if (inputType === 'photo') {
      return {
        photoData: recordingData.photoData,
        mimeType: recordingData.mimeType,
        description: recordingData.description || ''
      };
    }
    return {};
  }

  /**
   * Récupérer les infos patient du DOM ou du state
   */
  getPatientInfo() {
    // À adapter selon votre système
    const patientForm = document.querySelector('form[data-patient-info]');
    if (patientForm) {
      return {
        numeroDossier: patientForm.querySelector('[name="numeroDossier"]')?.value || '',
        nomPatient: patientForm.querySelector('[name="nomPatient"]')?.value || ''
      };
    }
    return {
      numeroDossier: '',
      nomPatient: ''
    };
  }

  /**
   * Déterminer le type de client
   */
  getClientType() {
    if (/mobile|android|iphone/i.test(navigator.userAgent)) return 'mobile';
    if (/tablet|ipad/i.test(navigator.userAgent)) return 'tablet';
    return 'desktop';
  }

  /**
   * Traitement AUDIO: Compression et base64
   */
  async processAudioData(audioBlob, duration) {
    console.log("🎵 Traitement audio...");

    try {
      // Valider taille
      const validation = audioProcessor.validateSize(audioBlob);
      console.log(validation.message);
      if (!validation.valid) throw new Error(validation.error);

      // Compresser si nécessaire
      const processed = await audioProcessor.processAudio(audioBlob);

      return {
        audioData: processed,
        duration: duration,
        format: 'webm',
        size: this.formatSize(audioBlob.size)
      };
    } catch (error) {
      console.error("❌ Erreur audio:", error);
      throw error;
    }
  }

  /**
   * Traitement TEXTE: Nettoyage basique
   */
  processTextData(text) {
    console.log("📝 Traitement texte...");

    if (!text || text.trim().length === 0) {
      throw new Error("Texte vide");
    }

    return {
      text: text.trim(),
      format: 'text/plain',
      length: text.length
    };
  }

  /**
   * Traitement PHOTO: Validation et base64
   */
  async processPhotoData(photoBlob, mimeType, description = '') {
    console.log("📷 Traitement photo...");

    try {
      // Valider format
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(mimeType)) {
        throw new Error(`Format invalide: ${mimeType}`);
      }

      // Valider taille
      const sizeInMB = (photoBlob.size / 1024 / 1024).toFixed(2);
      if (photoBlob.size > 20 * 1024 * 1024) {
        throw new Error(`Image trop grosse: ${sizeInMB}MB (max 20MB)`);
      }

      // Convertir en base64
      const base64 = await this.blobToBase64(photoBlob);

      return {
        photoData: base64,
        mimeType: mimeType,
        description: description.trim(),
        size: sizeInMB
      };
    } catch (error) {
      console.error("❌ Erreur photo:", error);
      throw error;
    }
  }

  /**
   * Convertir Blob → Base64
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Valider le payload complet
   */
  validatePayload(payload) {
    const result = validatePayload(payload);

    if (!result.valid) {
      console.error("❌ Payload invalide:");
      result.errors.forEach(e => console.error(e));
      throw new Error("Payload invalide: " + result.errors.join(', '));
    }

    if (result.warnings.length > 0) {
      console.warn("⚠️ Avertissements:");
      result.warnings.forEach(w => console.warn(w));
    }

    return true;
  }

  /**
   * Envoyer le payload (avec retry)
   */
  async makeApiCall(payload, retryAttempt = 1) {
    const endpoint = this.getWebhookEndpoint(payload.mode);

    console.log(`\n📤 Envoi vers: ${endpoint}`);
    console.log(`📦 Type: ${payload.inputType}`);
    console.log(`📊 Tentative: ${retryAttempt}/${this.retryCount}`);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': '2.0.0',
          'X-Input-Type': payload.inputType
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Succès:", data);
      return data;

    } catch (error) {
      console.error(`❌ Erreur (tentative ${retryAttempt}):`, error.message);

      // Retry si applicable
      if (retryAttempt < this.retryCount && error.name !== 'TypeError') {
        console.log(`⏳ Retry dans ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.makeApiCall(payload, retryAttempt + 1);
      }

      throw error;
    }
  }

  /**
   * Récupérer l'endpoint webhook selon le mode
   */
  getWebhookEndpoint(mode) {
    const endpoints = this.webhookEndpoints || APP_CONFIG.WEBHOOK_ENDPOINTS;
    if (!endpoints) {
      throw new Error("Webhooks non configurés dans config.js");
    }

    const endpoint = endpoints[mode] || endpoints.normal;
    if (!endpoint) {
      throw new Error(`Endpoint webhook manquant pour mode: ${mode}`);
    }

    return endpoint;
  }

  /**
   * Utilitaire: Formater taille en bytes
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export default DataSender;
```

### 4. Fonction Principale - Envoyer Données

```javascript
/**
 * Fonction principale appelée depuis les composants UI
 * Accepte n'importe quel type d'entrée
 */
async function sendDataToWebhook(user, recordingData, mode = 'normal') {
  const sender = new DataSender(user);

  try {
    // 1. Traiter les données selon le type
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
        recordingData.mimeType,
        recordingData.description
      );
    } else {
      throw new Error('Type d\'entrée non supporté ou données manquantes');
    }

    // 2. Construire le payload
    const payload = sender.buildPayload(processedData, mode);

    // 3. Valider le payload
    sender.validatePayload(payload);

    // 4. Afficher validation détaillée (en debug)
    if (process.env.DEBUG) {
      printValidationResult(payload, validatePayload(payload));
    }

    // 5. Envoyer
    const result = await sender.makeApiCall(payload);

    // 6. Notifier l'utilisateur
    showSuccessNotification(
      `✅ ${inputType.toUpperCase()} envoyé avec succès!`,
      `Données enregistrées pour ${recordingData.patientName || 'le patient'}`
    );

    return result;

  } catch (error) {
    console.error("❌ Erreur globale:", error);
    showErrorNotification(
      `❌ Erreur lors de l'envoi (${recordingData.type || 'unknown'})`,
      error.message
    );
    throw error;
  }
}

export { sendDataToWebhook, DataSender, determineInputType };
```

---

## 🎵 Intégration avec Recording Audio

### Modifier le Composant d'Enregistrement Audio

```javascript
/**
 * Exemple: js/components/audio-recorder.vue (ou React)
 */

export default {
  data() {
    return {
      recording: false,
      audioChunks: [],
      mediaRecorder: null,
      startTime: null,
      duration: 0
    };
  },

  methods: {
    async startRecording() {
      this.audioChunks = [];
      this.startTime = Date.now();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      this.recording = true;
    },

    stopRecording() {
      return new Promise((resolve) => {
        this.mediaRecorder.onstop = () => {
          const duration = Math.round((Date.now() - this.startTime) / 1000);
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

          const recordingData = {
            audioBlob: audioBlob,
            audioData: null, // Sera rempli lors du send
            duration: duration,
            format: 'webm'
          };

          this.recording = false;
          resolve(recordingData);
        };

        this.mediaRecorder.stop();
      });
    },

    async sendAudio() {
      try {
        const recordingData = await this.stopRecording();

        // Intégrer le processus audio complet
        const sender = new DataSender(this.user);
        const processed = await sender.processAudioData(
          recordingData.audioBlob,
          recordingData.duration
        );

        // Envoyer
        await sendDataToWebhook(this.user, processed, this.currentMode);

        this.showSuccess("Audio envoyé!");
      } catch (error) {
        this.showError(error.message);
      }
    }
  }
};
```

---

## 📝 Intégration avec Texte

### Formulaire Texte

```javascript
/**
 * Exemple: Composant Texte
 */

methods: {
  async sendText() {
    const textInput = this.$refs.textInput.value;

    try {
      // Le payload est simple pour le texte
      const recordingData = {
        text: textInput,
        format: 'text/plain'
      };

      await sendDataToWebhook(this.user, recordingData, this.currentMode);
      this.clearForm();

    } catch (error) {
      this.showError(error.message);
    }
  }
}
```

---

## 📷 Intégration avec Photos

### Uploader Photo

```javascript
/**
 * Exemple: Composant Photo Upload
 */

methods: {
  async handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const recordingData = {
        photoBlob: file,
        photoData: null, // Sera rempli lors du send
        mimeType: file.type,
        description: this.photoDescription || ''
      };

      // Le processor va convertir en base64
      const sender = new DataSender(this.user);
      const processed = await sender.processPhotoData(
        recordingData.photoBlob,
        recordingData.mimeType,
        recordingData.description
      );

      await sendDataToWebhook(this.user, processed, this.currentMode);

    } catch (error) {
      this.showError(error.message);
    }
  }
}
```

---

## 📋 Mettre à Jour config.js

### Ajouter Configuration Input Types

```javascript
// js/core/config.js - AJOUTER

const APP_CONFIG = {
  // ... configs existantes ...

  // ===== NOUVEAU: Input Types =====
  INPUT_TYPES: {
    AUDIO: 'audio',
    TEXT: 'text',
    PHOTO: 'photo'
  },

  // ===== AUDIO CONFIG =====
  AUDIO_CONFIG: {
    maxDuration: 300,        // 5 minutes
    maxSizeBytes: 25 * 1024 * 1024,
    mimeType: 'audio/webm;codecs=opus',
    compression: {
      enabled: true,
      targetSizeBytes: 5 * 1024 * 1024,
      sampleRate: 16000
    }
  },

  // ===== TEXT CONFIG =====
  TEXT_CONFIG: {
    minLength: 5,
    maxLength: 50000,
    allowedFormats: ['text/plain']
  },

  // ===== PHOTO CONFIG =====
  PHOTO_CONFIG: {
    maxSizeBytes: 20 * 1024 * 1024,
    maxCount: 5,
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
    compression: {
      enabled: true,
      targetSizeBytes: 5 * 1024 * 1024
    }
  },

  // ===== WEBHOOKS (DÉJÀ EXISTANT, INCHANGÉ) =====
  WEBHOOK_ENDPOINTS: {
    normal: 'https://n8n.example.com/webhook/DictaMed',
    test: 'https://n8n.example.com/webhook/DictaMed-Test',
    dmi: 'https://n8n.example.com/webhook/DictaMed'
  }
};
```

---

## 🧪 Tester les Modifications

### Test 1: Audio Complet

```javascript
// Test dans console du navigateur
const user = { uid: 'test', email: 'test@example.com' };
const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });

const recordingData = {
  audioBlob: audioBlob,
  duration: 30,
  format: 'webm'
};

await sendDataToWebhook(user, recordingData, 'test')
  .then(() => console.log("✅ Audio test OK"))
  .catch(e => console.error("❌", e));
```

### Test 2: Texte Simple

```javascript
const recordingData = {
  text: "Patient de 45 ans avec douleurs thoraciques"
};

await sendDataToWebhook(user, recordingData, 'test')
  .then(() => console.log("✅ Texte test OK"))
  .catch(e => console.error("❌", e));
```

### Test 3: Photo

```javascript
const photoBlob = new Blob(['image data'], { type: 'image/jpeg' });

const recordingData = {
  photoBlob: photoBlob,
  mimeType: 'image/jpeg',
  description: 'Radiographie thoracique'
};

await sendDataToWebhook(user, recordingData, 'test')
  .then(() => console.log("✅ Photo test OK"))
  .catch(e => console.error("❌", e));
```

---

## 📊 Checklist Modifications Frontend

- [ ] data-sender.js refactorisé (classe DataSender)
- [ ] validate-payload-v2.js importé et utilisé
- [ ] audio-processor-v2.js importé et intégré
- [ ] Fonction determineInputType() implémentée
- [ ] Composant audio adapté pour envoyer recordingData.audioBlob
- [ ] Composant texte crée/adapté
- [ ] Composant photo créé/adapté
- [ ] config.js mis à jour avec INPUT_TYPES et configs
- [ ] Notifications utilisateur mises en place
- [ ] Tests manuels passés (audio, texte, photo)
- [ ] Console sans erreurs
- [ ] Validation payload affichée en debug

---

## 🔗 Ressources

- [N8N_CONDITIONAL_WORKFLOW_V2.md](N8N_CONDITIONAL_WORKFLOW_V2.md) - Architecture n8n
- [scripts/validate-payload-v2.js](../scripts/validate-payload-v2.js) - Validation
- [scripts/audio-processor-v2.js](../scripts/audio-processor-v2.js) - Traitement audio
- [PROCHAINES_ETAPES.md](PROCHAINES_ETAPES.md) - Déploiement

---

**Version:** 2.0
**Dernière mise à jour:** 2025-01-15
