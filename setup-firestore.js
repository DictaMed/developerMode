#!/usr/bin/env node

/**
 * DictaMed - Script de Configuration Firestore
 * Version: 1.0.0
 *
 * Utilisation:
 *   node setup-firestore.js
 *
 * Ce script crée automatiquement toutes les collections Firestore
 * et ajoute des documents de test.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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
    // Chercher serviceAccountKey.json
    const keyPath = path.join(__dirname, 'serviceAccountKey.json');

    if (!fs.existsSync(keyPath)) {
      log.error('Fichier serviceAccountKey.json non trouvé!');
      log.info('Téléchargez-le depuis: Firebase Console → Project Settings → Service Accounts → Generate');
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
 * Créer la collection userProfiles
 */
async function setupUserProfiles(db) {
  log.step('1', 'Configuration userProfiles');

  try {
    const ref = db.collection('userProfiles');
    const snapshot = await ref.limit(1).get();

    if (!snapshot.empty) {
      log.skip('Collection userProfiles existe déjà');
      return;
    }

    // Document 1: Admin de test
    await ref.doc('admin123').set({
      uid: 'admin123',
      email: 'akio963@gmail.com',
      displayName: 'Admin User',
      profession: 'administrateur',
      createdAt: admin.firestore.Timestamp.now(),
      lastUpdated: admin.firestore.Timestamp.now(),
      emailVerified: true
    });
    log.info('✓ Ajouté: Admin User');

    // Document 2: Médecin de test
    await ref.doc('medecin123').set({
      uid: 'medecin123',
      email: 'medecin@example.com',
      displayName: 'Dr. Jean Dupont',
      profession: 'medecin',
      createdAt: admin.firestore.Timestamp.now(),
      lastUpdated: admin.firestore.Timestamp.now(),
      emailVerified: true
    });
    log.info('✓ Ajouté: Dr. Jean Dupont');

    // Document 3: Infirmier de test
    await ref.doc('infirmier123').set({
      uid: 'infirmier123',
      email: 'infirmier@example.com',
      displayName: 'Marie Dupont',
      profession: 'infirmier',
      createdAt: admin.firestore.Timestamp.now(),
      lastUpdated: admin.firestore.Timestamp.now(),
      emailVerified: true
    });
    log.info('✓ Ajouté: Marie Dupont');

    log.success('Collection userProfiles créée avec 3 documents');

  } catch (error) {
    log.error(`Erreur userProfiles: ${error.message}`);
    throw error;
  }
}

/**
 * Créer la collection userWebhooks
 */
async function setupUserWebhooks(db) {
  log.step('2', 'Configuration userWebhooks');

  try {
    const ref = db.collection('userWebhooks');
    const snapshot = await ref.limit(1).get();

    if (!snapshot.empty) {
      log.skip('Collection userWebhooks existe déjà');
      return;
    }

    // Webhook 1: Médecin
    await ref.doc('medecin123').set({
      userId: 'medecin123',
      webhookUrl: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
      isActive: true,
      notes: 'Webhook pour Dr. Jean Dupont',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      updatedBy: 'akio963@gmail.com',
      lastUsed: null,
      testStatus: 'pending'
    });
    log.info('✓ Webhook assigné à: Dr. Jean Dupont');

    // Webhook 2: Infirmier
    await ref.doc('infirmier123').set({
      userId: 'infirmier123',
      webhookUrl: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
      isActive: true,
      notes: 'Webhook pour Marie Dupont',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      updatedBy: 'akio963@gmail.com',
      lastUsed: null,
      testStatus: 'pending'
    });
    log.info('✓ Webhook assigné à: Marie Dupont');

    log.success('Collection userWebhooks créée avec 2 webhooks');

  } catch (error) {
    log.error(`Erreur userWebhooks: ${error.message}`);
    throw error;
  }
}

/**
 * Créer la collection userSessions
 */
async function setupUserSessions(db) {
  log.step('3', 'Configuration userSessions');

  try {
    const ref = db.collection('userSessions');
    const snapshot = await ref.limit(1).get();

    if (!snapshot.empty) {
      log.skip('Collection userSessions existe déjà');
      return;
    }

    await ref.doc('session001').set({
      userId: 'medecin123',
      participants: ['medecin123', 'admin123'],
      createdAt: admin.firestore.Timestamp.now(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 30 * 60 * 1000)
      )
    });
    log.info('✓ Session de test créée');

    log.success('Collection userSessions créée');

  } catch (error) {
    log.error(`Erreur userSessions: ${error.message}`);
    throw error;
  }
}

/**
 * Créer la collection auditLogs
 */
async function setupAuditLogs(db) {
  log.step('4', 'Configuration auditLogs');

  try {
    const ref = db.collection('auditLogs');
    const snapshot = await ref.limit(1).get();

    if (!snapshot.empty) {
      log.skip('Collection auditLogs existe déjà');
      return;
    }

    await ref.doc('log001').set({
      action: 'system_initialization',
      userId: 'medecin123',
      admin: 'akio963@gmail.com',
      timestamp: admin.firestore.Timestamp.now(),
      details: {
        message: 'Initialisation automatique par script Node.js',
        collections: 'all',
        version: '4.0.0'
      }
    });
    log.info('✓ Log d\'audit créé');

    log.success('Collection auditLogs créée');

  } catch (error) {
    log.error(`Erreur auditLogs: ${error.message}`);
    throw error;
  }
}

/**
 * Créer la collection webhookLogs
 */
