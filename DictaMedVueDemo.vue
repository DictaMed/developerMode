/**
 * DICTAMED VUE COMPONENTS - Démonstration d'implémentation
 * Système de design selon spécifications UX/UI
 * 
 * Composants Vue.js utilisant les couleurs, dégradés et états DictaMed
 */

<template>
  <!-- ================================
       BOUTONS - Système complet DictaMed
       ================================ -->
  
  <!-- Bouton principal DictaMed -->
  <button 
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
    v-bind="$attrs"
  >
    <span v-if="loading" class="dm-spinner"></span>
    <span v-if="icon" class="dm-icon">{{ icon }}</span>
    <span class="dm-btn-text"><slot></slot></span>
  </button>
</template>

<script>
export default {
  name: 'DictaMedButton',
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => [
        'primary', 'start', 'validate', 'secondary',
        'record', 'pause', 'stop', 'replay', 'recorded'
      ].includes(value)
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    icon: String,
    disabled: Boolean,
    loading: Boolean
  },
  computed: {
    buttonClasses() {
      return [
        'dm-btn',
        `dm-btn-${this.variant}`,
        `dm-btn-${this.size}`,
        {
          'dm-loading': this.loading,
          'dm-disabled': this.disabled
        }
      ];
    }
  },
  methods: {
    handleClick(event) {
      if (!this.disabled && !this.loading) {
        this.$emit('click', event);
      }
    }
  }
};
</script>

<!-- ================================
     BOUTONS DE CONTRÔLE SPÉCIFIQUES
     ================================ -->

<template>
  <DictaMedButton
    :variant="isRecording ? 'record' : 'record'"
    :icon="isRecording ? '⏹️' : '🎙️'"
    :disabled="disabled"
    @click="handleRecord"
  >
    {{ isRecording ? 'Arrêter' : 'Enregistrer' }}
  </DictaMedButton>
</template>

<script>
import DictaMedButton from './DictaMedButton.vue';

export default {
  name: 'RecordButton',
  components: { DictaMedButton },
  props: {
    onRecord: Function,
    isRecording: Boolean,
    disabled: Boolean
  },
  methods: {
    handleRecord() {
      if (this.onRecord) {
        this.onRecord(!this.isRecording);
      }
    }
  }
};
</script>

<template>
  <DictaMedButton
    variant="pause"
    :icon="isPaused ? '▶️' : '⏸️'"
    :disabled="disabled"
    @click="handlePause"
  >
    {{ isPaused ? 'Reprendre' : 'Pause' }}
  </DictaMedButton>
</template>

<script>
import DictaMedButton from './DictaMedButton.vue';

export default {
  name: 'PauseButton',
  components: { DictaMedButton },
  props: {
    onPause: Function,
    isPaused: Boolean,
    disabled: Boolean
  },
  methods: {
    handlePause() {
      if (this.onPause) {
        this.onPause(!this.isPaused);
      }
    }
  }
};
</script>

<template>
  <DictaMedButton
    variant="stop"
    icon="⏹️"
    :disabled="disabled"
    @click="handleStop"
  >
    Stop
  </DictaMedButton>
</template>

<script>
import DictaMedButton from './DictaMedButton.vue';

export default {
  name: 'StopButton',
  components: { DictaMedButton },
  props: {
    onStop: Function,
    disabled: Boolean
  },
  methods: {
    handleStop() {
      if (this.onStop) {
        this.onStop();
      }
    }
  }
};
</script>

<template>
  <DictaMedButton
    variant="replay"
    icon="🔄"
    :disabled="disabled"
    @click="handleReplay"
  >
    Réécouter
  </DictaMedButton>
</template>

<script>
import DictaMedButton from './DictaMedButton.vue';

export default {
  name: 'ReplayButton',
  components: { DictaMedButton },
  props: {
    onReplay: Function,
    disabled: Boolean
  },
  methods: {
    handleReplay() {
      if (this.onReplay) {
        this.onReplay();
      }
    }
  }
};
</script>

<template>
  <DictaMedButton
    variant="recorded"
    icon="✓"
    :style="{ paddingLeft: '48px' }"
    @click="handleDelete"
  >
    {{ children || 'Enregistré' }}
  </DictaMedButton>
</template>

<script>
import DictaMedButton from './DictaMedButton.vue';

export default {
  name: 'RecordedButton',
  components: { DictaMedButton },
  props: {
    onDelete: Function,
    children: String
  },
  methods: {
    handleDelete() {
      if (this.onDelete) {
        this.onDelete();
      }
    }
  }
};
</script>

<!-- ================================
     CARTES - Système DictaMed
     ================================ -->

<template>
  <div :class="cardClasses" v-bind="$attrs">
    <div v-if="title || subtitle" class="dm-card-header">
      <h3 v-if="title" class="dm-card-title">{{ title }}</h3>
      <p v-if="subtitle" class="dm-card-subtitle">{{ subtitle }}</p>
    </div>
    <div class="dm-card-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DictaMedCard',
  props: {
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'hero'].includes(value)
    },
    title: String,
    subtitle: String
  },
  computed: {
    cardClasses() {
      return [
        'dm-card',
        this.variant !== 'default' ? `dm-card-${this.variant}` : ''
      ];
    }
  }
};
</script>

