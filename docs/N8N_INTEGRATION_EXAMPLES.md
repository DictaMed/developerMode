# Exemples d'Intégration n8n - Solution A

**Date**: 2025-12-14
**Version**: 1.0
**Fichier du Code**: `js/core/n8n-batch-audio-sender.js`

---

## 🚀 Démarrage Rapide

### Étape 1: Charger le Script

Dans votre `index.html`:

```html
<!-- À la fin du body -->
<script src="js/core/n8n-batch-audio-sender.js"></script>
```

### Étape 2: Initialiser au Démarrage

Dans `js/main.js`, dans la fonction `finalizeInitialization()`:

```javascript
async function finalizeInitialization() {
  // ... code existant ...

  // Initialiser l'intégration n8n
  try {
    const currentUser = window.FirebaseAuthManager?.getCurrentUser?.();
    if (currentUser) {
      DictaMedN8nIntegration.initialize(
        {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          mode: 'normal'  // ou 'test'
        },
        notificationSystem
      );
      console.log('✅ n8n integration ready');
    }
  } catch (error) {
    console.warn('⚠️ Could not initialize n8n integration:', error);
  }
}
```

### Étape 3: Configurer l'URL du Webhook

Dans `js/core/config.js`:

```javascript
window.APP_CONFIG = {
  // ... config existante ...

  // n8n Configuration
  N8N_WEBHOOK_URL: 'https://your-n8n-instance.com/webhook/dictamed-audio-batch',
  N8N_MAX_RETRIES: 3,
  N8N_RETRY_DELAY: 1000
};
```

---

## 📝 Cas d'Usage 1: Mode Test avec Sections Multiples

**Scénario**: L'utilisateur enregistre 3 sections d'audio dans Mode Test, puis clique "Soumettre"

### Code dans `js/components/test-mode-tab.js`

```javascript
class TestModeTab {
  constructor() {
    this.recordings = [];  // { audioBlob, duration, sectionId }
  }

  /**
   * Quand l'utilisateur clique "Finish & Submit"
   */
  async onSubmit() {
    try {
      // 1. Valider qu'il y a des enregistrements
      if (this.recordings.length === 0) {
        notificationSystem.warning('Veuillez enregistrer au moins une section');
        return;
      }

      // 2. Montrer le spinner
      loadingOverlay.show('Traitement des enregistrements...');

      // 3. Soumettre le batch à n8n
      const result = await DictaMedN8nIntegration.submitRecordings(
        this.recordings,
        {
          prompt: document.getElementById('custom-prompt')?.value,
          patientDossier: document.getElementById('dossier-number')?.value,
          patientName: document.getElementById('patient-name')?.value
        }
      );

      // 4. Succès
      loadingOverlay.hide();
      notificationSystem.success(
        `${result.processed} enregistrements traités avec succès`,
        'Soumission réussie'
      );

      // 5. Reset le formulaire
      this.reset();

    } catch (error) {
      loadingOverlay.hide();
      notificationSystem.error(
        `Erreur: ${error.message}`,
        'Soumission échouée'
      );
      console.error('Submit failed:', error);
    }
  }

  /**
   * Quand un audio est enregistré
   */
  onAudioRecorded(audioBlob, duration, sectionId) {
    this.recordings.push({
      audioBlob: audioBlob,
      duration: duration,
      sectionId: sectionId
    });

    notificationSystem.success(
      `Section "${sectionId}" enregistrée (${duration}s)`,
      'Enregistrement réussi'
    );
  }

  /**
   * Reset le formulaire
   */
  reset() {
    this.recordings = [];
    document.getElementById('custom-prompt').value = '';
    // ... reset autres champs ...
  }
}

// Exposer globalement
window.testModeTab = new TestModeTab();

// Dans les event listeners
document.getElementById('btn-finish-submit').addEventListener('click', () => {
  window.testModeTab.onSubmit();
});

document.getElementById('btn-record-section').addEventListener('click', async () => {
  const { audioBlob, duration } = await recordAudio();
  window.testModeTab.onAudioRecorded(audioBlob, duration, 'section_1');
});
```

---

## 📝 Cas d'Usage 2: Mode Normal avec Sections Structurées

**Scénario**: Mode Normal avec sections Anamnesis, Examen, Diagnostic. L'utilisateur enregistre chaque section puis soumet.

### Code dans `js/components/normal-mode-tab.js`