async function setupWebhookLogs(db) {
  log.step('5', 'Configuration webhookLogs');

  try {
    const ref = db.collection('webhookLogs');
    const snapshot = await ref.limit(1).get();

    if (!snapshot.empty) {
      log.skip('Collection webhookLogs existe déjà');
      return;
    }

    await ref.doc('wlog001').set({
      userId: 'medecin123',
      webhookUrl: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
      method: 'POST',
      statusCode: 200,
      responseTime: 125,
      success: true,
      errorMessage: null,
      timestamp: admin.firestore.Timestamp.now()
    });
    log.info('✓ Log webhook créé');

    log.success('Collection webhookLogs créée');

  } catch (error) {
    log.error(`Erreur webhookLogs: ${error.message}`);
    throw error;
  }
}

/**
 * Créer la collection system
 */
async function setupSystem(db) {
  log.step('6', 'Configuration system');

  try {
    const ref = db.collection('system');
    const snapshot = await ref.limit(1).get();

    if (!snapshot.empty) {
      log.skip('Collection system existe déjà');
      return;
    }

    await ref.doc('config').set({
      maxWebhookRetries: 3,
      webhookTimeout: 5000,
      sessionTimeout: 1800000,
      maintenanceMode: false,
      version: '4.0.0',
      lastUpdated: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now()
    });
    log.info('✓ Configuration système créée');

    log.success('Collection system créée');

  } catch (error) {
    log.error(`Erreur system: ${error.message}`);
    throw error;
  }
}

/**
 * Créer la collection _diagnostic
 */
async function setupDiagnostic(db) {
  log.step('7', 'Configuration _diagnostic');

  try {
    const ref = db.collection('_diagnostic');
    const snapshot = await ref.limit(1).get();

    if (!snapshot.empty) {
      log.skip('Collection _diagnostic existe déjà');
      return;
    }

    await ref.doc('diag001').set({
      userId: 'medecin123',
      reason: 'system_initialization',
      timestamp: admin.firestore.Timestamp.now(),
      data: {
        collections: [
          'userProfiles',
          'userWebhooks',
          'userSessions',
          'auditLogs',
          'webhookLogs',
          'system',
          '_diagnostic'
        ],
        status: 'initialized',
        method: 'node-script',
        version: '4.0.0'
      }
    });
    log.info('✓ Document diagnostic créé');

    log.success('Collection _diagnostic créée');

  } catch (error) {
    log.error(`Erreur _diagnostic: ${error.message}`);
    throw error;
  }
}

/**
 * Vérifier la configuration
 */
async function verifySetup(db) {
  log.header('Vérification de la Configuration');

  try {
    const collections = [
      'userProfiles',
      'userWebhooks',
      'userSessions',
      'auditLogs',
      'webhookLogs',
      'system',
      '_diagnostic'
    ];

    console.log('\n📊 Résumé des Collections:\n');

    let totalDocs = 0;

    for (const collName of collections) {
      const snapshot = await db.collection(collName).get();
      const count = snapshot.size;
      totalDocs += count;

      const status = count > 0 ? '✅' : '⚠️';
      const docText = count === 1 ? 'document' : 'documents';
      console.log(`  ${status} ${collName.padEnd(20)} → ${count} ${docText}`);
    }

    console.log(`\n  ${colors.green}${colors.bright}📈 Total: ${totalDocs} documents${colors.reset}\n`);

    return totalDocs > 0;

  } catch (error) {
    log.error(`Erreur vérification: ${error.message}`);
    return false;
  }
}

/**
 * Afficher le résumé
 */
function printSummary() {
  console.log(`
${colors.green}${colors.bright}
╔════════════════════════════════════════════╗
║                                            ║
║  🎉 Configuration Firestore Réussie!      ║
║                                            ║
║  ✅ 7 Collections créées                  ║
║  ✅ Documents de test ajoutés              ║
║  ✅ Système prêt à l'emploi                ║
║                                            ║
╚════════════════════════════════════════════╝
${colors.reset}

${colors.bright}Utilisateurs de test créés:${colors.reset}
  👤 Admin User (akio963@gmail.com)
  👨‍⚕️ Dr. Jean Dupont (medecin@example.com)
  👩‍⚕️ Marie Dupont (infirmier@example.com)

${colors.bright}Prochaines étapes:${colors.reset}
  1. Ouvrir: /admin-webhooks.html
  2. Se connecter: akio963@gmail.com
  3. Voir les utilisateurs créés
  4. Assigner d'autres webhooks si besoin

${colors.bright}Support:${colors.reset}
  📖 Documentation: QUICK_START_GUIDE.md
  🧪 Tests: window.runAdminWebhookTests()
  📞 Contact: akio963@gmail.com
`);
}

/**
 * Main - Fonction principale
 */
async function main() {
  try {
    log.header('DictaMed - Configuration Firestore');
    log.info(`Version: 1.0.0`);
    log.info(`Timestamp: ${new Date().toLocaleString('fr-FR')}`);

    // Initialiser Firebase
    const db = initializeFirebase();

    // Créer les collections
    log.header('Création des Collections');

    await setupUserProfiles(db);
    await setupUserWebhooks(db);
    await setupUserSessions(db);
    await setupAuditLogs(db);
    await setupWebhookLogs(db);
    await setupSystem(db);
    await setupDiagnostic(db);

    // Vérifier la configuration
    const success = await verifySetup(db);

    if (success) {
      printSummary();
      log.success('Script complété avec succès!');
      process.exit(0);
    } else {
      log.error('Aucun document créé. Vérifiez les permissions Firestore.');
      process.exit(1);
    }

  } catch (error) {
    log.error(`Erreur critique: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le script
main();
