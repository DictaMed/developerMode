#!/usr/bin/env node

/**
 * DictaMed - Validation Payload v2.0
 * Valide les payloads avant d'être envoyés au webhook n8n
 *
 * Utilisation:
 * const { validatePayload } = require('./validate-payload-v2.js');
 * const result = validatePayload(payload);
 * if (!result.valid) console.error(result.errors);
 */

// ===== VALIDATION SCHÉMA =====

const INPUT_TYPES = {
  AUDIO: 'audio',
  TEXT: 'text',
  PHOTO: 'photo'
};

const AUDIO_FORMATS = ['webm', 'mp3', 'wav', 'm4a', 'ogg'];
const IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Valider structure complète du payload
 */
function validatePayload(payload) {
  const errors = [];
  const warnings = [];

  // ===== CHAMPS OBLIGATOIRES GLOBAUX =====
  if (!payload.uid) errors.push("❌ uid manquant");
  if (!payload.email) errors.push("❌ email manquant");
  if (!payload.displayName) errors.push("❌ displayName manquant");
  if (!payload.timestamp) errors.push("❌ timestamp manquant");
  if (!payload.inputType) errors.push("❌ inputType manquant");
  if (!payload.patientInfo) errors.push("❌ patientInfo manquant");
  if (!payload.data) errors.push("❌ data manquant");

  // ===== VALIDATION EMAIL =====
  if (payload.email && !isValidEmail(payload.email)) {
    errors.push(`❌ Email invalide: ${payload.email}`);
  }

  // ===== VALIDATION TIMESTAMP =====
  if (payload.timestamp && !isValidISO8601(payload.timestamp)) {
    errors.push(`❌ Timestamp invalide: ${payload.timestamp}`);
  }

  // ===== VALIDATION INPUTTYPE =====
  if (payload.inputType && !Object.values(INPUT_TYPES).includes(payload.inputType)) {
    errors.push(`❌ inputType invalide: '${payload.inputType}'. Doit être: audio|text|photo`);
  }

  // ===== VALIDATION PATIENTINFO =====
  if (payload.patientInfo) {
    if (typeof payload.patientInfo !== 'object') {
      errors.push("❌ patientInfo doit être un objet");
    } else {
      if (!payload.patientInfo.numeroDossier) {
        warnings.push("⚠️ patientInfo.numeroDossier manquant");
      }
      if (!payload.patientInfo.nomPatient) {
        warnings.push("⚠️ patientInfo.nomPatient manquant");
      }
    }
  }

  // ===== VALIDATION PAR TYPE D'ENTRÉE =====
  if (payload.inputType === INPUT_TYPES.AUDIO) {
    validateAudioInput(payload.data, errors, warnings);
  } else if (payload.inputType === INPUT_TYPES.TEXT) {
    validateTextInput(payload.data, errors, warnings);
  } else if (payload.inputType === INPUT_TYPES.PHOTO) {
    validatePhotoInput(payload.data, errors, warnings);
  }

  // ===== VALIDATION MODE =====
  if (payload.mode) {
    const validModes = ['normal', 'test', 'dmi', 'home'];
    if (!validModes.includes(payload.mode)) {
      warnings.push(`⚠️ Mode inconnu: '${payload.mode}'`);
    }
  } else {
    warnings.push("⚠️ mode manquant (defaulting to 'normal')");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    summary: `${errors.length} erreur(s), ${warnings.length} avertissement(s)`
  };
}

// ===== VALIDATION AUDIO =====
function validateAudioInput(data, errors, warnings) {
  if (!data.audioData) {
    errors.push("❌ audioData manquant (input audio)");
  } else {
    // Vérifier que c'est du base64
    if (!isValidBase64(data.audioData)) {
      errors.push("❌ audioData n'est pas du base64 valide");
    } else {
      const sizeInBytes = Buffer.byteLength(data.audioData, 'base64');
      const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);

      if (sizeInBytes > 25 * 1024 * 1024) {
        errors.push(`❌ Audio trop gros: ${sizeInMB}MB (max 25MB)`);
      } else if (sizeInBytes > 5 * 1024 * 1024) {
        warnings.push(`⚠️ Audio volumineux: ${sizeInMB}MB (recommandé: <5MB)`);
      }
    }
  }

  if (!data.duration) {
    errors.push("❌ duration manquant (input audio)");
  } else if (typeof data.duration !== 'number') {
    errors.push(`❌ duration doit être un nombre (reçu: ${typeof data.duration})`);
  } else if (data.duration > 300) {
    errors.push(`❌ Audio trop long: ${data.duration}s (max 300s = 5min)`);
  } else if (data.duration < 2) {
    warnings.push("⚠️ Audio très court: moins de 2 secondes");
  }

  if (!data.format) {
    warnings.push("⚠️ format audio manquant");
  } else if (!AUDIO_FORMATS.includes(data.format.toLowerCase())) {
    errors.push(`❌ Format audio invalide: '${data.format}'. Formats acceptés: ${AUDIO_FORMATS.join(', ')}`);
  }
}