<template>
  <DictaMedCard variant="hero">
    <div style="text-align: center; padding: 24px;">
      <h2 v-if="title" style="color: var(--text-white); margin-bottom: 16px;">{{ title }}</h2>
      <p v-if="subtitle" style="color: rgba(255,255,255,0.9); font-size: 1.125rem; margin-bottom: 24px;">{{ subtitle }}</p>
      <slot></slot>
      <div v-if="$slots.action" style="margin-top: 24px;">
        <slot name="action"></slot>
      </div>
    </div>
  </DictaMedCard>
</template>

<script>
import DictaMedCard from './DictaMedCard.vue';

export default {
  name: 'HeroCard',
  components: { DictaMedCard },
  props: {
    title: String,
    subtitle: String
  }
};
</script>

<!-- ================================
     BANNIÈRES D'ÉTAT - Messages système
     ================================ -->

<template>
  <div :class="bannerClass" role="alert" aria-live="polite">
    <span v-if="icon" class="dm-banner-icon">{{ icon }}</span>
    <div class="dm-banner-content">
      <strong v-if="title" class="dm-banner-title">{{ title }}</strong>
      <span v-if="message" class="dm-banner-message">{{ message }}</span>
      <slot></slot>
    </div>
    <button 
      v-if="dismissible"
      class="dm-banner-dismiss"
      @click="handleDismiss"
      aria-label="Fermer la notification"
    >
      ×
    </button>
  </div>
</template>

<script>
export default {
  name: 'StatusBanner',
  props: {
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    },
    title: String,
    message: String,
    icon: String,
    dismissible: Boolean
  },
  computed: {
    bannerClass() {
      return `dm-banner dm-banner-${this.type}`;
    }
  },
  methods: {
    handleDismiss() {
      this.$emit('dismiss');
    }
  }
};
</script>

<template>
  <StatusBanner 
    type="success" 
    :title="title" 
    :message="message"
    icon="✓"
    :dismissible="dismissible"
    @dismiss="$emit('dismiss')"
    v-bind="$attrs"
  />
</template>

<script>
import StatusBanner from './StatusBanner.vue';

export default {
  name: 'SuccessBanner',
  components: { StatusBanner },
  props: {
    title: String,
    message: String,
    dismissible: Boolean
  }
};
</script>

<template>
  <StatusBanner 
    type="error" 
    :title="title" 
    :message="message"
    icon="❌"
    :dismissible="dismissible"
    @dismiss="$emit('dismiss')"
    v-bind="$attrs"
  />
</template>

<script>
import StatusBanner from './StatusBanner.vue';

export default {
  name: 'ErrorBanner',
  components: { StatusBanner },
  props: {
    title: String,
    message: String,
    dismissible: Boolean
  }
};
</script>

<template>
  <StatusBanner 
    type="warning" 
    :title="title" 
    :message="message"
    icon="⚠️"
    :dismissible="dismissible"
    @dismiss="$emit('dismiss')"
    v-bind="$attrs"
  />
</template>

<script>
import StatusBanner from './StatusBanner.vue';

export default {
  name: 'WarningBanner',
  components: { StatusBanner },
  props: {
    title: String,
    message: String,
    dismissible: Boolean
  }
};
</script>

<!-- ================================
     FORMULAIRES - Éléments d'interface
     ================================ -->

<template>
  <div class="dm-form-group">
    <label v-if="label" class="dm-label">
      {{ label }}
      <span v-if="required" class="dm-required">*</span>
    </label>
    <input
      :type="type"
      :class="inputClass"
      :placeholder="placeholder"
      :value="value"
      :disabled="disabled"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${$attrs.id}-error` : undefined"
      v-bind="$attrs"
      @input="$emit('update:value', $event.target.value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />
    <span v-if="error" class="dm-error-message" :id="`${$attrs.id}-error`">
      {{ error }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'DictaMedInput',
  props: {
    label: String,
    type: {
      type: String,
      default: 'text'
    },
    placeholder: String,
    value: [String, Number],
    error: String,
    required: Boolean,
    disabled: Boolean
  },
  computed: {
    inputClass() {
      return [
        'dm-input',
        this.error ? 'dm-input-error' : '',
        this.disabled ? 'dm-input-disabled' : ''
      ];
    }
  }
};
</script>

<template>
  <div class="dm-form-group">
    <label v-if="label" class="dm-label">
      {{ label }}
      <span v-if="required" class="dm-required">*</span>
    </label>
    <textarea
      :class="textareaClass"
      :placeholder="placeholder"
      :value="value"
      :disabled="disabled"
      :rows="rows"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${$attrs.id}-error` : undefined"
      v-bind="$attrs"
      @input="$emit('update:value', $event.target.value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />
    <span v-if="error" class="dm-error-message" :id="`${$attrs.id}-error`">
      {{ error }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'DictaMedTextarea',
  props: {
    label: String,
    placeholder: String,
    value: String,
    error: String,
    required: Boolean,
    disabled: Boolean,
    rows: {
      type: Number,
      default: 4
    }
  },
  computed: {
    textareaClass() {
      return [
        'dm-textarea',
        this.error ? 'dm-textarea-error' : '',
        this.disabled ? 'dm-textarea-disabled' : ''
      ];
    }
  }
};
</script>

