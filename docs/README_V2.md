# DictaMed v2.0 - Guide Complet
## Architecture Multi-Entrées (Audio | Texte | Photos) + Agent OpenAI

---

## 🎯 Bienvenue en v2.0!

Cette nouvelle architecture change votre stratégie pour utiliser **1 seul webhook** avec **3 chemins de traitement conditionnels** basés sur le type d'entrée (Audio/Texte/Photo).

### Comparaison v1.0 vs v2.0

```
v1.0 (Ancien):
  50+ webhooks → 3 boucles parallèles → 3x Google Sheets append

v2.0 (Nouveau):
  1 webhook → Déterminer type → 1 chemin optimal → 1x Google Sheets append

Résultat:
  ✅ Simpler, plus rapide, moins coûteux
  ✅ Supporte audio, texte ET photos
  ✅ Agent OpenAI centralisé
```

---

## 📚 Guide de Navigation

### Pour Commencer: Lire Dans Cet Ordre

#### 1️⃣ **Ce document (README_V2.md)**
   → Vue d'ensemble générale

#### 2️⃣ **[N8N_CONDITIONAL_WORKFLOW_V2.md](N8N_CONDITIONAL_WORKFLOW_V2.md)**
   → **Comprendre l'architecture n8n**
   - Diagramme complet du workflow
   - Détail de chaque nœud
   - 3 chemins (Audio, Texte, Photo)
   - Format des payloads
   - Configuration Google Sheets

#### 3️⃣ **[FRONTEND_MODIFICATIONS_V2.md](FRONTEND_MODIFICATIONS_V2.md)**
   → **Modifier le code frontend**
   - Refactor data-sender.js
   - Ajouter support multi-inputs
   - Adapter composants UI
   - Tests locaux

#### 4️⃣ **[DEPLOYMENT_STRATEGY_V2.md](DEPLOYMENT_STRATEGY_V2.md)**
   → **Plan de déploiement étape par étape**
   - 6 phases (Google Sheets → n8n → Frontend → Tests → Migration → Production)
   - 3-3.5 heures total
   - Checklist complète

---

## 🗂️ Structure des Fichiers

```
docs/
├── README_V2.md                           ← Vous êtes ici
├── N8N_CONDITIONAL_WORKFLOW_V2.md         ← Architecture n8n détaillée
├── FRONTEND_MODIFICATIONS_V2.md           ← Code frontend à modifier
└── DEPLOYMENT_STRATEGY_V2.md              ← Plan étape par étape

scripts/
├── validate-payload-v2.js                 ← Validation payload
├── audio-processor-v2.js                  ← Traitement audio
└── migrate-users-to-sheets.js             ← Migration utilisateurs

js/
├── components/
│   └── data-sender.js                     ← À refactoriser
└── core/
    └── config.js                          ← À mettre à jour
```

---

## 🏗️ Architecture Générale

### Workflow Simplifié

```
┌─────────────────────────────────────────────────────────────┐
│                FRONTEND: 3 Types d'Entrée                    │
│  [Audio Recorder] | [Text Input] | [Photo Upload]            │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│        data-sender.js: Préparer Payload (v2.0)              │
│  • determineInputType()                                      │
│  • processAudioData() → compression                          │
│  • processTextData() → nettoyage                             │
│  • processPhotoData() → validation                           │
│  • validatePayload()                                         │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│     WEBHOOK UNIQUE: /webhook/DictaMed (n8n)                 │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│    1. Lookup User in Google Sheets "DictaMed_Users"         │
│       → Récupère prompt, excel_file_id                      │
└────────────────────────┬────────────────────────────────────┘
                         ▼
         ┌───────────────┴───────────────┬───────────────┐
         ▼                               ▼               ▼
   ╔═════════╗                    ╔═════════╗      ╔═════════╗
   ║ AUDIO   ║                    ║ TEXTE   ║      ║ PHOTO   ║
   ╚═════════╝                    ╚═════════╝      ╚═════════╝
         ▼                               ▼               ▼
   [Whisper API]                 [Directement]    [Vision API]
     (transcrire)                (sauter 1 step)  (analyser)
         ▼                               ▼               ▼
         └───────────────┬───────────────┴───────────────┘
                         ▼
         ╔════════════════════════════════════╗
         ║  Agent OpenAI (GPT-4)              ║
         ║  → Structurer les données          ║
         ║  → Parser JSON                     ║
         ║  → Utiliser prompt utilisateur     ║
         ╚════════════════════════════════════╝
                         ▼
         ╔════════════════════════════════════╗
         ║  Google Sheets                     ║
         ║  → Append Row                      ║
         ║  → Dans excel_file_id (utilisateur)║
         ╚════════════════════════════════════╝
                         ▼
         ╔════════════════════════════════════╗
         ║  Response 200 OK                   ║
         ║  (Frontend reçoit succès)          ║
         ╚════════════════════════════════════╝
```

