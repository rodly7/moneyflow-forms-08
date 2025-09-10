
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  address: string;
  birth_date: string;
  id_card_photo_url: string;
  id_card_url: string;
  role: 'user' | 'agent' | 'admin' | 'sub_admin' | 'merchant' | 'provider';
  balance: number;
  created_at: string;
  is_banned?: boolean;
}

export const AdminUsersManagement = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserPhoto, setSelectedUserPhoto] = useState<{ url: string; name: string; type: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: 'user' | 'agent' | 'admin' | 'sub_admin' | 'merchant') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Mettre à jour localement
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast.success(`Rôle mis à jour vers ${newRole}`);
    } catch (error) {
      console.error('Erreur lors de la modification du rôle:', error);
      toast.error('Erreur lors de la modification du rôle');
    }
  };

  const toggleUserBan = async (userId: string, currentBanStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_banned: !currentBanStatus,
          banned_at: !currentBanStatus ? new Date().toISOString() : null,
          banned_reason: !currentBanStatus ? 'Banni par l\'administrateur' : null
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_banned: !currentBanStatus } : user
      ));

      toast.success(!currentBanStatus ? 'Utilisateur banni' : 'Utilisateur débanni');
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm) ||
    user.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Chargement des utilisateurs...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>Gestion des Utilisateurs ({users.length})</h2>
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone ou pays..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            width: '300px'
          }}
        />
      </div>

      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Utilisateur</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Contact</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Localisation</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date de naissance</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Pièce ID</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Rôle</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Solde</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Statut</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px' }}>
                  <div>
                    <strong>{user.full_name || 'Nom non défini'}</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      ID: {user.id.slice(0, 8)}...
                    </div>
                  </div>
                </td>
                <td style={{ padding: '15px' }}>{user.phone}</td>
                <td style={{ padding: '15px' }}>
                  <div>
                    <strong>{user.country || 'Non défini'}</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {user.address || 'Adresse non définie'}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  {user.birth_date ? new Date(user.birth_date).toLocaleDateString('fr-FR') : 'Non définie'}
                </td>
                <td style={{ padding: '15px' }}>
                  {(() => {
                    const photoUrl = user.id_card_url || user.id_card_photo_url;
                    
                    if (photoUrl) {
                      return (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          flexDirection: 'column',
                          minWidth: '80px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              width: '50px', 
                              height: '35px', 
                              border: '2px solid #e0e0e0',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              backgroundColor: '#fafafa',
                              position: 'relative',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              cursor: 'pointer'
                            }}>
                              <img 
                                src={photoUrl} 
                                alt="Pièce d'identité" 
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  display: 'block',
                                  opacity: '0.8'
                                }}
                                onClick={() => setSelectedUserPhoto({
                                  url: photoUrl,
                                  name: user.full_name || 'Utilisateur',
                                  type: 'Pièce d\'identité'
                                })}
                                onLoad={(e) => {
                                  console.log('✅ Photo chargée:', user.full_name);
                                  e.currentTarget.style.opacity = '1';
                                }}
                                onError={(e) => {
                                  console.error('❌ Erreur photo:', user.full_name, photoUrl);
                                  const errorDiv = document.createElement('div');
                                  errorDiv.innerHTML = '❌';
                                  errorDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#ffebee;color:#d32f2f;font-size:16px;position:absolute;top:0;left:0;';
                                  e.currentTarget.parentElement?.appendChild(errorDiv);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUserPhoto({
                                url: photoUrl,
                                name: user.full_name || 'Utilisateur',
                                type: 'Pièce d\'identité'
                              })}
                              style={{ height: '32px', minWidth: '32px' }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                          <a 
                            href={photoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              fontSize: '10px', 
                              color: '#1976d2',
                              textDecoration: 'none',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              backgroundColor: '#e3f2fd'
                            }}
                          >
                            Lien direct
                          </a>
                        </div>
                      );
                    } else {
                      return (
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '50px',
                          color: '#999',
                          fontSize: '11px'
                        }}>
                          Non fournie
                        </div>
                      );
                    }
                  })()}
                </td>
                <td style={{ padding: '15px' }}>
                  <select
                    value={user.role}
                    onChange={(e) => changeUserRole(user.id, e.target.value as any)}
                    style={{
                      padding: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: 
                        user.role === 'admin' ? '#e3f2fd' :
                        user.role === 'sub_admin' ? '#fff3e0' :
                        user.role === 'agent' ? '#e8f5e8' : '#f5f5f5'
                    }}
                  >
                    <option value="user">Utilisateur</option>
                    <option value="agent">Agent</option>
                    <option value="merchant">Commerçant</option>
                    <option value="provider">Fournisseur</option>
                    <option value="sub_admin">Sous-Admin</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{ 
                    color: user.balance < 0 ? '#d32f2f' : '#2e7d32',
                    fontWeight: 'bold'
                  }}>
                    {user.balance.toLocaleString()} XAF
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: user.is_banned ? '#ffebee' : '#e8f5e8',
                    color: user.is_banned ? '#d32f2f' : '#2e7d32'
                  }}>
                    {user.is_banned ? 'Banni' : 'Actif'}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  <button
                    onClick={() => toggleUserBan(user.id, user.is_banned || false)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      backgroundColor: user.is_banned ? '#4caf50' : '#f44336',
                      color: 'white'
                    }}
                  >
                    {user.is_banned ? 'Débannir' : 'Bannir'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            {searchTerm ? 'Aucun utilisateur trouvé pour cette recherche' : 'Aucun utilisateur trouvé'}
          </div>
        )}
      </div>

      {/* Modal pour voir les photos d'identité */}
      <Dialog open={!!selectedUserPhoto} onOpenChange={() => setSelectedUserPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedUserPhoto?.type} - {selectedUserPhoto?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUserPhoto(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedUserPhoto && (
            <div className="flex justify-center p-4">
              <img 
                src={selectedUserPhoto.url} 
                alt={selectedUserPhoto.type}
                className="max-w-full max-h-[70vh] object-contain rounded-lg border"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => window.open(selectedUserPhoto?.url, '_blank')}
            >
              Ouvrir dans un nouvel onglet
            </Button>
            <Button onClick={() => setSelectedUserPhoto(null)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
