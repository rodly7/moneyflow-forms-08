
import React from 'react';

const SimpleAdvancedTab = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>
        Dashboard Avancé
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#7c3aed' }}>
            📊 Rapports Avancés
          </h3>
          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>Génération de rapports détaillés</p>
            <button 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#7c3aed', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Rapport Hebdomadaire
            </button>
            <button 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#059669', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Rapport Mensuel
            </button>
          </div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#6b7280' }}>
            ⚙️ Paramètres Système
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px' }}>Limites de Transaction</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Utilisateur quotidien</span>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>500,000 FCFA</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Agent quotidien</span>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>2,000,000 FCFA</div>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px' }}>Frais de Transaction</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>National</span>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>1%</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>International</span>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>4.5-6.5%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAdvancedTab;
