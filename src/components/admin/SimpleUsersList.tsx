
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  role: string;
  is_verified: boolean;
  created_at: string;
  country: string;
  address: string;
  birth_date: string;
  id_card_photo_url: string;
}

export const SimpleUsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserPhoto, setSelectedUserPhoto] = useState<{ url: string; name: string; type: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadUsers = async (isAutoRefresh = false) => {
    try {
      console.log('🚀 DÉBUT loadUsers - Récupération photos id-cards');
      
      if (isAutoRefresh) {
        setRefreshing(true);
      }
      
      // Synchroniser les photos d'identité depuis le bucket id-cards
      console.log('🔄 Synchronisation du bucket id-cards...');
      try {
        await supabase.rpc('sync_agent_identity_photos');
        console.log('✅ Synchronisation id-cards terminée');
      } catch (syncError) {
        console.warn('⚠️ Erreur synchronisation id-cards (continuons):', syncError);
      }
      
      console.log('📊 REQUÊTE: Chargement TOUS utilisateurs avec photos id-cards...');
      
      // Requête pour récupérer TOUS les utilisateurs avec leurs photos d'identité
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, role, is_verified, created_at, country, address, birth_date, id_card_photo_url')
        .order('created_at', { ascending: false });

      console.log('📡 RÉPONSE profiles - data:', !!data, 'error:', !!error);

      if (error) {
        console.error('❌ ERREUR chargement profiles:', error);
        throw error;
      }
      
      const totalUsers = data?.length || 0;
      const usersWithPhotos = data?.filter(u => u.id_card_photo_url && u.id_card_photo_url.trim() !== '').length || 0;
      
      console.log('📊 STATISTIQUES CHARGEMENT:');
      console.log('   👥 Total utilisateurs:', totalUsers);
      console.log('   📸 Avec photos id-cards:', usersWithPhotos);
      
      // Séparer nouveaux et anciens utilisateurs
      const cutoffDate = new Date('2025-08-20');
      const nouveauxUtilisateurs = data?.filter(u => new Date(u.created_at) >= cutoffDate) || [];
      const anciensUtilisateurs = data?.filter(u => new Date(u.created_at) < cutoffDate) || [];
      
      const nouveauxAvecPhotos = nouveauxUtilisateurs.filter(u => u.id_card_photo_url).length;
      const anciensAvecPhotos = anciensUtilisateurs.filter(u => u.id_card_photo_url).length;
      
      console.log('📈 NOUVEAUX utilisateurs (≥2025-08-20):', nouveauxUtilisateurs.length);
      console.log('   📷 Nouveaux avec photos:', nouveauxAvecPhotos);
      console.log('📊 ANCIENS utilisateurs (<2025-08-20):', anciensUtilisateurs.length);
      console.log('   📷 Anciens avec photos:', anciensAvecPhotos);
      
      // Afficher les détails de chaque utilisateur avec photo
      console.log('🔍 DÉTAIL DES PHOTOS:');
      data?.forEach((user, index) => {
        const isNouveau = new Date(user.created_at) >= cutoffDate;
        const typeUser = isNouveau ? '🆕 NOUVEAU' : '📅 ANCIEN';
        
        if (user.id_card_photo_url) {
          console.log(`${typeUser} [${index}] ${user.full_name}`);
          console.log(`   📷 URL: ${user.id_card_photo_url}`);
          console.log(`   📅 Créé: ${user.created_at}`);
        } else {
          console.log(`${typeUser} [${index}] ${user.full_name} - ❌ PAS DE PHOTO`);
        }
      });
      
      setUsers(data || []);
      setLastUpdate(new Date());
      
      if (isAutoRefresh) {
        console.log('🔄 Auto-refresh utilisateurs:', new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
      if (isAutoRefresh) {
        setRefreshing(false);
      }
    }
  };

  const updateUserBalance = async (userId: string, newBalance: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (error) throw error;
      
      alert('Solde mis à jour avec succès');
      loadUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Erreur mise à jour solde:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  useEffect(() => {
    console.log('🎯 SimpleUsersList - useEffect MOUNT');
    loadUsers();
    
    // Rafraîchissement automatique toutes les 5 secondes
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh déclenché');
      loadUsers(true);
    }, 5000);
    
    return () => {
      console.log('🎯 SimpleUsersList - useEffect UNMOUNT');
      clearInterval(interval);
    };
  }, []);

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  console.log('🔍 FILTRAGE:', {
    totalUsers: users.length,
    filteredUsers: filteredUsers.length,
    searchTerm,
    usersWithPhotos: filteredUsers.filter(u => u.id_card_photo_url).length
  });

  if (loading) {
    return <div style={{ padding: '20px' }}>Chargement des utilisateurs...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Rechercher par nom ou téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            minWidth: '250px'
          }}
        />
        <button
          onClick={() => loadUsers()}
          style={{
            padding: '10px 15px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Actualiser
        </button>
        <div style={{ 
          fontSize: '12px', 
          color: refreshing ? '#ff6600' : '#666',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          {refreshing && <span>🔄</span>}
          Dernière MAJ: {lastUpdate.toLocaleTimeString()}
          <span style={{ color: '#009900' }}>• Auto-refresh 5s</span>
        </div>
      </div>

      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        border: '1px solid #ddd'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nom Complet</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Téléphone</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Pays/Ville</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date de naissance</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Pièce ID</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Solde</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Rôle</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{user.full_name || 'N/A'}</td>
              <td style={{ padding: '12px' }}>{user.phone}</td>
              <td style={{ padding: '12px' }}>
                <div>{user.country || 'N/A'}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>{user.address || 'Adresse non définie'}</div>
              </td>
              <td style={{ padding: '12px' }}>
                {user.birth_date ? new Date(user.birth_date).toLocaleDateString('fr-FR') : 'N/A'}
              </td>
              <td style={{ padding: '12px' }}>
                {user.id_card_photo_url && user.id_card_photo_url.trim() !== '' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={user.id_card_photo_url} 
                      alt={`Pièce d'identité de ${user.full_name}`}
                      style={{ 
                        width: '50px', 
                        height: '35px', 
                        objectFit: 'cover', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        border: '2px solid #4CAF50',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onClick={() => setSelectedUserPhoto({
                        url: user.id_card_photo_url,
                        name: user.full_name || 'Utilisateur',
                        type: 'Pièce d\'identité'
                      })}
                      onError={(e) => {
                        console.error('❌ Erreur chargement image:', user.id_card_photo_url);
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const errorSpan = target.nextElementSibling as HTMLElement;
                        if (errorSpan) errorSpan.textContent = '❌ Erreur';
                      }}
                      onLoad={() => {
                        console.log('✅ Photo chargée avec succès:', user.id_card_photo_url);
                      }}
                    />
                    <button
                      onClick={() => setSelectedUserPhoto({
                        url: user.id_card_photo_url,
                        name: user.full_name || 'Utilisateur',
                        type: 'Pièce d\'identité'
                      })}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                    >
                      👁️ Voir
                    </button>
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#4CAF50', 
                      fontWeight: 'bold',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <span>✅ PHOTO OK</span>
                      <span style={{ color: '#666' }}>
                        {new Date(user.created_at) >= new Date('2025-08-20') ? 'NOUVEAU' : 'ANCIEN'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#999',
                    padding: '8px',
                    border: '1px dashed #ccc',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    ❌ Aucune photo
                  </div>
                )}
              </td>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>
                {new Intl.NumberFormat('fr-FR').format(user.balance)} FCFA
              </td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: user.role === 'admin' ? '#ff6600' : '#009900',
                  color: 'white'
                }}>
                  {user.role}
                </span>
              </td>
              <td style={{ padding: '12px' }}>
                <button
                  onClick={() => setSelectedUser(user)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Voir détails
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            minWidth: '400px'
          }}>
            <h3 style={{ marginTop: 0 }}>Détails de l'utilisateur</h3>
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Nom complet:</strong> {selectedUser.full_name}</p>
              <p><strong>Téléphone:</strong> {selectedUser.phone}</p>
              <p><strong>Pays:</strong> {selectedUser.country || 'Non défini'}</p>
              <p><strong>Adresse:</strong> {selectedUser.address || 'Non définie'}</p>
              <p><strong>Date de naissance:</strong> {selectedUser.birth_date ? new Date(selectedUser.birth_date).toLocaleDateString('fr-FR') : 'Non définie'}</p>
              {selectedUser.id_card_photo_url && (
                <p>
                  <strong>Pièce d'identité:</strong>
                  <br />
                  <img 
                    src={selectedUser.id_card_photo_url} 
                    alt="Pièce d'identité" 
                    style={{ maxWidth: '200px', maxHeight: '150px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </p>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Nouveau solde (FCFA):
              </label>
              <input
                type="number"
                defaultValue={selectedUser.balance}
                id="newBalance"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ccc',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const newBalance = parseFloat((document.getElementById('newBalance') as HTMLInputElement).value);
                  if (!isNaN(newBalance)) {
                    updateUserBalance(selectedUser.id, newBalance);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#009900',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour voir les photos d'identité */}
      {selectedUserPhoto && (
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
                {selectedUserPhoto.type} - {selectedUserPhoto.name}
              </h3>
              <button
                onClick={() => setSelectedUserPhoto(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <img 
                src={selectedUserPhoto.url} 
                alt={selectedUserPhoto.type}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '70vh', 
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => window.open(selectedUserPhoto.url, '_blank')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Ouvrir dans un nouvel onglet
              </button>
              <button
                onClick={() => setSelectedUserPhoto(null)}
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
