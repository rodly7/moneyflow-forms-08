
import React, { useState } from 'react';

const SimpleSettingsTab = () => {
  const [settings, setSettings] = useState({
    transfersEnabled: true,
    withdrawalsEnabled: true,
    depositsEnabled: true,
    agentValidationRequired: true,
    maintenanceMode: false,
    autoNotifications: true,
    maxDailyTransfer: 500000,
    maxDailyAgent: 2000000,
    transactionFee: 1,
    internationalFee: 4.5
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    alert('Paramètre modifié avec succès');
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    alert('Tous les paramètres ont été sauvegardés');
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>
        ⚙️ Paramètres Système
      </h2>

      <div style={{ display: 'grid', gap: '25px' }}>
        {/* Services de Transaction */}
        <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2563eb', marginBottom: '15px' }}>
            🔄 Services de Transaction
          </h3>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <div>
                <strong style={{ color: '#374151' }}>Transferts d'argent</strong>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '5px 0 0 0' }}>
                  Activer/désactiver les transferts entre utilisateurs
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input
                  type="checkbox"
                  checked={settings.transfersEnabled}
                  onChange={() => handleToggle('transfersEnabled')}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.transfersEnabled ? '#22c55e' : '#ccc',
                  transition: '0.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: settings.transfersEnabled ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <div>
                <strong style={{ color: '#374151' }}>Retraits agents</strong>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '5px 0 0 0' }}>
                  Permettre les retraits chez les agents
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input
                  type="checkbox"
                  checked={settings.withdrawalsEnabled}
                  onChange={() => handleToggle('withdrawalsEnabled')}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.withdrawalsEnabled ? '#22c55e' : '#ccc',
                  transition: '0.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: settings.withdrawalsEnabled ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <div>
                <strong style={{ color: '#374151' }}>Dépôts mobiles</strong>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '5px 0 0 0' }}>
                  Autoriser les dépôts via mobile
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input
                  type="checkbox"
                  checked={settings.depositsEnabled}
                  onChange={() => handleToggle('depositsEnabled')}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.depositsEnabled ? '#22c55e' : '#ccc',
                  transition: '0.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: settings.depositsEnabled ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Limites de Transaction */}
        <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#16a34a', marginBottom: '15px' }}>
            💰 Limites de Transaction
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '5px', color: '#374151' }}>
                Limite quotidienne utilisateur (FCFA)
              </label>
              <input
                type="number"
                value={settings.maxDailyTransfer}
                onChange={(e) => handleInputChange('maxDailyTransfer', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '5px', color: '#374151' }}>
                Limite quotidienne agent (FCFA)
              </label>
              <input
                type="number"
                value={settings.maxDailyAgent}
                onChange={(e) => handleInputChange('maxDailyAgent', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '5px', color: '#374151' }}>
                Frais de transaction nationale (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.transactionFee}
                onChange={(e) => handleInputChange('transactionFee', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '5px', color: '#374151' }}>
                Frais de transaction internationale (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.internationalFee}
                onChange={(e) => handleInputChange('internationalFee', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions Critiques */}
        <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626', marginBottom: '15px' }}>
            ⚠️ Actions Critiques
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => alert('Fonction de verrouillage système - Bientôt disponible')}
              style={{
                padding: '10px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔒 Verrouiller le système
            </button>
            <button
              onClick={() => alert('Fonction de sauvegarde - Bientôt disponible')}
              style={{
                padding: '10px 16px',
                backgroundColor: '#ea580c',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              💾 Sauvegarder la base
            </button>
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div style={{ textAlign: 'right', marginTop: '25px' }}>
        <button
          onClick={saveSettings}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          💾 Sauvegarder tous les paramètres
        </button>
      </div>
    </div>
  );
};

export default SimpleSettingsTab;
