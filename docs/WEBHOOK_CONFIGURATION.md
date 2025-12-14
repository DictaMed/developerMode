# DictaMed - Configuration des Webhooks par Type de Fichier v5.1.0

## 🎯 Objectif

Ce guide explique comment **configurer les webhooks n8n par TYPE DE FICHIER**.

Chaque type de données peut avoir son propre workflow n8n:
- 🎵 **Audio** → Enregistrements audio (modes NORMAL, TEST, DMI)
- 📝 **Texte** → Textes libres (mode DMI seulement)
- 🖼️ **Photos** → Images (mode DMI seulement)

---

## 📍 Où Modifier les Webhooks?

**Un seul fichier à modifier:**

```
js/config/webhooks-config.js
```

**NE MODIFIEZ PAS:**
- ❌ `js/core/config.js`
- ❌ `js/components/data-sender.js`
- ❌ `js/components/dmi-data-sender.js`
- ❌ `docs/` ou autre documentation

---

## 🔧 Comment Configurer les Webhooks

### Étape 1: Ouvrir le fichier
```
js/config/webhooks-config.js
```

### Étape 2: Localiser la configuration

Vous verrez:
```javascript
const WEBHOOKS_CONFIG = {
    // Webhook pour les fichiers AUDIO enregistrés
    audio: '',

    // Webhook pour les TEXTES libres
    text: '',

    // Webhook pour les PHOTOS
    photo: ''
};
```

### Étape 3: Ajouter vos URLs de Webhooks

**Exemple - Configuration complète:**

```javascript
const WEBHOOKS_CONFIG = {
    // 🎵 Webhook pour AUDIO (utilisé dans NORMAL, TEST, DMI)
    audio: 'https://n8n.votre-domaine.com/webhook/audio-processor',

    // 📝 Webhook pour TEXTE (utilisé dans DMI seulement)
    text: 'https://n8n.votre-domaine.com/webhook/text-processor',

    // 🖼️ Webhook pour PHOTOS (utilisé dans DMI seulement)
    photo: 'https://n8n.votre-domaine.com/webhook/photo-processor'
};
```

---

## 📋 Cas d'Usage

### Cas 1: Un Seul Webhook pour Tous les Types

Si vous avez un seul workflow n8n qui traite tous les types:

```javascript
const WEBHOOKS_CONFIG = {
    audio: 'https://n8n.srv1104707.hstgr.cloud/webhook/unified',
    text: 'https://n8n.srv1104707.hstgr.cloud/webhook/unified',
    photo: 'https://n8n.srv1104707.hstgr.cloud/webhook/unified'
};
```

### Cas 2: Webhooks Séparés par Type

Si vous avez des workflows différents pour chaque type:

```javascript
const WEBHOOKS_CONFIG = {
    audio: 'https://n8n.srv1104707.hstgr.cloud/webhook/audio',
    text: 'https://n8n.srv1104707.hstgr.cloud/webhook/text',
    photo: 'https://n8n.srv1104707.hstgr.cloud/webhook/photo'
};
```

### Cas 3: Certains Types Non Utilisés

Si vous ne utilisez pas tous les types (par ex, pas de photos):

```javascript
const WEBHOOKS_CONFIG = {
    audio: 'https://n8n.srv1104707.hstgr.cloud/webhook/audio',
    text: 'https://n8n.srv1104707.hstgr.cloud/webhook/text',
    photo: '' // Pas de webhook pour photos
};
```

⚠️ **Important**: Si l'utilisateur essaie d'envoyer des photos mais `photo` est vide, il aura une erreur.

---

## 🔄 Flux de Données par Mode

### Mode NORMAL
```
Utilisateur enregistre audio
    ↓
Clique "Envoyer"
    ↓
system détecte: fileType = 'audio'
    ↓
Utilise webhook: WEBHOOKS_CONFIG.audio
    ↓
Envoie au workflow n8n audio
```

### Mode TEST
```
Utilisateur enregistre audio
    ↓
Clique "Envoyer"
    ↓
System détecte: fileType = 'audio'
    ↓
Utilise webhook: WEBHOOKS_CONFIG.audio
    ↓
Envoie au workflow n8n audio
```

