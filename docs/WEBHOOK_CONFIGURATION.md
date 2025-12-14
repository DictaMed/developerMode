# DictaMed - Configuration des Webhooks

## 🎯 Objectif

Ce guide explique comment **changer facilement les URLs des webhooks n8n** sans toucher au reste du code.

---

## 📍 Où Modifier les Webhooks?

**Un seul fichier à modifier:**

```
js/config/webhooks-config.js
```

**NE MODIFIEZ PAS:**
- ❌ `js/core/config.js`
- ❌ `js/components/data-sender.js`
- ❌ `docs/` ou autre documentation

---

## 🔧 Comment Changer les Webhooks

### Étape 1: Ouvrir le fichier
```
js/config/webhooks-config.js
```

### Étape 2: Localiser les URLs

Vous verrez:
```javascript
const WEBHOOKS_CONFIG = {
    // Webhook pour les modes NORMAL et DMI
    default: 'https://n8n.srv1104707.hstgr.cloud/webhook-test/DeveloperMode',

    // Webhook pour le mode TEST
    test: 'https://n8n.srv1104707.hstgr.cloud/webhook-test/DeveloperMode'
};
```

### Étape 3: Remplacer les URLs

**Exemple - Utiliser des webhooks différents pour TEST et NORMAL:**

```javascript
const WEBHOOKS_CONFIG = {
    // Mode NORMAL + DMI
    default: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed',

    // Mode TEST (séparé)
    test: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed-Test'
};
```

### Étape 4: Sauvegarder et Rafraîchir

- Enregistrez le fichier
- Rafraîchissez votre navigateur (`Ctrl+F5` ou `Cmd+Shift+R`)

---

## 📋 Cas d'Usage

### Cas 1: Webhook Unique pour Tous les Modes

```javascript
const WEBHOOKS_CONFIG = {
    default: 'https://votre-n8n.com/webhook/dictamed-unified',
    test: 'https://votre-n8n.com/webhook/dictamed-unified'
};
```

### Cas 2: Webhooks Séparés par Mode

```javascript
const WEBHOOKS_CONFIG = {
    default: 'https://votre-n8n.com/webhook/normal-dmi',
    test: 'https://votre-n8n.com/webhook/test-only'
};
```

### Cas 3: Webhooks par Environnement

```javascript
// Development
const WEBHOOKS_CONFIG = {
    default: 'https://dev-n8n.com/webhook/dictamed',
    test: 'https://dev-n8n.com/webhook/dictamed-test'
};

// Production (changez simplement les domaines)
const WEBHOOKS_CONFIG = {
    default: 'https://prod-n8n.com/webhook/dictamed',
    test: 'https://prod-n8n.com/webhook/dictamed-test'
};
```

---

## 🔍 Vérification

Après avoir changé les webhooks, vérifiez dans la **console du navigateur**:

```javascript
// Ouvrez DevTools (F12)
// Allez à "Console"
// Tapez:

console.log(window.APP_CONFIG.WEBHOOK_ENDPOINTS);

// Vous devez voir:
// {default: "https://...", test: "https://..."}
```

---

## 🚀 Ce Qui Se Passe Quand Vous Changez

1. ✅ Vous modifiez `js/config/webhooks-config.js`
2. ✅ Vous rafraîchissez la page
3. ✅ Le fichier `webhooks-config.js` se charge **après** `config.js`
4. ✅ Il remplit `APP_CONFIG.WEBHOOK_ENDPOINTS` avec les nouvelles URLs
5. ✅ `data-sender.js` utilise ces nouvelles URLs automatiquement

---

## ⚠️ Erreurs Courantes

### Erreur: Webhook ne change pas après sauvegarde

**Solution**: Forcez le rafraîchissement du navigateur
```
Ctrl+F5       (Windows)
Cmd+Shift+R   (Mac)
```

### Erreur: URLs invalides

**Vérifiez que l'URL:**
- ✅ Commence par `https://`
- ✅ N'a pas d'espace blanc
- ✅ Est bien une URL n8n valide
- ✅ Est entre guillemets simples ou doubles

**Exemple valide:**
```javascript
default: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed'
```

**Exemple INVALIDE:**
```javascript
default: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed '  // Espace à la fin!
```

### Erreur: "Webhook endpoint not configured"

**Cause**: Le fichier `webhooks-config.js` ne s'est pas chargé
**Solution**:
1. Vérifiez que `index.html` contient: `<script src="js/config/webhooks-config.js"></script>`
2. Vérifiez que le fichier `js/config/webhooks-config.js` existe
3. Rafraîchissez la page

---

## 📊 Structure du Flux

```
index.html
    ↓
[CHARGE] js/core/config.js (APP_CONFIG.WEBHOOK_ENDPOINTS = null)
    ↓
[CHARGE] js/config/webhooks-config.js (remplit WEBHOOK_ENDPOINTS)
    ↓
[CHARGE] data-sender.js (utilise WEBHOOK_ENDPOINTS)
    ↓
✅ Les webhooks sont prêts à l'emploi
```

---

## 🔐 Sécurité

⚠️ **Important**: Les URLs des webhooks sont visibles dans:
- ✅ Le code source HTML (ce qui est normal)
- ✅ Les requêtes réseau (visible dans DevTools → Network)
- ❌ Ne mettez PAS de secrets ou tokens dans les URLs

Si vous avez besoin de secrets:
- Utilisez des variables d'environnement n8n
- Transmettez-les via les en-têtes HTTP
- Ne les mettez JAMAIS dans les URLs

---

## 📞 Support

**Besoin d'aide?**
- Consultez: [ARCHITECTURE_SIMPLIFIEE.md](ARCHITECTURE_SIMPLIFIEE.md)
- Consultez: [N8N_WORKFLOW_SETUP.md](N8N_WORKFLOW_SETUP.md)
- Consultez: [PROCHAINES_ETAPES.md](PROCHAINES_ETAPES.md)

---

**Version**: 5.0.0
**Dernier mise à jour**: 2025-01-15
**Facilité**: ⭐⭐⭐⭐⭐ (Très facile)
