
import React from 'react';

const SimpleSettingsTab = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>
        Paramètres Système
      </h2>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px' 
      }}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
          Configuration générale
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'white', 
            borderRadius: '6px',
            border: '1px solid #ddd'
          }}>
            <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>Frais de transaction</h4>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>
                Frais nationaux (%)
              </label>
              <input 
                type="number" 
                defaultValue="5" 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }} 
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>
                Frais internationaux (%)
              </label>
              <input 
                type="number" 
                defaultValue="7" 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }} 
              />
            </div>
            <button style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '8px 15px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Sauvegarder
            </button>
          </div>

          <div style={{ 
            padding: '15px', 
            backgroundColor: 'white', 
            borderRadius: '6px',
            border: '1px solid #ddd'
          }}>
            <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>Limites de transaction</h4>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>
                Limite quotidienne utilisateur (FCFA)
              </label>
              <input 
                type="number" 
                defaultValue="500000" 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }} 
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>
                Limite quotidienne agent (FCFA)
              </label>
              <input 
                type="number" 
                defaultValue="2000000" 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }} 
              />
            </div>
            <button style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '8px 15px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Sauvegarder
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
          Maintenance système
        </h3>
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          borderRadius: '6px',
          border: '1px solid #ffeaa7'
        }}>
          <p style={{ margin: 0, color: '#856404' }}>
            Les paramètres système avancés seront disponibles prochainement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleSettingsTab;