// ===== VALIDATION TEXTE =====
function validateTextInput(data, errors, warnings) {
  if (!data.text) {
    errors.push("❌ text manquant (input texte)");
  } else if (typeof data.text !== 'string') {
    errors.push(`❌ text doit être une string (reçu: ${typeof data.text})`);
  } else {
    if (data.text.length < 5) {
      warnings.push(`⚠️ Texte très court: ${data.text.length} caractères`);
    } else if (data.text.length > 50000) {
      errors.push(`❌ Texte trop long: ${data.text.length} caractères (max 50000)`);
    }
  }

  if (data.format && data.format !== 'text/plain') {
    warnings.push(`⚠️ Format texte non-standard: '${data.format}'`);
  }
}

// ===== VALIDATION PHOTO =====
function validatePhotoInput(data, errors, warnings) {
  if (!data.photoData) {
    errors.push("❌ photoData manquant (input photo)");
  } else {
    if (!isValidBase64(data.photoData)) {
      errors.push("❌ photoData n'est pas du base64 valide");
    } else {
      const sizeInBytes = Buffer.byteLength(data.photoData, 'base64');
      const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);

      if (sizeInBytes > 20 * 1024 * 1024) {
        errors.push(`❌ Image trop grosse: ${sizeInMB}MB (max 20MB)`);
      } else if (sizeInBytes > 5 * 1024 * 1024) {
        warnings.push(`⚠️ Image volumineux: ${sizeInMB}MB (recommandé: <5MB)`);
      }
    }
  }

  if (!data.mimeType) {
    errors.push("❌ mimeType manquant (input photo)");
  } else if (!IMAGE_MIMETYPES.includes(data.mimeType)) {
    errors.push(`❌ MIME type invalide: '${data.mimeType}'. Types acceptés: ${IMAGE_MIMETYPES.join(', ')}`);
  }

  if (!data.description) {
    warnings.push("⚠️ description manquante (input photo)");
  } else if (data.description.length < 5) {
    warnings.push("⚠️ Description trop courte");
  }
}

// ===== HELPERS VALIDATION =====

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isValidISO8601(timestamp) {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && timestamp === date.toISOString();
}

function isValidBase64(str) {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch (e) {
    return false;
  }
}

// ===== AFFICHAGE FORMATÉ =====

function printValidationResult(payload, result) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 VALIDATION PAYLOAD');
  console.log('='.repeat(60));

  console.log('\n📦 Type d\'entrée: ' + (payload.inputType || 'N/A'));
  console.log('👤 Utilisateur: ' + (payload.displayName || 'N/A') + ' (' + (payload.email || 'N/A') + ')');

  if (result.valid) {
    console.log('\n✅ VALIDE - Le payload peut être envoyé');
  } else {
    console.log('\n❌ INVALIDE - Le payload contient des erreurs');
  }

  if (result.errors.length > 0) {
    console.log('\n🔴 ERREURS:');
    result.errors.forEach(e => console.log('  ' + e));
  }

  if (result.warnings.length > 0) {
    console.log('\n🟡 AVERTISSEMENTS:');
    result.warnings.forEach(w => console.log('  ' + w));
  }

  console.log('\n📊 Résumé: ' + result.summary);
  console.log('='.repeat(60) + '\n');

  return result.valid;
}

// ===== EXPORT =====
module.exports = {
  validatePayload,
  printValidationResult,
  INPUT_TYPES,
  AUDIO_FORMATS,
  IMAGE_MIMETYPES
};

// ===== CLI USAGE =====
if (require.main === module) {
  // Exemple d'utilisation en CLI
  const examplePayload = {
    uid: "abc123xyz",
    email: "student@med.fr",
    displayName: "Dr. Martin",
    mode: "normal",
    timestamp: new Date().toISOString(),
    patientInfo: {
      numeroDossier: "D123456",
      nomPatient: "Jean Dupont"
    },
    inputType: "text",
    data: {
      text: "Patient se plaint de douleurs thoraciques",
      format: "text/plain"
    },
    metadata: {}
  };

  const result = validatePayload(examplePayload);
  printValidationResult(examplePayload, result);
}