---

## 📊 Payload: Avant vs Après

### v1.0 - Ancien Payload (Complexe)
```json
{
  "uid": "abc123",
  "email": "student@med.fr",
  "displayName": "Dr. Martin",
  "mode": "normal",
  "timestamp": "2025-01-15T10:30:00Z",
  "patientInfo": { ... },
  "recordings": [
    {
      "sectionId": "partie1",
      "audioData": "base64...",
      "duration": 45,
      "format": "webm"
    }
  ],
  "metadata": { }
}
```

### v2.0 - Nouveau Payload (Flexible)
```json
{
  "uid": "abc123",
  "email": "student@med.fr",
  "displayName": "Dr. Martin",
  "mode": "normal",
  "timestamp": "2025-01-15T10:30:00Z",
  "patientInfo": { ... },
  "inputType": "audio",                    // ← NOUVEAU: audio | text | photo
  "data": {
    "audioData": "base64...",              // OU
    "duration": 45,
    "format": "webm"

    // OU
    "text": "Patient se plaint de...",

    // OU
    "photoData": "base64...",
    "mimeType": "image/jpeg",
    "description": "Radiographie"
  },
  "metadata": { }
}
```

---

## 🔑 Clés à Comprendre

### 1. **inputType: 'audio' | 'text' | 'photo'**
   - Détermine automatiquement le chemin de traitement
   - Généré par `determineInputType()` dans frontend
   - Utilisé par `Switch` node dans n8n

### 2. **data: { audioData | text | photoData }**
   - Wrapper pour les données selon le type
   - Évite confusion avec les anciennes structures
   - Permet flexibilité futur (nouveau type?)

### 3. **prompt: Récupéré de Google Sheets**
   - Personnalisé par utilisateur
   - Utilisé par Agent OpenAI pour structuration
   - Pas plus hardcodé dans le code!

### 4. **Agent OpenAI: Point Central**
   - Reçoit tout après Whisper/Vision (si applicable)
   - Même API pour audio/texte/photo
   - Réduit le "noise" vs 3 APIs différentes

### 5. **Google Sheets: Simple + Scalable**
   - 1 sheet "DictaMed_Users" = config centralisée
   - N sheets résultats = 1 par utilisateur
   - Pas de redéploiement n8n pour nouvel utilisateur

---

## 📋 Cas d'Usage

### Cas 1: Dictée Audio (Dr. Martin, Cardiologie)
```json
{
  "inputType": "audio",
  "data": { "audioData": "...", "duration": 45 },
  "uid": "abc123"
}
```

Flux:
```
Whisper API → "Patient douleurs thoraciques depuis 3 jours..."
    ↓
Agent OpenAI + Prompt Cardio → { "symptômes": "...", "diagnostic": "..." }
    ↓
Google Sheets (Dr. Martin) → Append
```

### Cas 2: Texte Rapide (Dr. Autre, Généraliste)
```json
{
  "inputType": "text",
  "data": { "text": "Patient 45 ans, céphalées..." },
  "uid": "xyz789"
}
```

