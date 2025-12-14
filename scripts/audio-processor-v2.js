#!/usr/bin/env node

/**
 * DictaMed - Audio Processor v2.0
 * Processeur audio pour conversion et compression avant envoi
 *
 * Utilisation (Frontend):
 * const processor = new AudioProcessor();
 * const compressed = await processor.compressAudio(audioBlob);
 * const base64 = await processor.blobToBase64(compressed);
 */

class AudioProcessor {
  constructor(options = {}) {
    this.maxSizeBytes = options.maxSizeBytes || 5 * 1024 * 1024; // 5MB
    this.targetBitrate = options.targetBitrate || 128; // kbps
    this.sampleRate = options.sampleRate || 16000; // Hz
  }

  /**
   * Convertir Blob audio → Base64
   * Peut être utilisé directement pour petits fichiers
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // data:audio/webm;base64,XXXXX → XXXXX
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convertir Base64 → Blob
   */
  base64ToBlob(base64, mimeType = 'audio/webm') {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  /**
   * Compression Blob audio (réduction de taille)
   * Utilise Web Audio API pour réduire le bitrate
   */
  async compressAudio(audioBlob) {
    try {
      // Convertir blob → ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Décoder
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioData = await audioContext.decodeAudioData(arrayBuffer);

      // Analyser taille actuelle
      const originalSize = audioBlob.size;
      console.log(`📦 Taille originale: ${this.formatSize(originalSize)}`);

      // Si déjà petit, ne pas recompresser
      if (originalSize < this.maxSizeBytes * 0.8) {
        console.log("✅ Audio déjà optimisé, pas de compression");
        return audioBlob;
      }

      // Réduire la fréquence d'échantillonnage (16kHz suffisant pour Whisper)
      const resampled = this.resampleAudio(audioData, this.sampleRate);

      // Réencode
      const wavBlob = this.audioBufferToWav(resampled, this.sampleRate);
      const compressedSize = wavBlob.size;

      console.log(`📦 Taille compressée: ${this.formatSize(compressedSize)}`);
      console.log(`📊 Réduction: ${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`);

      return wavBlob;
    } catch (error) {
      console.error("❌ Erreur compression audio:", error);
      return audioBlob; // Fallback original
    }
  }

  /**
   * Rééchantillonner audio à une fréquence plus basse
   */
  resampleAudio(audioBuffer, targetSampleRate) {
    const offlineContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      audioBuffer.numberOfChannels,
      audioBuffer.length * targetSampleRate / audioBuffer.sampleRate,
      targetSampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    return offlineContext.startRendering();
  }

  /**
   * Convertir AudioBuffer → WAV Blob
   */
  audioBufferToWav(audioBuffer, sampleRate) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleLength = audioBuffer.length;
    const format = 1; // PCM
    const bitDepth = 16;

    // Créer WAV header
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const wavLength = 44 + sampleLength * blockAlign;
    const arrayBuffer = new ArrayBuffer(wavLength);
    const view = new DataView(arrayBuffer);

    // RIFF header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + sampleLength * blockAlign, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    writeString(36, 'data');
    view.setUint32(40, sampleLength * blockAlign, true);

    // Écrire les données audio
    let offset = 44;
    const volume = 0.8;
    for (let i = 0; i < sampleLength; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        let sample = audioBuffer.getChannelData(channel)[i] * volume;
        sample = Math.max(-1, Math.min(1, sample)); // Clamp

        // Convertir float [-1, 1] → int16
        const s = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, s, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Valider taille audio avant upload
   */
  validateSize(audioBlob) {
    const sizeInMB = (audioBlob.size / 1024 / 1024).toFixed(2);

    if (audioBlob.size > 25 * 1024 * 1024) {
      return {
        valid: false,
        error: `❌ Audio trop gros: ${sizeInMB}MB (max 25MB)`
      };
    }

    if (audioBlob.size > this.maxSizeBytes) {
      return {
        valid: false,
        error: `❌ Audio dépasse limite recommandée: ${sizeInMB}MB (max ${this.maxSizeBytes / 1024 / 1024}MB)`
      };
    }

    return {
      valid: true,
      size: sizeInMB,
      message: `✅ Audio valide: ${sizeInMB}MB`
    };
  }

  /**
   * Utility: Formater taille en bytes
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Traitement complet: Valider → Compresser → Base64
   */
  async processAudio(audioBlob) {
    console.log("\n📥 Début traitement audio...");

    // 1. Valider
    const validation = this.validateSize(audioBlob);
    console.log(validation.message);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 2. Compresser
    const compressed = await this.compressAudio(audioBlob);

    // 3. Convertir en base64
    const base64 = await this.blobToBase64(compressed);

    console.log(`✅ Audio traité: ${this.formatSize(compressed.size)} base64`);
    return base64;
  }
}

// Export Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioProcessor };
}

// Export Browser (Global)
if (typeof window !== 'undefined') {
  window.AudioProcessor = AudioProcessor;
}

/**
 * EXEMPLE D'UTILISATION FRONTEND
 */
/*
// Dans un composant Vue/React
const processor = new AudioProcessor({
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  sampleRate: 16000
});

// Après enregistrement audio (mediaRecorder.ondataavailable)
const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

try {
  const base64 = await processor.processAudio(audioBlob);

  // Envoyer payload
  const payload = {
    uid: user.uid,
    email: user.email,
    inputType: "audio",
    data: {
      audioData: base64,
      duration: 45,
      format: "webm"
    }
  };

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

} catch (error) {
  console.error("Erreur audio:", error);
  showErrorNotification(error.message);
}
*/
