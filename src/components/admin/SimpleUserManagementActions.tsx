import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SimpleInternationalDepositForm from "./SimpleInternationalDepositForm";

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  country: string;
  address: string;
  balance: number;
  role: string;
  is_verified: boolean;
  is_banned: boolean;
}

interface SimpleUserManagementActionsProps {
  user: UserProfile;
  onUserUpdated?: () => void;
  onUserDeleted?: () => void;
}

const SimpleUserManagementActions = ({ user, onUserUpdated, onUserDeleted }: SimpleUserManagementActionsProps) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editData, setEditData] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
    country: user.country || '',
    address: user.address || '',
    role: user.role as 'user' | 'agent' | 'admin' | 'sub_admin' || 'user',
    is_verified: user.is_verified || false,
    is_banned: user.is_banned || false,
  });

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          phone: editData.phone,
          country: editData.country,
          address: editData.address,
          role: editData.role,
          is_verified: editData.is_verified,
          is_banned: editData.is_banned,
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage('Utilisateur mis à jour avec succès');
      setTimeout(() => {
        setShowEditForm(false);
        onUserUpdated?.();
      }, 1500);
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      setMessage('Erreur lors de la mise à jour');
    }
    setIsLoading(false);
  };

  const handleDeleteUser = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      // Supprimer toutes les données liées dans le bon ordre
      console.log('🗑️ Début de la suppression de l\'utilisateur:', user.id);
      
      // 1. Supprimer les tables dépendantes qui référencent user_id
      await supabase.from('user_sessions').delete().eq('user_id', user.id);
      await supabase.from('savings_accounts').delete().eq('user_id', user.id);
      await supabase.from('flutterwave_transactions').delete().eq('user_id', user.id);
      await supabase.from('customer_support_messages').delete().eq('user_id', user.id);
      await supabase.from('notification_recipients').delete().eq('user_id', user.id);
      await supabase.from('password_reset_requests').delete().eq('user_id', user.id);
      
      // 2. Supprimer les transactions
      await supabase.from('transfers').delete().eq('sender_id', user.id);
      await supabase.from('pending_transfers').delete().eq('sender_id', user.id);
      await supabase.from('withdrawals').delete().eq('user_id', user.id);
      await supabase.from('withdrawal_requests').delete().eq('user_id', user.id);
      await supabase.from('recharges').delete().eq('user_id', user.id);
      
      // 3. Supprimer les données agent si c'est un agent
      if (user.role === 'agent') {
        await supabase.from('agent_challenges').delete().eq('agent_id', user.id);
        await supabase.from('agent_complaints').delete().eq('agent_id', user.id);
        await supabase.from('agent_location_history').delete().eq('agent_id', user.id);
        await supabase.from('agent_locations').delete().eq('agent_id', user.id);
        await supabase.from('agent_monthly_performance').delete().eq('agent_id', user.id);
        await supabase.from('agent_reports').delete().eq('agent_id', user.id);
        await supabase.from('agents').delete().eq('user_id', user.id);
        await supabase.from('withdrawal_requests').delete().eq('agent_id', user.id);
      }
      
      // 4. Supprimer les données admin si c'est un admin
      if (user.role === 'admin' || user.role === 'sub_admin') {
        await supabase.from('admin_deposits').delete().eq('admin_id', user.id);
      }
      
      // 5. Supprimer les logs d'audit (ne pas bloquer si erreur)
      try {
        await supabase.from('audit_logs').delete().eq('user_id', user.id);
      } catch (auditError) {
        console.warn('⚠️ Erreur lors de la suppression des logs d\'audit:', auditError);
      }
      
      // 6. Finalement, supprimer le profil utilisateur
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      console.log('✅ Utilisateur supprimé avec succès:', user.id);
      setMessage('Utilisateur et toutes ses données supprimés avec succès');
      setTimeout(() => {
        setShowDeleteConfirm(false);
        onUserDeleted?.();
      }, 1500);
    } catch (error) {
      console.error('❌ Erreur suppression utilisateur:', error);
      setMessage(`Erreur lors de la suppression: ${error.message || error}`);
    }
    setIsLoading(false);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '5px' }}>
        {/* Dépôt International */}
        <button
          onClick={() => setShowDepositForm(true)}
          style={{ 
            padding: '6px 8px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          title="Dépôt International"
        >
          🌍
        </button>

        {/* Modifier Utilisateur */}
        <button
          onClick={() => setShowEditForm(true)}
          style={{ 
            padding: '6px 8px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          title="Modifier"
        >
          ✏️
        </button>

        {/* Supprimer Utilisateur */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{ 
            padding: '6px 8px', 
            border: '1px solid #dc2626', 
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#dc2626',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          title="Supprimer"
        >
          🗑️
        </button>
      </div>

      {/* Formulaire de dépôt international */}
      {showDepositForm && (
        <SimpleInternationalDepositForm
          targetUserId={user.id}
          targetUserName={user.full_name || user.phone}
          onSuccess={() => {
            setShowDepositForm(false);
            onUserUpdated?.();
          }}
          onCancel={() => setShowDepositForm(false)}
        />
      )}

      {/* Formulaire d'édition */}
      {showEditForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            width: '90%', 
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
              👤 Modifier l'utilisateur
            </h3>
            
            <form onSubmit={handleUpdateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={editData.full_name}
                    onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Pays
                  </label>
                  <input
                    type="text"
                    value={editData.country}
                    onChange={(e) => setEditData({...editData, country: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Rôle
                  </label>
                  <select 
                    value={editData.role} 
                    onChange={(e) => setEditData({...editData, role: e.target.value as 'user' | 'agent' | 'admin' | 'sub_admin'})}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="user">Utilisateur</option>
                    <option value="agent">Agent</option>
                    <option value="sub_admin">Sous-admin</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Adresse
                </label>
                <textarea
                  value={editData.address}
                  onChange={(e) => setEditData({...editData, address: e.target.value})}
                  rows={2}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #ccc', 
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={editData.is_verified}
                    onChange={(e) => setEditData({...editData, is_verified: e.target.checked})}
                  />
                  Vérifié
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={editData.is_banned}
                    onChange={(e) => setEditData({...editData, is_banned: e.target.checked})}
                  />
                  Banni
                </label>
              </div>

              {message && (
                <div style={{ 
                  padding: '10px', 
                  marginBottom: '15px', 
                  borderRadius: '4px',
                  backgroundColor: message.includes('succès') ? '#dcfce7' : '#fecaca',
                  color: message.includes('succès') ? '#166534' : '#dc2626',
                  fontSize: '14px'
                }}>
                  {message}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  style={{ 
                    padding: '10px 20px', 
                    border: '1px solid #ccc', 
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ 
                    padding: '10px 20px', 
                    border: 'none', 
                    borderRadius: '4px',
                    backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {isLoading ? "Mise à jour..." : "Mettre à jour"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation de suppression */}
      {showDeleteConfirm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            width: '90%', 
            maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold' }}>
              Supprimer l'utilisateur
            </h3>
            
            <p style={{ marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.full_name || user.phone}</strong> ?
              Cette action est irréversible et supprimera toutes les données associées.
            </p>

            {message && (
              <div style={{ 
                padding: '10px', 
                marginBottom: '15px', 
                borderRadius: '4px',
                backgroundColor: message.includes('succès') ? '#dcfce7' : '#fecaca',
                color: message.includes('succès') ? '#166534' : '#dc2626',
                fontSize: '14px'
              }}>
                {message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ 
                  padding: '10px 20px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isLoading}
                style={{ 
                  padding: '10px 20px', 
                  border: 'none', 
                  borderRadius: '4px',
                  backgroundColor: isLoading ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {isLoading ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimpleUserManagementActions;