
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BalanceFlow {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  profiles: {
    full_name: string;
    phone: string;
  };
}

export const SimpleTreasuryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flows, setFlows] = useState<BalanceFlow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour les opérations
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [operationType, setOperationType] = useState('credit');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    fetchBalanceFlows();
  }, []);

  const fetchBalanceFlows = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles!audit_logs_user_id_fkey (full_name, phone)
        `)
        .eq('table_name', 'profiles')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform audit logs to balance flows format
      const transformedFlows = (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id || '',
        amount: log.new_values?.amount || 0,
        type: log.action.includes('credit') ? 'credit' : 'debit',
        description: log.action,
        created_at: log.created_at,
        profiles: log.profiles
      }));
      
      setFlows(transformedFlows);
    } catch (error) {
      console.error('Erreur lors du chargement des flux:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUser = async () => {
    if (!searchPhone) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance')
        .ilike('phone', `%${searchPhone}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Erreur recherche:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const handleBalanceOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !amount) return;

    setProcessing(true);
    try {
      const operationAmount = operationType === 'credit' ? Number(amount) : -Number(amount);
      
      const { error } = await supabase.rpc('secure_increment_balance', {
        target_user_id: selectedUserId,
        amount: operationAmount,
        operation_type: `admin_${operationType}`,
        performed_by: user?.id
      });

      if (error) throw error;

      toast({
        title: "Opération réussie",
        description: `${operationType === 'credit' ? 'Crédit' : 'Débit'} de ${amount} FCFA effectué`,
      });

      // Reset form
      setSelectedUserId('');
      setAmount('');
      setDescription('');
      setSearchPhone('');
      setSearchResults([]);
      
      // Refresh flows
      fetchBalanceFlows();

    } catch (error) {
      console.error('Erreur opération:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'opération",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.abs(amount)) + ' FCFA';
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>
        Gestion de la Trésorerie
      </h2>

      {/* Opérations de balance */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px' 
      }}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
          Opérations de solde
        </h3>
        
        <form onSubmit={handleBalanceOperation}>
          {/* Recherche utilisateur */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Rechercher un utilisateur:
            </label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="Numéro de téléphone..."
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <button
                type="button"
                onClick={searchUser}
                style={{
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Rechercher
              </button>
            </div>

            {searchResults.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setSearchResults([]);
                    }}
                    style={{
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '5px',
                      cursor: 'pointer',
                      backgroundColor: selectedUserId === user.id ? '#e3f2fd' : 'white'
                    }}
                  >
                    <strong>{user.full_name}</strong> - {user.phone}
                    <br />
                    <small>Solde actuel: {formatAmount(user.balance)}</small>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Type d'opération:
              </label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value)}
                style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="credit">Crédit</option>
                <option value="debit">Débit</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Montant (FCFA):
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description:
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Raison de l'opération..."
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={processing || !selectedUserId || !amount}
            style={{
              backgroundColor: processing ? '#ccc' : '#28a745',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: processing ? 'not-allowed' : 'pointer'
            }}
          >
            {processing ? 'Traitement...' : `${operationType === 'credit' ? 'Créditer' : 'Débiter'} ${amount || '0'} FCFA`}
          </button>
        </form>
      </div>

      {/* Historique des flux */}
      <div>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
          Historique des opérations
        </h3>

        {loading ? (
          <p>Chargement des opérations...</p>
        ) : flows.length === 0 ? (
          <p>Aucune opération récente</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {flows.map((flow) => (
              <div
                key={flow.id}
                style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong>{flow.profiles?.full_name || 'Utilisateur inconnu'}</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    {flow.profiles?.phone} • {new Date(flow.created_at).toLocaleString('fr-FR')}
                  </small>
                  <br />
                  <small>{flow.description}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    color: flow.type === 'credit' ? '#28a745' : '#dc3545',
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}>
                    {flow.type === 'credit' ? '+' : '-'}{formatAmount(flow.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
