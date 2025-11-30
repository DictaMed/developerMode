/**
 * DICTAMED REACT COMPONENTS - Démonstration d'implémentation
 * Système de design selon spécifications UX/UI
 * 
 * Composants React utilisant les couleurs, dégradés et états DictaMed
 */

import React, { useState } from 'react';
import './DictaMedReact.css'; // Importer les styles du système de design

// ================================
// BOUTONS - Système complet DictaMed
// ================================

export const DictaMedButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  icon = null,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseClass = 'dm-btn';
  const variantClass = `dm-btn-${variant}`;
  const sizeClass = `dm-btn-${size}`;
  const loadingClass = loading ? 'dm-loading' : '';
  const disabledClass = disabled ? 'dm-disabled' : '';
  
  const classes = [baseClass, variantClass, sizeClass, loadingClass, disabledClass, className]
    .filter(Boolean)
    .join(' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="dm-spinner"></span>}
      {icon && <span className="dm-icon">{icon}</span>}
      <span className="dm-btn-text">{children}</span>
    </button>
  );
};

// Boutons de contrôle spécifiques selon spécifications
export const RecordButton = ({ onRecord, isRecording, disabled }) => {
  return (
    <DictaMedButton
      variant="record"
      onClick={onRecord}
      disabled={disabled}
      icon={isRecording ? "⏹️" : "🎙️"}
    >
      {isRecording ? "Arrêter" : "Enregistrer"}
    </DictaMedButton>
  );
};

export const PauseButton = ({ onPause, isPaused, disabled }) => {
  return (
    <DictaMedButton
      variant="pause"
      onClick={onPause}
      disabled={disabled}
      icon={isPaused ? "▶️" : "⏸️"}
    >
      {isPaused ? "Reprendre" : "Pause"}
    </DictaMedButton>
  );
};

export const StopButton = ({ onStop, disabled }) => {
  return (
    <DictaMedButton
      variant="stop"
      onClick={onStop}
      disabled={disabled}
      icon="⏹️"
    >
      Stop
    </DictaMedButton>
  );
};

export const ReplayButton = ({ onReplay, disabled }) => {
  return (
    <DictaMedButton
      variant="replay"
      onClick={onReplay}
      disabled={disabled}
      icon="🔄"
    >
      Réécouter
    </DictaMedButton>
  );
};

export const RecordedButton = ({ onDelete, children = "Enregistré" }) => {
  return (
    <DictaMedButton
      variant="recorded"
      onClick={onDelete}
      icon="✓"
      style={{ paddingLeft: '48px' }}
    >
      {children}
    </DictaMedButton>
  );
};

// ================================
// CARTES - Système DictaMed
// ================================

