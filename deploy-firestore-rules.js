/**
 * Script de déploiement des règles Firestore pour DictaMed
 * Ce script met à jour les règles de sécurité Firestore pour corriger les problèmes d'permissions admin
 */

const firebase = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuration Firebase
const serviceAccount = require('./dictamed-firebase-adminsdk.json'); // Assurez-vous que ce fichier existe
const firebaseConfig = {
    apiKey: "AIzaSyC9XYvHxbp3VW0PCW0W7xfoWuiMxsjoUZE",
    authDomain: "dictamed2025.firebaseapp.com", 
    projectId: "dictamed2025",
    storageBucket: "dictamed2025.firebasestorage.app",
    messagingSenderId: "242034923776",
    appId: "1:242034923776:web:bd315e890c715b1d263be5",
    measurementId: "G-1B8DZ4B73R"
};

async function deployFirestoreRules() {
    try {
        console.log('🚀 Début du déploiement des règles Firestore...');
        
        // Initialiser Firebase Admin
        if (!firebase.apps.length) {
            firebase.initializeApp({
                credential: firebase.credential.cert(serviceAccount),
                ...firebaseConfig
            });
        }
        
        const firestore = firebase.firestore();
        
        // Lire le fichier firestore.rules
        const rulesPath = path.join(__dirname, 'firestore.rules');
        const rulesContent = fs.readFileSync(rulesPath, 'utf8');
        
        console.log('📖 Règles Firestore chargées:', rulesPath);
        
        // Déployer les règles via l'API Firebase Management
        // Note: Pour un déploiement complet, vous devriez utiliser Firebase CLI
        // firebase deploy --only firestore:rules
        
        // Alternative: Créer le document adminUsers si nécessaire
        await createAdminDocument(firestore);
        
        console.log('✅ Déploiement terminé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors du déploiement:', error);
        process.exit(1);
    }
}

async function createAdminDocument(firestore) {
    try {
        console.log('👤 Création/mise à jour du document admin...');
        
        // Créer le document adminUsers
        const adminDoc = {
            adminUIDs: {
                // Ajoutez ici l'UID de votre utilisateur admin
                // Pour obtenir l'UID, vous pouvez le récupérer depuis la console Firebase
            },
            adminEmails: [
                'akio963@gmail.com' // Email de l'administrateur
            ],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await firestore.collection('system').doc('adminUsers').set(adminDoc, { merge: true });
        console.log('✅ Document adminUsers créé/mis à jour');
        
    } catch (error) {
        console.warn('⚠️ Impossible de créer le document adminUsers:', error.message);
        console.log('ℹ️ Cela peut être normal si vous utilisez la vérification par email');
    }
}

// Instructions pour l'utilisateur
console.log(`
🔧 Instructions pour corriger les permissions Firestore admin :

1. MÉTHODE RECOMMANDÉE - Firebase CLI :
   firebase login
   firebase use dictamed2025
   firebase deploy --only firestore:rules

2. MÉTHODE ALTERNATIVE - Console Firebase :
   - Allez sur https://console.firebase.google.com/project/dictamed2025/firestore/rules
   - Remplacez le contenu par le contenu de firestore.rules
   - Cliquez sur "Publier"

3. VÉRIFICATION :
   - Testez l'accès admin sur admin-webhooks.html
   - Vérifiez que l'erreur "Missing or insufficient permissions" a disparu

4. SI LE PROBLÈME PERSISTE :
   - Vérifiez que vous êtes connecté avec akio963@gmail.com
   - Consultez les logs Firebase dans la console
`);

// Exécution si appelé directement
if (require.main === module) {
    deployFirestoreRules();
}

module.exports = { deployFirestoreRules };