Flux:
```
(Skip Whisper - pas d'audio!)
    ↓
Agent OpenAI + Prompt Généraliste → { "symptômes": "...", "diagnostic": "..." }
    ↓
Google Sheets (Dr. Autre) → Append
```

### Cas 3: Radiographie (Dr. Radiologue)
```json
{
  "inputType": "photo",
  "data": { "photoData": "...", "mimeType": "image/jpeg" },
  "uid": "rad123"
}
```

Flux:
```
Vision API → "Opacité apicale gauche, aspect pulmonaire..."
    ↓
Agent OpenAI + Prompt Radiologue → { "observations": "...", "diagnostic": "..." }
    ↓
Google Sheets (Dr. Radiologue) → Append
```

---

## ⚡ Points Forts v2.0

### ✅ Simplicité
- 1 webhook au lieu de 50
- Logic centralisée n8n
- Flexibilité pour nouveaux types

### ✅ Scalabilité
- 500+ utilisateurs sans modification
- 3 types d'entrées supportées
- Agent OpenAI peut gérer tous

### ✅ Coûts
- Moins d'appels API (Whisper seulement si audio)
- Moins de "noise" (1 agent au lieu de 3)
- Compression audio automatique

### ✅ Flexibilité
- Prompts personnalisés par utilisateur
- Google Sheets facile à modifier
- Pas besoin redéployer n8n

---

## ⚠️ Points d'Attention

### 🔴 Dépendances Critiques
```
- OpenAI API Key (Whisper, GPT-4, Vision)
  → Coûts plus élevés si beaucoup de requêtes
  → Mettre en place rate limiting

- Google Sheets API
  → Limite 300 req/min
  → Pas de problème pour usage normal

- n8n disponibilité
  → Configurer backups
  → Monitoring alertes
```

### ⚠️ Migration de v1.0
```
- Les anciens payloads ne fonctionneront pas
- Vérifier tous les clients envoient "inputType"
- Adapter tous les composants frontend
- Tests complets requis!
```

### 🟡 Timeouts
```
- Whisper: 120s (OK pour audio 5MB)
- Vision: 60s (OK pour images)
- Agent: 60s (acceptable)
- Total: 300s = 5 minutes (OK)
```

---

## 🚀 Plan d'Action Quick Start

### Jour 1: Setup (2-3 heures)

**1. Google Sheets (20 min)**
```
https://sheets.google.com/create
→ "DictaMed_Users" sheet
→ Colonnes: uid, email, displayName, mode, prompt, excel_file_id, is_active
```

**2. n8n Workflow (60 min)**
```
Suivre docs/N8N_CONDITIONAL_WORKFLOW_V2.md
Créer 8 nœuds avec logique conditionnelle
Déployer
```

**3. Frontend Modifications (45 min)**
```
Suivre docs/FRONTEND_MODIFICATIONS_V2.md
Refactor data-sender.js
Adapter composants audio/texte/photo
```

### Jour 2: Tests & Production (1-2 heures)

**4. Tests (30 min)**
```
Test audio → Vérifier Google Sheets
Test texte → Vérifier Google Sheets
Test photo → Vérifier Google Sheets
Test erreurs
```

**5. Migration Utilisateurs (5 min)**
```
node scripts/migrate-users-to-sheets.js
Remplir prompts + excel_file_id
```

**6. Production (15 min)**
```
git commit + push
firebase deploy
Monitoring configuré
```

---

## 📖 Lecture Recommandée

### Pour Architectes
1. Ce README
2. N8N_CONDITIONAL_WORKFLOW_V2.md (sections "Architecture Détaillée")
3. DEPLOYMENT_STRATEGY_V2.md (phases globales)

### Pour Développeurs n8n
1. N8N_CONDITIONAL_WORKFLOW_V2.md (section "Architecture n8n Pas-à-Pas")
2. Scripts: validate-payload-v2.js, audio-processor-v2.js
3. DEPLOYMENT_STRATEGY_V2.md (Phase 2)