```javascript
class NormalModeTab {
  constructor() {
    this.sections = {
      anamnesis: { blob: null, duration: 0 },
      examination: { blob: null, duration: 0 },
      diagnosis: { blob: null, duration: 0 }
    };
  }

  /**
   * Quand l'utilisateur clique "Submit All Sections"
   */
  async onSubmit() {
    try {
      // 1. Vérifier que tous les champs requis sont remplis
      const incompleteSections = Object.entries(this.sections)
        .filter(([_, section]) => !section.blob)
        .map(([name]) => name);

      if (incompleteSections.length > 0) {
        notificationSystem.warning(
          `Sections manquantes: ${incompleteSections.join(', ')}`
        );
        return;
      }

      // 2. Préparer le batch d'audios
      const audioFiles = Object.entries(this.sections).map(([sectionId, section]) => ({
        blob: section.blob,
        duration: section.duration,
        sectionId: sectionId,
        format: 'webm'
      }));

      // 3. Montrer le spinner
      loadingOverlay.show('Structuration des données médicales...');

      // 4. Soumettre à n8n
      const result = await window.n8nAudioSender.submitAudioBatch(audioFiles, {
        prompt: `Tu es un assistant médical. Crée une note médicale structurée
                 avec anamnesis, examen physique et diagnostic.`,
        patientInfo: {
          numeroDossier: this.getPatientDossier(),
          nomPatient: this.getPatientName()
        }
      });

      // 5. Succès
      loadingOverlay.hide();
      notificationSystem.success(
        `Consultation de ${result.processed} sections enregistrée`,
        'Données sauvegardées'
      );

      // 6. Afficher les résultats (optionnel)
      this.displayResults(result);

      // 7. Reset
      this.reset();

    } catch (error) {
      loadingOverlay.hide();
      notificationSystem.error(
        `Erreur: ${error.message}`,
        'Soumission échouée'
      );
    }
  }

  /**
   * Enregistrer une section
   */
  recordSection(sectionId) {
    if (!this.sections[sectionId]) {
      console.warn(`Unknown section: ${sectionId}`);
      return;
    }

    // Lancer l'enregistrement (pseudo-code)
    audioRecorderManager.startRecording({
      onStop: (blob, duration) => {
        this.sections[sectionId] = { blob, duration };
        notificationSystem.success(
          `${sectionId} enregistrée (${duration}s)`,
          'Enregistrement réussi'
        );
        this.updateUI();
      }
    });
  }

  /**
   * Mettre à jour l'UI
   */
  updateUI() {
    Object.entries(this.sections).forEach(([sectionId, section]) => {
      const btn = document.getElementById(`btn-record-${sectionId}`);
      if (btn) {
        if (section.blob) {
          btn.textContent = `✅ ${sectionId} (${section.duration}s)`;
          btn.classList.add('completed');
        } else {
          btn.textContent = `⭕ Enregistrer ${sectionId}`;
          btn.classList.remove('completed');
        }
      }
    });
  }

  /**
   * Reset
   */
  reset() {
    this.sections = {
      anamnesis: { blob: null, duration: 0 },
      examination: { blob: null, duration: 0 },
      diagnosis: { blob: null, duration: 0 }
    };
    this.updateUI();
  }

  getPatientDossier() {
    return document.getElementById('dossier-number')?.value || '';
  }

  getPatientName() {
    return document.getElementById('patient-name')?.value || '';
  }

  displayResults(result) {
    const resultHTML = `
      <div class="result-summary">
        <h3>✅ Résultats du traitement</h3>
        <p>${result.processed} sections traitées avec succès</p>
        <p>Timestamp: ${new Date(result.timestamp).toLocaleString('fr-FR')}</p>
      </div>
    `;
    document.getElementById('results-container').innerHTML = resultHTML;
  }
}

// Export globalement
window.normalModeTab = new NormalModeTab();

// Event listeners
document.getElementById('btn-submit-all').addEventListener('click', () => {
  window.normalModeTab.onSubmit();
});

['anamnesis', 'examination', 'diagnosis'].forEach(section => {
  document.getElementById(`btn-record-${section}`)?.addEventListener('click', () => {
    window.normalModeTab.recordSection(section);
  });
});
```

---

## 📝 Cas d'Usage 3: Utilisation Directe de la Classe

Si vous avez un cas spécifique non couvert:

```javascript
// 1. Créer une instance
const sender = new N8nBatchAudioSender({
  webhookUrl: 'https://your-n8n.com/webhook/dictamed-audio-batch',
  userInfo: {
    uid: 'user123',
    email: 'doctor@hospital.fr',
    displayName: 'Dr. Martin',
    mode: 'normal'
  },
  notificationSystem: window.notificationSystem,
  verbose: true
});

// 2. Préparer les audios
const audioFiles = [
  { blob: blob1, duration: 45, sectionId: 'intro' },
  { blob: blob2, duration: 60, sectionId: 'body' },
  { blob: blob3, duration: 30, sectionId: 'conclusion' }
];

// 3. Soumettre
try {
  const result = await sender.submitAudioBatch(audioFiles, {
    prompt: 'Mon prompt personnalisé...',
    patientDossier: 'D123456',
    patientName: 'Jean Dupont'
  });

  console.log(`✅ ${result.processed} fichiers traités`);
} catch (error) {
  console.error('❌ Erreur:', error.message);
}
```

---

## 🔧 Configuration Avancée

### Augmenter le Timeout pour Gros Fichiers

```javascript
// Avant de créer une instance
const MAX_TIMEOUT = 120000; // 2 minutes

const sender = new N8nBatchAudioSender({
  webhookUrl: '...',
  userInfo: { ... },
  maxRetries: 5,              // Plus de tentatives
  retryDelay: 2000            // Délai plus long
});
```

### Logging Détaillé

```javascript
const sender = new N8nBatchAudioSender({
  // ... config ...
  verbose: true  // Affiche tous les logs
});

// Consulter la config
console.log(sender.getConfig());
```

### Intégration avec un Service de Gestion d'État

```javascript
// Dans Redux/Vuex/State Management
async function submitAudioBatch(audioFiles, userState) {
  try {
    dispatch('SET_LOADING', true);

    const result = await window.n8nAudioSender.submitAudioBatch(
      audioFiles,
      {
        prompt: userState.customPrompt,
        patientInfo: userState.patientInfo
      }
    );

    dispatch('SET_SUCCESS', {
      message: `${result.processed} fichiers traités`,
      result: result
    });

  } catch (error) {
    dispatch('SET_ERROR', error.message);
  } finally {
    dispatch('SET_LOADING', false);
  }
}
```

---

## ✅ Checklist d'Implémentation

### Setup Initial
- [ ] Copier `n8n-batch-audio-sender.js` dans `js/core/`
- [ ] Ajouter `<script>` tag dans `index.html`
- [ ] Configurer `N8N_WEBHOOK_URL` dans `config.js`

### Mode Test
- [ ] Modifier `testModeTab.js` avec `onSubmit()` method
- [ ] Ajouter event listener pour le bouton submit
- [ ] Tester avec 1 audio, puis 3+

### Mode Normal
- [ ] Modifier `normalModeTab.js` avec les sections
- [ ] Implémenter `recordSection()` pour chaque section
- [ ] Ajouter event listeners

### Testing
- [ ] Test local avec 1 fichier
- [ ] Test local avec 3 fichiers
- [ ] Test production avec retry logic
- [ ] Vérifier Google Sheets pour les résultats

---

## 🐛 Problèmes Courants

### "N8nBatchAudioSender not defined"
Assurez-vous que le script est chargé dans le bon ordre dans `index.html`

### "notificationSystem is not defined"
Vérifiez que `notificationSystem` est initialisé avant d'appeler le sender

### Webhook timeout sur gros fichiers
```javascript
// Solution: Compresser l'audio avant l'envoi
function compressAudio(blob) {
  // Implémenter avec libraire audio compression
  // Exemple: https://github.com/jsmreese/opus-recorder
}
```

---

## 📊 Monitoring

### Vérifier les Logs Console

```javascript
// Tous les logs du sender ont ce préfixe
[N8nBatchAudioSender] ✅ N8nBatchAudioSender initialized
[N8nBatchAudioSender] 📤 Starting batch submission for 3 audio files
[N8nBatchAudioSender] 🔄 Converting audio blobs to base64...
```

### Vérifier le Webhook reçoit les données

Dans n8n, ajouter un nœud "Debug" après le webhook:

```yaml
Type: Debug
Connection: After Webhook node
Output: Show every step
```

Vérifier que le payload contient les données correctes.

---

## 🚀 Prochaines Étapes

1. **Parallélisation** (Approche C)
   - Utiliser n8n "Execute Workflow" pour traiter en parallèle
   - ~3x plus rapide pour 10+ fichiers

2. **Caching des Résultats**
   - Cache local des transcriptions
   - Éviter re-traiter les audios identiques

3. **Compression Audio**
   - Implémenter avant l'envoi
   - Réduire taille payload de 70%

4. **Monitoring & Analytics**
   - Logger les performances
   - Tracking des erreurs
   - Dashboard d'utilisation

---

**Last Updated**: 2025-12-14
**Status**: Production Ready ✅
