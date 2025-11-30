# DictaMed - Guide Complet du Système de Design

## 📋 Vue d'ensemble

Ce document présente l'implémentation complète de la charte graphique DictaMed selon les spécifications UX/UI détaillées fournies. Le système de design comprend les couleurs, dégradés, états, et règles d'accessibilité spécifiées.

---

## 🎨 Palette de Couleurs Principales

### Couleurs de Marque DictaMed
- **Bleu principal** (lettre "D"): `#2563eb` 
- **Vert principal** (lettre "M"): `#10b981`
- **Texte principal**: `#1e293b`
- **Texte secondaire**: `#64748b`
- **Bordures des éléments**: `#e2e8f0`
- **Fond des cartes**: `#f8fafc`

### Couleurs Fonctionnelles - Boutons de Contrôle
- **Bouton "Enregistrer"**: Dégradé `#ef4444` → `#dc2626`
- **Bouton "Pause"**: Dégradé `#f59e0b` → `#d97706`
- **Bouton "Stop"**: Dégradé `#64748b` → `#475569`
- **Bouton "Réécouter"**: Dégradé `#06b6d4` → `#0891b2`
- **Bouton "Enregistré"**: Dégradé `#10b981` → `#059669`

---

## 🌈 Dégradés Obligatoires

### Dégradé Principal (Fond d'écran)
```css
--gradient-hero: linear-gradient(90deg, #2563eb 0%, #1d4ed8 50%, #10b981 100%);
```

### Dégradé des Boutons d'Action Principaux
```css
--gradient-primary: linear-gradient(135deg, #2563eb 0%, #10b981 100%);
```

### Utilisation
- **Sections hero**: Fond d'écran principal avec dégradé 90°
- **Pages d'accueil**: Arrière-plan des sections importantes
- **Cartes à fond clair**: Contexte hero ou appel à l'action

---

## 🔘 Système de Boutons

### Boutons Principaux (Appels à l'action)
```html
<button class="btn btn-primary">Démarrer</button>
<button class="btn btn-start">Enregistrer</button>
<button class="btn btn-validate">Valider</button>
```

### Boutons de Contrôle Spécifiques
```html
<button class="btn btn-record">Enregistrer</button>
<button class="btn btn-pause">Pause</button>
<button class="btn btn-stop">Stop</button>
<button class="btn btn-replay">Réécouter</button>
<button class="btn btn-recorded">Enregistré</button>
```

### Propriétés CSS Obligatoires
- **Hauteur minimale**: 44px sur tous les écrans
- **Border-radius**: 8px
- **Padding**: 12px / 24px
- **Couleur de texte**: Blanc (`#ffffff`) sur dégradés
- **Au survol**: Luminosité +10% et ombre douce
- **Au focus**: Outline 2px en `#2563eb`

---

## 📋 Cartes et Composants

### Carte Standard
```html
<div class="card">
    <h3>Titre de la carte</h3>
    <p>Contenu de la carte</p>
</div>
```

**Propriétés:**
- Fond: `#f8fafc`
- Bordure: 1px `#e2e8f0`
- Border-radius: 12px
- Ombre: `0 4px 12px rgba(0,0,0,0.08)`
- Hauteur de bordure supérieure: 4px en `#2563eb`

### Carte Hero (avec dégradé)
```html
<div class="card-hero">
    <h2>Titre Hero</h2>
    <p>Contenu avec dégradé de fond</p>
</div>
```

---

## 📢 Messages Système et États

### Bannière de Succès
```html
<div class="banner-success">
    <strong>✅ Succès:</strong> Opération terminée avec succès !
</div>
```

### Bannière d'Erreur
```html
<div class="banner-error">
    <strong>❌ Erreur:</strong> Une erreur est survenue.
</div>
```

### Bannière d'Avertissement
```html
<div class="banner-warning">
    <strong>⚠️ Avertissement:</strong> Attention requise.
</div>
```

---