### Pour Développeurs Frontend
1. FRONTEND_MODIFICATIONS_V2.md (complet)
2. Scripts: validate-payload-v2.js, audio-processor-v2.js
3. DEPLOYMENT_STRATEGY_V2.md (Phase 3)

### Pour DevOps/SRE
1. DEPLOYMENT_STRATEGY_V2.md (phases 1, 5, 6)
2. Monitoring section
3. Checklist finale

---

## 🆘 Besoin d'Aide?

### Questions Fréquentes

**Q: Où récupérer les clés API?**
```
OpenAI API: https://platform.openai.com/api-keys
Google Service Account: Google Cloud Console → Service Accounts
```

**Q: Combien ça coûte?**
```
Audio 1 min:       $0.02 (Whisper)
Agent call:        $0.01-0.05 (GPT-4)
Vision image:      $0.01-0.03 (Vision)
Google Sheets:     Gratuit (1M cells/day)

Coût total/appel: ~$0.05-0.10
→ 100 appels/jour = $5-10/jour
```

**Q: Quel est le timeout?**
```
Audio: 120 secondes
Photo: 60 secondes
Texte: 30 secondes
Agent: 60 secondes
Total: 5 minutes max
```

**Q: Et si un utilisateur n'est pas dans Google Sheets?**
```
n8n retournera 404 "User not found"
Frontend recevra erreur
Utilisateur verra notification d'erreur
```

### Documentation Externe

- **OpenAI API**: https://platform.openai.com/docs/api-reference
- **n8n Docs**: https://docs.n8n.io/
- **Google Sheets API**: https://developers.google.com/sheets/api
- **JavaScript Processing**: MDN Web Docs

---

## 📞 Contact & Support

Pour urgences ou blockers:
```
Email: akio963@gmail.com
Slack: #dictamed-dev (si disponible)
```

---

## 🎓 Apprentissage

### Concepts Clés à Maîtriser

1. **Webhooks n8n**
   - POST payloads
   - JSON validation
   - Error handling

2. **Conditional Logic**
   - Switch statements
   - Multiple branches
   - Data routing

3. **API Integration**
   - OpenAI (Whisper, GPT-4, Vision)
   - Google Sheets
   - Error handling + retries

4. **Frontend Data Processing**
   - Audio encoding (base64)
   - Image compression
   - Text validation

5. **Google Sheets API**
   - Authentication (Service Account)
   - Reading (Lookup)
   - Writing (Append)

---

## 🎉 Conclusion

DictaMed v2.0 est une architecture **moderna, flexible, et scalable**:

✅ **Plus simple**: 1 webhook au lieu de 50
✅ **Plus rapide**: Chemins optimisés par type
✅ **Moins coûteux**: APIs appelées uniquement si nécessaire
✅ **Futur-proof**: Facile d'ajouter nouveaux types

**Temps d'implémentation**: 3-4 heures
**Temps de retour sur investissement**: Immédiat (moins de webhooks à gérer)

---

## 📋 Document Navigation Map

```
README_V2.md (Vous êtes ici)
    ↓
    ├─→ Comprendre Architecture
    │   └─→ N8N_CONDITIONAL_WORKFLOW_V2.md
    │
    ├─→ Coder le Frontend
    │   └─→ FRONTEND_MODIFICATIONS_V2.md
    │       └─→ scripts/validate-payload-v2.js
    │       └─→ scripts/audio-processor-v2.js
    │
    └─→ Déployer
        └─→ DEPLOYMENT_STRATEGY_V2.md
            ├─ Phase 0-1: Google Sheets
            ├─ Phase 2: n8n
            ├─ Phase 3: Frontend
            ├─ Phase 4: Tests
            ├─ Phase 5: Migration
            └─ Phase 6: Production
```

---

**Version:** 2.0.0
**Dernière mise à jour:** 2025-01-15
**Statut:** ✅ Production Ready
**Temps Total Implémentation:** 3-4 heures
