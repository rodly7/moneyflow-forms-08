
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SimpleTreasuryTab = () => {
  const [treasuryData, setTreasuryData] = useState({
    totalBalance: 0,
    todayRevenue: 0,
    pendingTransactions: 0,
    monthlyRevenue: 0
  });
  const [creditAmount, setCreditAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTreasuryData();
  }, []);

  const fetchTreasuryData = async () => {
    try {
      // Récupérer le solde admin
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('role', 'admin')
        .maybeSingle();

      // Récupérer les transactions du jour
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTransactions } = await supabase
        .from('transfers')
        .select('amount')
        .gte('created_at', today)
        .eq('status', 'completed');

      // Transactions en attente
      const { data: pendingTransactions } = await supabase
        .from('transfers')
        .select('id')
        .eq('status', 'pending');

      const todayRevenue = todayTransactions?.reduce((sum, t) => sum + (t.amount * 0.01), 0) || 0;

      setTreasuryData({
        totalBalance: adminProfile?.balance || 0,
        todayRevenue,
        pendingTransactions: pendingTransactions?.length || 0,
        monthlyRevenue: todayRevenue * 30 // Estimation
      });
    } catch (error) {
      console.error('Erreur chargement trésorerie:', error);
    }
  };

  const handleCredit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, balance')
        .eq('phone', phoneNumber)
        .maybeSingle();

      if (userError || !user) {
        alert('Utilisateur non trouvé');
        return;
      }

      const amount = parseFloat(creditAmount);
      const newBalance = parseFloat(user.balance) + amount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      alert(`Compte de ${user.full_name} crédité de ${amount} FCFA`);
      setCreditAmount('');
      setPhoneNumber('');
      fetchTreasuryData();
    } catch (error) {
      console.error('Erreur crédit:', error);
      alert('Erreur lors du crédit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>
        💰 Dashboard Trésorerie
      </h2>

      {/* Statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', backgroundColor: '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1d4ed8' }}>
            {treasuryData.totalBalance.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#3730a3', marginTop: '5px' }}>
            Solde Total (FCFA)
          </div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#dcfce7', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>
            {treasuryData.todayRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#15803d', marginTop: '5px' }}>
            Revenus Aujourd'hui (FCFA)
          </div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>
            {treasuryData.pendingTransactions}
          </div>
          <div style={{ fontSize: '14px', color: '#b45309', marginTop: '5px' }}>
            Transactions en Attente
          </div>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#f3e8ff', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed' }}>
            {treasuryData.monthlyRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#6d28d9', marginTop: '5px' }}>
            Revenus Mensuels (Est.)
          </div>
        </div>
      </div>

      {/* Formulaire de crédit */}
      <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#374151' }}>
          Créditer un Compte Utilisateur
        </h3>

        <form onSubmit={handleCredit} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'end' }}>
          <div style={{ minWidth: '200px', flex: '1' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '5px', color: '#374151' }}>
              Numéro de téléphone
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+221773637752"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ minWidth: '200px', flex: '1' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '5px', color: '#374151' }}>
              Montant (FCFA)
            </label>
            <input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="50000"
              required
              min="1"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#9ca3af' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Traitement...' : 'Créditer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SimpleTreasuryTab;
