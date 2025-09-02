import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Wallet, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MerchantPersonalQR from '@/components/merchant/MerchantPersonalQR';
import LogoutButton from '@/components/auth/LogoutButton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UnifiedNotificationBell } from '@/components/notifications/UnifiedNotificationBell';
import { useAutoBalanceRefresh } from '@/hooks/useAutoBalanceRefresh';

const MerchantDashboard = () => {
  const { profile } = useAuth();
  const [sendflowDebt, setSendflowDebt] = useState(0);
  const [sendflowPaidToday, setSendflowPaidToday] = useState(false);
  
  // Rafraîchir le solde toutes les 5 secondes
  useAutoBalanceRefresh({ 
    intervalMs: 5000,
    enableRealtime: true
  });

  const checkSendflowDebt = async () => {
    if (!profile?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      console.log("🔍 [MERCHANT] Vérification commission pour:", profile.id, "Date:", today);
      
      // Vérifier s'il y a des paiements de commission Sendflow aujourd'hui
      const { data: sendflowPayments } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('action', 'sendflow_commission_payment')
        .eq('record_id', profile.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      console.log("💰 [MERCHANT] Paiements Sendflow trouvés:", sendflowPayments);

      const paidToday = sendflowPayments && sendflowPayments.length > 0;
      setSendflowPaidToday(paidToday);

      // Vérifier s'il y a des paiements marchands aujourd'hui
      const { data: todayPayments } = await supabase
        .from('merchant_payments')
        .select('id')
        .eq('merchant_id', profile.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      console.log("💳 [MERCHANT] Paiements marchands trouvés:", todayPayments);

      // Si des paiements ont été effectués aujourd'hui ET que Sendflow n'a pas été payé
      if (todayPayments && todayPayments.length > 0 && !paidToday) {
        console.log("⚠️ [MERCHANT] Dette Sendflow détectée - Paiements:", todayPayments.length, "Commission payée:", paidToday);
        setSendflowDebt(50);
      } else {
        console.log("✅ [MERCHANT] Pas de dette Sendflow - Paiements:", todayPayments?.length || 0, "Commission payée:", paidToday);
        setSendflowDebt(0);
      }
    } catch (error) {
      console.error('❌ [MERCHANT] Erreur lors de la vérification de la dette Sendflow:', error);
    }
  };

  // Payer la commission Sendflow
  const handlePaySendflow = async () => {
    if (!profile?.id || sendflowDebt <= 0) {
      toast.error("Aucune commission à payer");
      return;
    }

    if (profile.balance < sendflowDebt) {
      toast.error("Solde insuffisant pour payer la commission Sendflow");
      return;
    }

    try {
      // Débiter le compte du marchand
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: profile.balance - sendflowDebt })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Enregistrer le paiement dans audit_logs pour traçabilité
      const { error: logError } = await supabase
        .from('audit_logs')
        .insert({
          action: 'sendflow_commission_payment',
          table_name: 'profiles',
          record_id: profile.id,
          user_id: profile.id,
          new_values: { commission_paid: sendflowDebt, date: new Date().toISOString().split('T')[0] }
        });

      if (logError) console.error('Erreur lors de l\'enregistrement du log:', logError);

      toast.success(`Commission Sendflow de ${sendflowDebt} FCFA payée`);
      setSendflowDebt(0);
      setSendflowPaidToday(true);
    } catch (error) {
      console.error('Erreur lors du paiement Sendflow:', error);
      toast.error("Erreur lors du paiement");
    }
  };

  useEffect(() => {
    checkSendflowDebt();
    // Vérifier toutes les minutes si la dette a changé
    const interval = setInterval(checkSendflowDebt, 60000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header avec notifications et déconnexion */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-3xl font-bold text-foreground">Interface Commerciale</h1>
            </div>
            <p className="text-muted-foreground">
              Tableau de bord pour gérer vos paiements
            </p>
          </div>
          <div className="flex items-center gap-4">
            <UnifiedNotificationBell />
            <LogoutButton />
          </div>
        </div>

        {/* Carte du solde */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Wallet className="h-10 w-10 text-primary mr-4" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Mon Solde</p>
                <p className="text-3xl font-bold text-primary">
                  {profile?.balance?.toLocaleString() || 0} XAF
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* QR Code Personnel */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 max-w-md mx-auto">
          <MerchantPersonalQR />
        </div>

        {/* Commission Sendflow */}
        {sendflowDebt > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-700 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Commission Sendflow à payer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 font-medium">
                    Montant: {sendflowDebt} FCFA
                  </p>
                   <p className="text-sm text-orange-500 mt-1">
                     Payez votre commission quotidienne pour pouvoir effectuer des retraits
                   </p>
                   <p className="text-xs text-orange-400 mt-1">
                     Date: {new Date().toLocaleDateString('fr-FR')}
                   </p>
                </div>
                <Button 
                  onClick={handlePaySendflow}
                  variant="default"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Payer Sendflow
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sendflowDebt === 0 && sendflowPaidToday && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Bell className="h-5 w-5" />
                <span className="font-medium">Commission Sendflow payée aujourd'hui</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        {sendflowDebt === 0 && !sendflowPaidToday && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <Bell className="h-5 w-5" />
                <span className="font-medium">Aucune transaction aujourd'hui</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MerchantDashboard;