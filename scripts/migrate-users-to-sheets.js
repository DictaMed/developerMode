#!/usr/bin/env node

/**
 * DictaMed - Script de Migration Utilisateurs Firestore vers Google Sheets
 * Version: 1.0.0
 *
 * Utilisation:
 *   node scripts/migrate-users-to-sheets.js
 *
 * Ce script exporte les utilisateurs de Firestore vers un Google Sheet "DictaMed_Users"
 * Chaque utilisateur obtient une ligne avec: uid, email, displayName, prompt (vide), excel_file_id (vide), is_active
 */

const admin = require('firebase-admin');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Logging utilities
const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}=== ${msg} ===${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  process: (msg) => console.log(`${colors.bright}🔧 ${msg}${colors.reset}`),
  step: (num, msg) => console.log(`\n${colors.bright}${num}️⃣  ${msg}${colors.reset}`),
  skip: (msg) => console.log(`${colors.dim}⏭️  ${msg}${colors.reset}`)
};

/**
 * Initialiser Firebase Admin
 */
function initializeFirebase() {
  try {
    const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');

    if (!fs.existsSync(keyPath)) {
      log.error('Fichier serviceAccountKey.json non trouvé!');
      process.exit(1);
    }

    const serviceAccount = require(keyPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });

    log.success(`Firebase initialisé pour le projet: ${serviceAccount.project_id}`);
    return admin.firestore();

  } catch (error) {
    log.error(`Erreur initialisation Firebase: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Obtenir les credentials Google Sheets
 */
async function getGoogleAuth() {
  try {
    // Utiliser le même serviceAccountKey.json pour Google Sheets API
    const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    const credentials = require(keyPath);

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    return auth;
  } catch (error) {
    log.error(`Erreur authentification Google Sheets: ${error.message}`);
    throw error;
  }
}

/**
 * Créer ou obtenir le Google Sheet "DictaMed_Users"
 */
async function getOrCreateSheet(sheets, spreadsheetId) {
  try {
    // Vérifier si le sheet existe
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    log.success(`Google Sheet trouvé: ${response.data.properties.title}`);
    return spreadsheetId;

  } catch (error) {
    if (error.code === 404) {
      log.error('Google Sheet "DictaMed_Users" non trouvé.');
      log.info('Créez le sheet manuellement dans Google Drive et obtenez son ID.');
      log.info('ID du sheet: Dans l\'URL: https://docs.google.com/spreadsheets/d/SHEET_ID/edit');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Récupérer tous les utilisateurs de Firestore
 */
async function getUsersFromFirestore(db) {
  try {
    log.step('1', 'Récupération des utilisateurs Firestore');

    // Essayer de lire depuis userProfiles d'abord
    const userProfilesSnapshot = await db.collection('userProfiles').get();
    const usersSnapshot = await db.collection('users').get();

    const users = [];

    // Ajouter les utilisateurs de userProfiles
    userProfilesSnapshot.forEach(doc => {
      const data = doc.data();
      users.push({
        uid: data.uid || doc.id,
        email: data.email || '',
        displayName: data.displayName || '',
        profession: data.profession || ''
      });
    });

    // Ajouter les utilisateurs de users (si non dupliqués)
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const exists = users.find(u => u.uid === data.uid || u.uid === doc.id);
      if (!exists) {
        users.push({
          uid: data.uid || doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          profession: data.profession || ''
        });
      }
    });

    log.success(`${users.length} utilisateur(s) trouvé(s) dans Firestore`);
    return users;

  } catch (error) {
    log.error(`Erreur récupération utilisateurs: ${error.message}`);
    throw error;
  }
}

/**
 * Ajouter les utilisateurs au Google Sheet
 */
async function addUsersToSheet(sheets, spreadsheetId, users) {
  try {
    log.step('2', 'Ajout des utilisateurs au Google Sheet');

    if (users.length === 0) {
      log.warning('Aucun utilisateur à ajouter');
      return;
    }

    // Préparer les données
    const values = [
      ['uid', 'email', 'displayName', 'prompt', 'excel_file_id', 'is_active']
    ];

    users.forEach(user => {
      values.push([
        user.uid,
        user.email,
        user.displayName,
        '', // prompt (vide à remplir manuellement)
        '', // excel_file_id (vide à remplir manuellement)
        'TRUE' // is_active
      ]);
    });

    // Ajouter les données au sheet
    const request = {
      spreadsheetId: spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: {
        values: values
      }
    };

    const response = await sheets.spreadsheets.values.update(request);

    log.success(`${response.data.updates.updatedRows} ligne(s) ajoutée(s)`);
    log.info(`${response.data.updates.updatedCells} cellule(s) modifiée(s)`);

    return response;

  } catch (error) {
    log.error(`Erreur ajout utilisateurs: ${error.message}`);
    throw error;
  }
}

/**
 * Afficher le résumé
 */
function printSummary(userCount) {
  console.log(`
${colors.green}${colors.bright}
╔════════════════════════════════════════════╗
║                                            ║
║  🎉 Migration Réussie!                    ║
║                                            ║
║  ✅ ${String(userCount).padEnd(2)} utilisateurs migrés       ║
║  ✅ Google Sheet mis à jour                 ║
║  ✅ Prêt pour configuration                 ║
║                                            ║
╚════════════════════════════════════════════╝
${colors.reset}

${colors.bright}Prochaines étapes:${colors.reset}
  1. Ouvrir le Google Sheet "DictaMed_Users"
  2. Pour chaque utilisateur:
     - Remplir la colonne "prompt" avec le prompt personnalisé
     - Remplir la colonne "excel_file_id" avec l'ID du fichier résultats
  3. Créer les Google Sheets résultats pour chaque utilisateur
  4. Configurer le workflow n8n

${colors.bright}Structure Google Sheet:${colors.reset}
  uid              → Identifiant Firebase (ne pas modifier)
  email            → Email Firebase (ne pas modifier)
  displayName      → Nom de l'utilisateur (ne pas modifier)
  prompt           → À REMPLIR: Prompt personnalisé pour ce utilisateur
  excel_file_id    → À REMPLIR: ID du Google Sheet résultats
  is_active        → Utilisateur actif (TRUE/FALSE)

${colors.bright}Support:${colors.reset}
  📖 Documentation: docs/ARCHITECTURE_SIMPLIFIEE.md
  📞 Contact: akio963@gmail.com
`);
}

/**
 * Main - Fonction principale
 */
async function main() {
  try {
    log.header('DictaMed - Migration Firestore vers Google Sheets');
    log.info(`Version: 1.0.0`);
    log.info(`Timestamp: ${new Date().toLocaleString('fr-FR')}`);

    // Demander l'ID du Google Sheet à l'utilisateur
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    console.log(`\n${colors.bright}Configuration requise:${colors.reset}`);
    console.log(`1. Créez un Google Sheet nommé "DictaMed_Users"`);
    console.log(`2. Partagez-le avec le compte Google utilisé dans Firebase`);
    console.log(`3. Copiez l'ID du sheet depuis l'URL: https://docs.google.com/spreadsheets/d/SHEET_ID/edit\n`);

    const spreadsheetId = await question('Entrez l\'ID du Google Sheet "DictaMed_Users": ');

    if (!spreadsheetId) {
      log.error('ID du sheet requis');
      process.exit(1);
    }

    rl.close();

    // Initialiser Firebase
    const db = initializeFirebase();

    // Obtenir les credentials Google
    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Vérifier que le sheet existe
    await getOrCreateSheet(sheets, spreadsheetId);

    // Récupérer les utilisateurs de Firestore
    const users = await getUsersFromFirestore(db);

    // Ajouter les utilisateurs au Google Sheet
    await addUsersToSheet(sheets, spreadsheetId, users);

    // Afficher le résumé
    printSummary(users.length);

    log.success('Script complété avec succès!');
    process.exit(0);

  } catch (error) {
    log.error(`Erreur critique: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le script
main();
