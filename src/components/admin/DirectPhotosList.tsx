import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  role: string;
  created_at: string;
  country: string;
  address: string;
  birth_date: string;
  id_card_photo_url: string;
}

export const DirectPhotosList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; name: string } | null>(null);

  const loadUsers = async () => {
    try {
      console.log('📊 Chargement DIRECT des utilisateurs...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, role, created_at, country, address, birth_date, id_card_photo_url')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur:', error);
        throw error;
      }
      
      console.log('✅ Utilisateurs chargés:', data?.length);
      console.log('📸 Avec photos:', data?.filter(u => u.id_card_photo_url).length);
      
      setUsers(data || []);
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 DirectPhotosList - DÉBUT');
    loadUsers();
  }, []);

  const usersWithPhotos = users.filter(user => user.id_card_photo_url && user.id_card_photo_url.trim() !== '');
  const usersWithoutPhotos = users.filter(user => !user.id_card_photo_url || user.id_card_photo_url.trim() === '');

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>🔄 Chargement...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', border: '2px solid #4CAF50', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2E7D32' }}>
          📊 Statistiques photos d'identité
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '6px' }}>
            <strong>Total utilisateurs:</strong> {users.length}
          </div>
          <div style={{ padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '6px' }}>
            <strong>Avec photos:</strong> {usersWithPhotos.length}
          </div>
          <div style={{ padding: '10px', backgroundColor: '#ffe8e8', borderRadius: '6px' }}>
            <strong>Sans photos:</strong> {usersWithoutPhotos.length}
          </div>
        </div>
      </div>

      {usersWithPhotos.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2E7D32', marginBottom: '15px' }}>
            ✅ Utilisateurs avec photos d'identité ({usersWithPhotos.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {usersWithPhotos.map((user) => (
              <div key={user.id} style={{ 
                border: '2px solid #4CAF50', 
                borderRadius: '8px', 
                padding: '15px', 
                backgroundColor: '#f9f9f9' 
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>{user.full_name}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    📞 {user.phone} | 🌍 {user.country}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    {new Date(user.created_at) >= new Date('2025-08-20') ? '🆕 NOUVEAU' : '📅 ANCIEN'}
                    {' '}({new Date(user.created_at).toLocaleDateString('fr-FR')})
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={user.id_card_photo_url} 
                    alt={`Photo d'identité de ${user.full_name}`}
                    style={{ 
                      width: '100%', 
                      maxWidth: '200px',
                      height: '120px', 
                      objectFit: 'cover', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      border: '1px solid #ddd'
                    }}
                    onClick={() => setSelectedPhoto({
                      url: user.id_card_photo_url,
                      name: user.full_name || 'Utilisateur'
                    })}
                    onError={(e) => {
                      console.error('❌ Erreur image:', user.id_card_photo_url);
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('✅ Photo chargée:', user.full_name);
                    }}
                  />
                  <button
                    onClick={() => setSelectedPhoto({
                      url: user.id_card_photo_url,
                      name: user.full_name || 'Utilisateur'
                    })}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    👁️ Agrandir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {usersWithoutPhotos.length > 0 && (
        <div>
          <h3 style={{ color: '#d32f2f', marginBottom: '15px' }}>
            ❌ Utilisateurs sans photos d'identité ({usersWithoutPhotos.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
            {usersWithoutPhotos.map((user) => (
              <div key={user.id} style={{ 
                border: '2px solid #f44336', 
                borderRadius: '6px', 
                padding: '10px', 
                backgroundColor: '#ffeaea' 
              }}>
                <strong>{user.full_name}</strong>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  📞 {user.phone} | 🌍 {user.country}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>
                  {new Date(user.created_at) >= new Date('2025-08-20') ? '🆕 NOUVEAU' : '📅 ANCIEN'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal pour agrandir les photos */}
      {selectedPhoto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: 0 }}>
                Photo d'identité - {selectedPhoto.name}
              </h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                ✕
              </button>
            </div>
            
            <img 
              src={selectedPhoto.url} 
              alt={`Photo d'identité - ${selectedPhoto.name}`}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh', 
                objectFit: 'contain',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
              <button
                onClick={() => window.open(selectedPhoto.url, '_blank')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Ouvrir dans un nouvel onglet
              </button>
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ccc',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};