## 📝 Typographie

### Police Principale
- **Police**: Inter, system-ui, sans-serif
- **Hiérarchie des tailles**:
  - H1: 2.5rem (40px)
  - H2: 2rem (32px)  
  - H3: 1.5rem (24px)
  - Texte de corps: 1rem (16px)
  - Petite taille: 0.875rem (14px)

### Espacement
- **Système de grille**: Multiples de 8px (8, 16, 24, 32, 40, 48px)
- **Cohérence**: Toutes les marges et padding respectent ce système

---

## 🧭 Navigation

### Onglets
```html
<div class="nav-tabs">
    <button class="tab-btn active">Onglet Actif</button>
    <button class="tab-btn">Onglet 2</button>
</div>
```

**Propriétés:**
- Indicateur d'élément actif: Bordure inférieure 3px en `#2563b`
- État normal: Texte en `#64748b`
- État actif: Texte en `#1e293b`
- Hauteur minimale: 44px

---

## 🔤 Logo et Icônes

### Logo DictaMed
```html
<div class="logo">
    <span class="logo-dicta">Dicta</span><span class="logo-med">Med</span>
</div>
```

**Couleurs des lettres:**
- **D** (Dicta): `#2563eb` (bleu principal)
- **M** (Med): `#10b981` (vert principal)

### Icônes de Marque
```html
<span class="icon-brand-d">D</span>
<span class="icon-brand-m">M</span>
```

---

## 📱 Design Responsive

### Breakpoints
- **Petit écran**: `< 600px`
- **Écran moyen**: `600px - 960px`
- **Grand écran**: `> 960px`

### Adaptations Mobiles
- **Fond dégradé**: Diagonal (45°) sur petits écrans
- **Boutons**: Pleine largeur, hauteur minimum 44px maintenue
- **Cartes**: Padding réduit à 24px
- **Typographie**: Tailles adaptées (H1: 2rem, H2: 1.75rem, H3: 1.375rem)

---

## ♿ Accessibilité et Contraste

### Ratios de Contraste Respectés
- **Texte de corps sur fond blanc**: Minimum 4.5:1
- **Texte de petite taille**: Minimum 7:1
- **Texte sur dégradés**: Blanc (`#ffffff`) garanti

### Focus et Navigation
- **Focus visible**: Outline 2px en `#2563eb` avec offset
- **Navigation clavier**: Support complet
- **Screen readers**: Classes `.sr-only` disponibles

### Préférences Utilisateur
- **Contraste élevé**: Support media queries `prefers-contrast: high`
- **Animations réduites**: Respect des préférences motion

---

## 🛠️ Implémentation Technique

### Variables CSS Personnalisées
```css
:root {
  --primary-blue: #2563eb;
  --primary-green: #10b981;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --bg-card: #f8fafc;
  
  --gradient-hero: linear-gradient(90deg, #2563eb 0%, #1d4ed8 50%, #10b981 100%);
  --gradient-primary: linear-gradient(135deg, #2563eb 0%, #10b981 100%);
  --gradient-record: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  /* ... autres dégradés */
}
```

### Intégration
```html
<!-- Dans votre HTML -->
<link rel="stylesheet" href="dictamed-design-system.css">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

---

## ⚛️ Composants React

### Utilisation de Base
```jsx
import { DictaMedButton, DictaMedCard, SuccessBanner } from './DictaMedReactDemo';

function MonComposant() {
  return (
    <div>
      <SuccessBanner 
        title="Succès"
        message="Opération réussie !"
      />
      <DictaMedCard title="Ma Carte">
        <DictaMedButton variant="primary" icon="🚀">
          Démarrer
        </DictaMedButton>
      </DictaMedCard>
    </div>
  );
}
```

### Boutons de Contrôle
```jsx
<RecordButton 
  onRecord={handleRecord}
  isRecording={isRecording}
  disabled={disabled}
/>

