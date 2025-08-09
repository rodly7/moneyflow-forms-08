
import React from 'react';

const SimpleAgentsTab = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>
        Gestion des Agents
      </h2>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px' 
      }}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
          Actions disponibles
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'white', 
            borderRadius: '6px',
            border: '1px solid #ddd'
          }}>
            <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>Approbation d'agents</h4>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Approuver ou rejeter les demandes d'agents
            </p>
            <button style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '8px 15px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Gérer les demandes
            </button>
          </div>

          <div style={{ 
            padding: '15px', 
            backgroundColor: 'white', 
            borderRadius: '6px',
            border: '1px solid #ddd'
          }}>
            <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>Recharge d'agents</h4>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Créditer le solde des agents
            </p>
            <button style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '8px 15px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Recharger agents
            </button>
          </div>

          <div style={{ 
            padding: '15px', 
            backgroundColor: 'white', 
            borderRadius: '6px',
            border: '1px solid #ddd'
          }}>
            <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>Performance</h4>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Voir les statistiques de performance
            </p>
            <button style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              padding: '8px 15px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Voir rapports
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
          Liste des agents récents
        </h3>
        <p style={{ color: '#666' }}>
          Les fonctionnalités de gestion d'agents seront disponibles prochainement.
        </p>
      </div>
    </div>
  );
};

export default SimpleAgentsTab;
