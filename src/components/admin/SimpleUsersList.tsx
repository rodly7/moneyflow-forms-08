
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, role, is_verified, created_at, country, address, birth_date, id_card_photo_url')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
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
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

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
          onClick={loadUsers}
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
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Né en</th>
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
                {user.birth_date ? new Date(user.birth_date).getFullYear() : 'N/A'}
              </td>
              <td style={{ padding: '12px' }}>
                {user.id_card_photo_url ? (
                  <img 
                    src={user.id_card_photo_url} 
                    alt="Pièce d'identité" 
                    style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={() => window.open(user.id_card_photo_url, '_blank')}
                  />
                ) : (
                  <span style={{ fontSize: '11px', color: '#999' }}>Non fournie</span>
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
              <p><strong>Année de naissance:</strong> {selectedUser.birth_date ? new Date(selectedUser.birth_date).getFullYear() : 'Non définie'}</p>
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
    </div>
  );
};