### Mode DMI
```
Utilisateur entre texte ET/OU ajoute photos
    ↓
Clique "Envoyer les données DMI"
    ↓
System envoie CHAQUE TYPE à son webhook:

    Si texte:
        → fileType = 'text'
        → Utilise: WEBHOOKS_CONFIG.text
        → Envoie au workflow n8n text

    Si photos:
        → fileType = 'photo'
        → Utilise: WEBHOOKS_CONFIG.photo
        → Envoie au workflow n8n photo (1 photo par webhook)
```

---

## 📊 Structure du Payload Envoyé

### Payload Audio
```json
{
    "uid": "abc123xyz",
    "email": "student@med.fr",
    "displayName": "Dr. Martin",
    "mode": "normal",
    "fileType": "audio",
    "inputType": "audio",
    "timestamp": "2025-01-15T10:30:00Z",
    "patientInfo": {...},
    "recordings": [{...}],
    "metadata": {...}
}
```

### Payload Texte (DMI)
```json
{
    "uid": "abc123xyz",
    "email": "student@med.fr",
    "displayName": "Dr. Martin",
    "mode": "dmi",
    "fileType": "text",
    "inputType": "text",
    "timestamp": "2025-01-15T10:30:00Z",
    "numeroDossier": "D123456",
    "nomPatient": "Jean Dupont",
    "texte": "Contenu du texte libre..."
}
```

### Payload Photo (DMI)
```json
{
    "uid": "abc123xyz",
    "email": "student@med.fr",
    "displayName": "Dr. Martin",
    "mode": "dmi",
    "fileType": "photo",
    "inputType": "photo",
    "timestamp": "2025-01-15T10:30:00Z",
    "numeroDossier": "D123456",
    "nomPatient": "Jean Dupont",
    "photoIndex": 1,
    "totalPhotos": 3,
    "photo": {
        "data": "base64_encoded_image...",
        "index": 0,
        "timestamp": "2025-01-15T10:30:00Z"
    }
}
```

---

## ✅ Vérification après Configuration

Après avoir configuré les webhooks, vérifiez dans la **console du navigateur** (F12):

```javascript
// Ouvrez la console
console.log(window.APP_CONFIG.WEBHOOK_ENDPOINTS);

// Vous devez voir:
// {
//   audio: "https://...",
//   text: "https://...",
//   photo: "https://..."
// }
```

---

## ⚠️ Erreurs Courantes

### Erreur: "Webhook endpoint not configured for file type: audio"

**Cause**: `WEBHOOKS_CONFIG.audio` est vide

**Solution**: Remplissez la valeur dans `js/config/webhooks-config.js`

### Erreur: HTTP 404 - "User not configured"

**Cause**: Le webhook existe mais le workflow n8n ne trouve pas l'utilisateur

**Solution**: Vérifiez que l'utilisateur est dans Google Sheets "DictaMed_Users"

### Erreur: Les photos ne s'envoient pas

**Cause**: `WEBHOOKS_CONFIG.photo` est vide

**Solution**: Configurez le webhook pour les photos dans `js/config/webhooks-config.js`

### Erreur: Forcez le rafraîchissement du navigateur

Si les webhooks ne changent pas après sauvegarde:

```
Ctrl+F5       (Windows)
Cmd+Shift+R   (Mac)
```

---

## 🔐 Sécurité

⚠️ **Important**:
- ✅ Les URLs des webhooks sont visibles dans le code source (c'est normal)
- ✅ Les requêtes peuvent être vues dans DevTools → Network (c'est normal)
- ❌ Ne mettez PAS de secrets ou tokens dans les URLs
- ❌ Ne mettez PAS de données sensibles dans les URLs

Si vous avez besoin de secrets:
- Utilisez les variables d'environnement n8n
- Transmettez-les via les en-têtes HTTP
- Ne les mettez JAMAIS dans les URLs

---

## 📞 Support

**Documentation complète:**
- [ARCHITECTURE_SIMPLIFIEE.md](ARCHITECTURE_SIMPLIFIEE.md) - Vue d'ensemble
- [N8N_WORKFLOW_SETUP.md](N8N_WORKFLOW_SETUP.md) - Configuration n8n
- [PROCHAINES_ETAPES.md](PROCHAINES_ETAPES.md) - Checklist

---

**Version**: 5.1.0
**Dernière mise à jour**: 2025-01-15
**Facilité**: ⭐⭐⭐⭐⭐ (Très facile)