export const DictaMedCard = ({ 
  children, 
  variant = 'default', 
  title, 
  subtitle,
  className = '',
  ...props 
}) => {
  const baseClass = 'dm-card';
  const variantClass = variant !== 'default' ? `dm-card-${variant}` : '';
  
  const classes = [baseClass, variantClass, className]
    .filter(Boolean)
    .join(' ');
  
  return (
    <div className={classes} {...props}>
      {(title || subtitle) && (
        <div className="dm-card-header">
          {title && <h3 className="dm-card-title">{title}</h3>}
          {subtitle && <p className="dm-card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="dm-card-content">
        {children}
      </div>
    </div>
  );
};

export const HeroCard = ({ title, subtitle, children, action }) => {
  return (
    <DictaMedCard variant="hero">
      <div style={{ textAlign: 'center', padding: '24px' }}>
        {title && <h2 style={{ color: 'var(--text-white)', marginBottom: '16px' }}>{title}</h2>}
        {subtitle && <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.125rem', marginBottom: '24px' }}>{subtitle}</p>}
        {children}
        {action && (
          <div style={{ marginTop: '24px' }}>
            {action}
          </div>
        )}
      </div>
    </DictaMedCard>
  );
};

// ================================
// BANNIÈRES D'ÉTAT - Messages système
// ================================

export const StatusBanner = ({ 
  type = 'info', 
  title, 
  message, 
  icon,
  dismissible = false,
  onDismiss 
}) => {
  const bannerClass = `dm-banner dm-banner-${type}`;
  
  return (
    <div className={bannerClass} role="alert" aria-live="polite">
      {icon && <span className="dm-banner-icon">{icon}</span>}
      <div className="dm-banner-content">
        {title && <strong className="dm-banner-title">{title}</strong>}
        {message && <span className="dm-banner-message">{message}</span>}
      </div>
      {dismissible && (
        <button 
          className="dm-banner-dismiss"
          onClick={onDismiss}
          aria-label="Fermer la notification"
        >
          ×
        </button>
      )}
    </div>
  );
};

// Bannières spécifiques selon spécifications
export const SuccessBanner = ({ title, message, ...props }) => (
  <StatusBanner 
    type="success" 
    title={title} 
    message={message}
    icon="✓"
    {...props} 
  />
);

export const ErrorBanner = ({ title, message, ...props }) => (
  <StatusBanner 
    type="error" 
    title={title} 
    message={message}
    icon="❌"
    {...props} 
  />
);

export const WarningBanner = ({ title, message, ...props }) => (
  <StatusBanner 
    type="warning" 
    title={title} 
    message={message}
    icon="⚠️"
    {...props} 
  />
);

// ================================
// FORMULAIRES - Éléments d'interface
// ================================

export const DictaMedInput = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const inputClass = `dm-input ${error ? 'dm-input-error' : ''} ${disabled ? 'dm-input-disabled' : ''} ${className}`;
  
  return (
    <div className="dm-form-group">
      {label && (
        <label className="dm-label">
          {label}
          {required && <span className="dm-required">*</span>}
        </label>
      )}
      <input
        type={type}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <span className="dm-error-message" id={`${props.id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
};

export const DictaMedTextarea = ({ 
  label, 
  placeholder, 
  value, 
  onChange,
  error,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  ...props 
}) => {
  const textareaClass = `dm-textarea ${error ? 'dm-textarea-error' : ''} ${disabled ? 'dm-textarea-disabled' : ''} ${className}`;
  
  return (
    <div className="dm-form-group">
      {label && (
        <label className="dm-label">
          {label}
          {required && <span className="dm-required">*</span>}
        </label>
      )}
      <textarea
        className={textareaClass}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <span className="dm-error-message" id={`${props.id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
};

// ================================
// NAVIGATION - Onglets DictaMed
// ================================

export const DictaMedTabs = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  variant = 'default',
  className = '' 
}) => {
  const tabsClass = `dm-tabs dm-tabs-${variant} ${className}`;
  
  return (
    <div className={tabsClass} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`dm-tab ${activeTab === tab.id ? 'dm-tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
        >
          {tab.icon && <span className="dm-tab-icon">{tab.icon}</span>}
          <span className="dm-tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// ================================
// LOGO - Marque DictaMed
// ================================

export const DictaMedLogo = ({ 
  size = 'large', 
  showSlogan = false,
  slogan = "Où la voix rencontre les chiffres",
  className = '' 
}) => {
  const logoClass = `dm-logo dm-logo-${size} ${className}`;
  
  return (
    <div className="dm-logo-container">
      <div className={logoClass}>
        <span className="dm-logo-dicta">Dicta</span>
        <span className="dm-logo-med">Med</span>
      </div>
      {showSlogan && (
        <p className="dm-slogan">{slogan}</p>
      )}
    </div>
  );
};

// ================================
// COMPOSANTS DE DÉMONSTRATION
// ================================

export const ButtonShowcase = () => {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  
  return (
    <DictaMedCard title="Démonstration des Boutons">
      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Boutons principaux */}
        <div>
          <h4>Boutons Principaux</h4>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <DictaMedButton variant="primary" icon="🚀">Démarrer</DictaMedButton>
            <DictaMedButton variant="start" icon="💾">Enregistrer</DictaMedButton>
            <DictaMedButton variant="validate" icon="✅">Valider</DictaMedButton>
            <DictaMedButton variant="secondary">Annuler</DictaMedButton>
          </div>
        </div>
        
        {/* Boutons de contrôle */}
        <div>
          <h4>Boutons de Contrôle</h4>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <RecordButton 
              onRecord={() => setRecording(!recording)}
              isRecording={recording}
            />
            <PauseButton 
              onPause={() => setPaused(!paused)}
              isPaused={paused}
              disabled={!recording}
            />
            <StopButton 
              onStop={() => {
                setRecording(false);
                setPaused(false);
              }}
              disabled={!recording && !paused}
            />
            <ReplayButton />
            <RecordedButton />
          </div>
        </div>
      </div>
    </DictaMedCard>
  );
};

export const StatusBannerShowcase = () => {
  const [visible, setVisible] = useState(true);
  
  if (!visible) return null;
  
  return (
    <div style={{ marginBottom: '24px' }}>
      <SuccessBanner 
        title="Succès"
        message="Opération terminée avec succès !"
        dismissible
        onDismiss={() => setVisible(false)}
      />
    </div>
  );
};

export const FormShowcase = () => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  return (
    <DictaMedCard title="Démonstration Formulaire">
      <form onSubmit={(e) => e.preventDefault()}>
        <DictaMedInput
          label="Nom"
          value={formData.nom}
          onChange={(e) => handleInputChange('nom', e.target.value)}
          error={errors.nom}
          placeholder="Votre nom"
        />
        
        <DictaMedInput
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
          placeholder="votre@email.com"
        />
        
        <DictaMedTextarea
          label="Message"
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          error={errors.message}
          placeholder="Votre message..."
          rows={4}
        />
        
        <div style={{ marginTop: '24px' }}>
          <DictaMedButton type="submit" variant="primary" icon="📤">
            Envoyer
          </DictaMedButton>
        </div>
      </form>
    </DictaMedCard>
  );
};

// ================================
// COMPOSANT PRINCIPAL DE DÉMONSTRATION
// ================================

export const DictaMedReactDemo = () => {
  const [activeTab, setActiveTab] = useState('boutons');
  
  const tabs = [
    { id: 'boutons', label: 'Boutons', icon: '🎛️' },
    { id: 'cartes', label: 'Cartes', icon: '📋' },
    { id: 'formulaires', label: 'Formulaires', icon: '📝' },
    { id: 'navigation', label: 'Navigation', icon: '🧭' },
  ];
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'boutons':
        return <ButtonShowcase />;
      case 'cartes':
        return (
          <div style={{ display: 'grid', gap: '24px' }}>
            <DictaMedCard title="Carte Standard" subtitle="Style par défaut">
              <p>Contenu de la carte standard avec fond #f8fafc</p>
            </DictaMedCard>
            <HeroCard 
              title="Carte Hero" 
              subtitle="Avec dégradé obligatoire"
              action={<DictaMedButton variant="secondary">Action</DictaMedButton>}
            />
          </div>
        );
      case 'formulaires':
        return <FormShowcase />;
      case 'navigation':
        return (
          <DictaMedCard title="Navigation par Onglets">
            <DictaMedTabs 
              tabs={tabs} 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
            />
          </DictaMedCard>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="dm-demo">
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <DictaMedLogo size="large" showSlogan />
      </header>
      
      <div className="dm-container">
        <StatusBannerShowcase />
        <DictaMedTabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
        {renderTabContent()}
      </div>
    </div>
  );
};

export default DictaMedReactDemo;