<!-- ================================
     NAVIGATION - Onglets DictaMed
     ================================ -->

<template>
  <div :class="tabsClass" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="`dm-tab ${activeTab === tab.id ? 'dm-tab-active' : ''}`"
      @click="handleTabChange(tab.id)"
      role="tab"
      :aria-selected="activeTab === tab.id"
      :aria-controls="`panel-${tab.id}`"
      :id="`tab-${tab.id}`"
    >
      <span v-if="tab.icon" class="dm-tab-icon">{{ tab.icon }}</span>
      <span class="dm-tab-label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'DictaMedTabs',
  props: {
    tabs: {
      type: Array,
      required: true
    },
    activeTab: String,
    variant: {
      type: String,
      default: 'default'
    }
  },
  computed: {
    tabsClass() {
      return `dm-tabs dm-tabs-${this.variant}`;
    }
  },
  methods: {
    handleTabChange(tabId) {
      this.$emit('tab-change', tabId);
    }
  }
};
</script>

<!-- ================================
     LOGO - Marque DictaMed
     ================================ -->

<template>
  <div class="dm-logo-container">
    <div :class="logoClass">
      <span class="dm-logo-dicta">Dicta</span>
      <span class="dm-logo-med">Med</span>
    </div>
    <p v-if="showSlogan" class="dm-slogan">{{ slogan }}</p>
  </div>
</template>

<script>
export default {
  name: 'DictaMedLogo',
  props: {
    size: {
      type: String,
      default: 'large',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    showSlogan: {
      type: Boolean,
      default: false
    },
    slogan: {
      type: String,
      default: "Où la voix rencontre les chiffres"
    }
  },
  computed: {
    logoClass() {
      return `dm-logo dm-logo-${this.size}`;
    }
  }
};
</script>

<!-- ================================
     COMPOSANT DE DÉMONSTRATION PRINCIPAL
     ================================ -->

<template>
  <div class="dm-demo">
    <header style="text-align: center; margin-bottom: 48px;">
      <DictaMedLogo size="large" :show-slogan="true" />
    </header>
    
    <div class="dm-container">
      <SuccessBanner 
        v-if="showSuccess"
        title="Succès"
        message="Système de design DictaMed chargé avec succès !"
        :dismissible="true"
        @dismiss="showSuccess = false"
      />
      
      <DictaMedTabs 
        :tabs="tabs" 
        :active-tab="activeTab" 
        @tab-change="activeTab = $event"
      />
      
      <div style="margin-top: 32px;">
        <ButtonShowcase v-if="activeTab === 'boutons'" />
        
        <div v-else-if="activeTab === 'cartes'" style="display: grid; gap: 24px;">
          <DictaMedCard title="Carte Standard" subtitle="Style par défaut">
            <p>Contenu de la carte standard avec fond #f8fafc</p>
          </DictaMedCard>
          <HeroCard 
            title="Carte Hero" 
            subtitle="Avec dégradé obligatoire"
          >
            <template #action>
              <DictaMedButton variant="secondary">Action</DictaMedButton>
            </template>
          </HeroCard>
        </div>
        
        <FormShowcase v-else-if="activeTab === 'formulaires'" />
        
        <DictaMedCard v-else-if="activeTab === 'navigation'" title="Navigation par Onglets">
          <DictaMedTabs 
            :tabs="tabs" 
            :active-tab="activeTab" 
            @tab-change="activeTab = $event"
          />
        </DictaMedCard>
      </div>
    </div>
  </div>
</template>

<script>
import DictaMedLogo from './DictaMedLogo.vue';
import DictaMedTabs from './DictaMedTabs.vue';
import DictaMedButton from './DictaMedButton.vue';
import DictaMedCard from './DictaMedCard.vue';
import HeroCard from './HeroCard.vue';
import SuccessBanner from './SuccessBanner.vue';

import ButtonShowcase from './ButtonShowcase.vue';
import FormShowcase from './FormShowcase.vue';

export default {
  name: 'DictaMedVueDemo',
  components: {
    DictaMedLogo,
    DictaMedTabs,
    DictaMedButton,
    DictaMedCard,
    HeroCard,
    SuccessBanner,
    ButtonShowcase,
    FormShowcase
  },
  data() {
    return {
      activeTab: 'boutons',
      showSuccess: true,
      tabs: [
        { id: 'boutons', label: 'Boutons', icon: '🎛️' },
        { id: 'cartes', label: 'Cartes', icon: '📋' },
        { id: 'formulaires', label: 'Formulaires', icon: '📝' },
        { id: 'navigation', label: 'Navigation', icon: '🧭' },
      ]
    };
  }
};
</script>

<!-- ================================
     STYLES CSS POUR VUE COMPONENTS
     ================================ -->

<style scoped>
/* Button Spinner Animation */
.dm-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Demo Container */
.dm-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.dm-container {
  position: relative;
}
</style>