<PauseButton 
  onPause={handlePause}
  isPaused={paused}
  disabled={!recording}
/>
```

---

## 💚 Composants Vue.js

### Utilisation de Base
```vue
<template>
  <div>
    <SuccessBanner 
      title="Succès"
      message="Opération réussie !"
      :dismissible="true"
      @dismiss="hideBanner"
    />
    <DictaMedCard title="Ma Carte">
      <DictaMedButton variant="primary" icon="🚀">
        Démarrer
      </DictaMedButton>
    </DictaMedCard>
  </div>
</template>

<script>
import { DictaMedButton, DictaMedCard, SuccessBanner } from './DictaMedVueDemo.vue';

export default {
  components: { DictaMedButton, DictaMedCard, SuccessBanner },
  methods: {
    hideBanner() {
      // Logique pour masquer la bannière
    }
  }
};
</script>
```

---

## 📁 Structure des Fichiers

```
dictamed-design-system/
├── dictamed-design-system.css    # Système CSS complet
├── dictamed-design-demo.html     # Démonstration HTML
├── DictaMedReactDemo.jsx         # Composants React
├── DictaMedVueDemo.vue          # Composants Vue.js
└── DICTAMED_DESIGN_SYSTEM_GUIDE.md # Ce guide
```

---

## 🎯 Checklist d'Implémentation

### ✅ Couleurs et Dégradés
- [x] Variables CSS avec couleurs exactes
- [x] Dégradé hero 90° implémenté
- [x] Dégradés boutons de contrôle
- [x] États de focus et hover
- [x] Logo avec couleurs de marque

### ✅ Composants UI
- [x] Système de boutons complet
- [x] Cartes standard et hero
- [x] Bannières d'état
- [x] Navigation par onglets
- [x] Formulaires accessibles

### ✅ Accessibilité
- [x] Ratios de contraste WCAG 2.1 AA
- [x] Focus visible
- [x] Navigation clavier
- [x] Screen reader support
- [x] Responsive design

### ✅ Documentation
- [x] Guide complet d'utilisation
- [x] Exemples HTML
- [x] Composants React
- [x] Composants Vue.js
- [x] Variables CSS documentées

---

## 🔄 Tests et Validation

### Tests de Contraste
- Utiliser des outils comme WebAIM Color Contrast Checker
- Vérifier tous les états: default, hover, focus, disabled
- Tester avec les thèmes système (clair/sombre)

### Tests Responsives
- Vérifier sur tous les breakpoints (< 600px, 600-960px, > 960px)
- Tester les interactions tactiles sur mobile
- Valider l'accessibilité sur tous les écrans

### Tests d'Accessibilité
- Navigation clavier complète
- Compatibilité screen readers
- Préférences utilisateur (contraste, motion)

---

## 🚀 Déploiement

### Étapes d'Intégration

1. **Intégrer les styles CSS**
   ```bash
   # Copier les fichiers de design system
   cp dictamed-design-system.css /assets/css/
   ```

2. **Mettre à jour l'HTML**
   ```html
   <link rel="stylesheet" href="/assets/css/dictamed-design-system.css">
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
   ```

3. **Migrer les composants existants**
   - Remplacer les classes anciennes par les nouvelles
   - Utiliser les nouveaux dégradés
   - Mettre à jour les couleurs de marque

4. **Tester sur l'environnement de production**
   - Vérifier tous les browsers supportés
   - Tester les performances
   - Valider l'accessibilité

---

## 📞 Support

Pour toute question relative à l'implémentation de ce système de design, consultez:

- La documentation technique ci-dessus
- Les exemples dans `dictamed-design-demo.html`
- Les composants React dans `DictaMedReactDemo.jsx`
- Les composants Vue.js dans `DictaMedVueDemo.vue`

---

**© 2025 DictaMed - Système de Design conforme aux spécifications UX/UI**
*Charte graphique complète avec accessibilité WCAG 2.1 AA et design responsive mobile-first*