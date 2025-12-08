/**
 * DictaMed - Script de diagnostic pour le bouton d'enregistrement audio
 * Version: 1.0.0 - Debug et diagnostic des problèmes d'enregistrement
 */

(function() {
    'use strict';
    
    console.log('🔧 === DIAGNOSTIC AUDIO RECORDER ===');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🌐 User Agent:', navigator.userAgent);
    
    // État global du diagnostic
    const diagnosticState = {
        domElements: {},
        audioRecorders: {},
        errors: []
    };
    
    // Fonction de diagnostic principal
    function runAudioDiagnostic() {
        console.log('🎯 === DÉBUT DU DIAGNOSTIC AUDIO ===');
        
        try {
            // 1. Vérification des éléments DOM
            checkDOMElements();
            
            // 2. Vérification des classes CSS
            checkCSSClasses();
            
            // 3. Vérification des AudioRecorders
            checkAudioRecorders();
            
            // 4. Vérification des event listeners
            checkEventListeners();
            
            // 5. Test des permissions microphone
            checkMicrophonePermissions();
            
            // 6. Rapport final
            generateDiagnosticReport();
            
        } catch (error) {
            console.error('❌ Erreur lors du diagnostic:', error);
        }
    }
    
    // 1. Vérification des éléments DOM
    function checkDOMElements() {
        console.log('🔍 1. Vérification des éléments DOM...');
        
        // Vérification des éléments avec la classe correcte
        const enhancedSections = document.querySelectorAll('.recording-section-enhanced');
        const regularSections = document.querySelectorAll('.recording-section');
        
        console.log('📊 Éléments trouvés:', {
            'recording-section-enhanced': enhancedSections.length,
            'recording-section': regularSections.length
        });
        
        diagnosticState.domElements.enhancedSections = enhancedSections.length;
        diagnosticState.domElements.regularSections = regularSections.length;
        
        // Analyse détaillée de chaque section
        enhancedSections.forEach((section, index) => {
            const sectionId = section.getAttribute('data-section');
            console.log(`📋 Section ${index + 1} (${sectionId}):`);
            
            // Vérifier les boutons
            const btnRecord = section.querySelector('.btn-record-enhanced');
            const btnPause = section.querySelector('.btn-control-enhanced[data-action="pause"]');
            const btnStop = section.querySelector('.btn-control-enhanced[data-action="stop"]');
            
            console.log(`   🎤 Bouton Enregistrer: ${btnRecord ? '✅ Présent' : '❌ Manquant'}`);
            console.log(`   ⏸️ Bouton Pause: ${btnPause ? '✅ Présent' : '❌ Manquant'}`);
            console.log(`   ⏹️ Bouton Stop: ${btnStop ? '✅ Présent' : '❌ Manquant'}`);
            
            // Vérifier les éléments de statut
            const statusIndicator = section.querySelector('.status-indicator');
            const timer = section.querySelector('.timer');
            console.log(`   📊 Indicateur de statut: ${statusIndicator ? '✅ Présent' : '❌ Manquant'}`);
            console.log(`   ⏱️ Timer: ${timer ? '✅ Présent' : '❌ Manquant'}`);
        });
        
        if (enhancedSections.length === 0) {
            diagnosticState.errors.push({
                type: 'no_dom_elements',
                message: 'Aucun élément .recording-section-enhanced trouvé dans le DOM'
            });
        }
    }
    
    // 2. Vérification des classes CSS
    function checkCSSClasses() {
        console.log('🎨 2. Vérification des classes CSS...');
        
        const testElements = [
            '.btn-record-enhanced',
            '.btn-control-enhanced',
            '.status-indicator',
            '.timer',
            '.recording-section-enhanced'
        ];
        
        testElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            console.log(`🎯 ${selector}: ${elements.length} élément(s) trouvé(s)`);
            
            if (elements.length === 0) {
                diagnosticState.errors.push({
                    type: 'missing_css_class',
                    selector: selector,
                    message: `Aucun élément avec la classe ${selector} trouvé`
                });
            }
        });
    }
    
    // 3. Vérification des AudioRecorders
    function checkAudioRecorders() {
        console.log('🎧 3. Vérification des AudioRecorders...');
        
        if (window.audioRecorderManager) {
            console.log('✅ AudioRecorderManager trouvé');
            
            const recorders = window.audioRecorderManager.getAllRecorders();
            console.log(`📊 Nombre d'enregistreurs: ${recorders.size}`);
            
            recorders.forEach((recorder, sectionId) => {
                console.log(`🎤 Enregistreur pour section "${sectionId}":`, {
                    hasMediaRecorder: !!recorder.mediaRecorder,
                    hasAudioBlob: !!recorder.audioBlob,
                    hasStream: !!recorder.stream,
                    currentState: recorder.mediaRecorder?.state || 'inactive'
                });
                
                diagnosticState.audioRecorders[sectionId] = {
                    exists: true,
                    hasMediaRecorder: !!recorder.mediaRecorder,
                    hasAudioBlob: !!recorder.audioBlob,
                    hasStream: !!recorder.stream,
                    state: recorder.mediaRecorder?.state || 'inactive'
                };
            });
            
        } else {
            console.error('❌ AudioRecorderManager non trouvé');
            diagnosticState.errors.push({
                type: 'no_audio_manager',
                message: 'AudioRecorderManager n\'est pas disponible'
            });
        }
        
        if (window.AudioRecorder) {
            console.log('✅ Classe AudioRecorder disponible');
        } else {
            console.error('❌ Classe AudioRecorder non trouvée');
            diagnosticState.errors.push({
                type: 'no_audio_recorder_class',
                message: 'La classe AudioRecorder n\'est pas disponible'
            });
        }
    }
    
    // 4. Vérification des event listeners
    function checkEventListeners() {
        console.log('👂 4. Vérification des event listeners...');
        
        const recordButtons = document.querySelectorAll('.btn-record-enhanced');
        console.log(`🎤 Boutons d'enregistrement trouvés: ${recordButtons.length}`);
        
        recordButtons.forEach((button, index) => {
            const section = button.closest('.recording-section-enhanced');
            const sectionId = section?.getAttribute('data-section') || `inconnu_${index}`;
            
            console.log(`🔘 Test du bouton ${index + 1} (section: ${sectionId})`);
            
            // Test de clic simulé
            try {
                console.log(`   🧪 Test de clic simulé...`);
                button.click();
                console.log(`   ✅ Clic simulé réussi`);
            } catch (clickError) {
                console.error(`   ❌ Erreur lors du clic simulé:`, clickError);
            }
        });
    }
    
    // 5. Vérification des permissions microphone
    async function checkMicrophonePermissions() {
        console.log('🎤 5. Vérification des permissions microphone...');
        
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const permissions = await navigator.permissions.query({name: 'microphone'});
                console.log(`🔐 Statut des permissions microphone:`, permissions.state);
                
                try {
                    console.log('🧪 Test d\'accès au microphone...');
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        audio: true,
                        video: false 
                    });
                    
                    console.log('✅ Accès au microphone réussi');
                    
                    stream.getTracks().forEach(track => track.stop());
                    console.log('🛑 Stream de test arrêté');
                    
                } catch (streamError) {
                    console.error('❌ Échec d\'accès au microphone:', streamError);
                    diagnosticState.errors.push({
                        type: 'microphone_access_failed',
                        error: streamError.message,
                        name: streamError.name
                    });
                }
                
            } else {
                console.error('❌ API getUserMedia non supportée');
                diagnosticState.errors.push({
                    type: 'no_getusermedia',
                    message: 'L\'API getUserMedia n\'est pas supportée'
                });
            }
            
        } catch (permError) {
            console.warn('⚠️ Impossible de vérifier les permissions:', permError);
        }
    }
    
    // 6. Rapport final
    function generateDiagnosticReport() {
        console.log('📊 === RAPPORT DE DIAGNOSTIC ===');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalErrors: diagnosticState.errors.length,
                domElementsFound: diagnosticState.domElements.enhancedSections || 0,
                audioRecordersFound: Object.keys(diagnosticState.audioRecorders).length
            },
            errors: diagnosticState.errors,
            recommendations: []
        };
        
        if (diagnosticState.errors.length === 0) {
            console.log('✅ DIAGNOSTIC: Aucune erreur détectée');
            report.recommendations.push('Le système d\'enregistrement audio semble fonctionner correctement');
        } else {
            console.log(`❌ DIAGNOSTIC: ${diagnosticState.errors.length} erreur(s) détectée(s)`);
            
            diagnosticState.errors.forEach(error => {
                switch (error.type) {
                    case 'no_dom_elements':
                        report.recommendations.push('Vérifier que les sections d\'enregistrement sont correctement chargées dans le DOM');
                        break;
                    case 'no_audio_manager':
                        report.recommendations.push('Vérifier que AudioRecorderManager est initialisé correctement');
                        break;
                    case 'microphone_access_failed':
                        report.recommendations.push('Demander les permissions microphone à l\'utilisateur');
                        break;
                    default:
                        report.recommendations.push(`Investiguer l'erreur: ${error.message}`);
                }
            });
        }
        
        console.log('📋 Résumé du diagnostic:', report.summary);
        console.log('💡 Recommandations:', report.recommendations);
        
        window.audioDiagnosticReport = report;
        return report;
    }
    
    // Lancer le diagnostic après un court délai
    setTimeout(runAudioDiagnostic, 2000);
    
    // Exposer des fonctions de diagnostic
    window.AudioDiagnostic = {
        run: runAudioDiagnostic,
        getState: () => diagnosticState,
        getReport: () => window.audioDiagnosticReport
    };
    
    console.log('🔧 Diagnostic script chargé. Utilisation: AudioDiagnostic.run()');
    
})();