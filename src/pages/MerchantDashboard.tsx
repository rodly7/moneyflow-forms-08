import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Wallet, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MerchantPersonalQR from '@/components/merchant/MerchantPersonalQR';
import BillPaymentRequests from '@/components/merchant/BillPaymentRequests';

import LogoutButton from '@/components/auth/LogoutButton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UnifiedNotificationBell } from '@/components/notifications/UnifiedNotificationBell';
import { useAutoBalanceRefresh } from '@/hooks/useAutoBalanceRefresh';

const MerchantDashboard = () => {
  const { profile } = useAuth();
  const [sendflowDebt, setSendflowDebt] = useState(0);
  const [sendflowPaidToday, setSendflowPaidToday] = useState(false);
  
  // Clé pour le localStorage basée sur la date et l'utilisateur
  const getStorageKey = () => {
    const today = new Date().toISOString().split('T')[0];
    return `sendflow_paid_${profile?.id}_${today}`;
  };
  
  // Vérifier si déjà payé aujourd'hui depuis le localStorage
  const checkLocalPaymentStatus = () => {
    if (!profile?.id) return false;
    const storageKey = getStorageKey();
    return localStorage.getItem(storageKey) === 'true';
  };
  
  // Marquer comme payé dans le localStorage
  const markAsPaidLocally = () => {
    if (!profile?.id) return;
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, 'true');
  };
  
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
      
      // D'abord vérifier le localStorage
      const locallyPaid = checkLocalPaymentStatus();
      console.log("💾 [MERCHANT] Statut local du paiement:", locallyPaid);
      
      if (locallyPaid) {
        console.log("✅ [MERCHANT] Paiement déjà effectué selon localStorage");
        setSendflowDebt(0);
        setSendflowPaidToday(true);
        return;
      }
      
      // Vérifier s'il y a des paiements de commission Sendflow aujourd'hui dans la table dédiée
      const { data: sendflowPayments, error: paymentError } = await supabase
        .from('sendflow_commission_payments')
        .select('id, created_at, amount')
        .eq('merchant_id', profile.id)
        .eq('payment_date', today);

      if (paymentError) {
        console.error("❌ [MERCHANT] Erreur lors de la recherche des paiements Sendflow:", paymentError);
      }

      console.log("💰 [MERCHANT] Paiements Sendflow trouvés:", sendflowPayments);

      const paidToday = sendflowPayments && sendflowPayments.length > 0;
      
      // Si payé selon la base de données, marquer aussi localement
      if (paidToday) {
        markAsPaidLocally();
        console.log("✅ [MERCHANT] Paiement trouvé en DB, marqué localement");
      }
      
      setSendflowPaidToday(paidToday);

      // Vérifier s'il y a des paiements marchands aujourd'hui
      const startDate = `${today}T00:00:00.000Z`;
      const endDate = `${today}T23:59:59.999Z`;
      
      const { data: todayPayments, error: merchantError } = await supabase
        .from('merchant_payments')
        .select('id')
        .eq('merchant_id', profile.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (merchantError) {
        console.error("❌ [MERCHANT] Erreur lors de la recherche des paiements marchands:", merchantError);
      }

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
    console.log("🚀 [MERCHANT] Début fonction handlePaySendflow");
    console.log("📊 [MERCHANT] profile?.id:", profile?.id);
    console.log("📊 [MERCHANT] sendflowDebt:", sendflowDebt);
    console.log("📊 [MERCHANT] profile.balance:", profile?.balance);

    if (!profile?.id || sendflowDebt <= 0) {
      console.log("❌ [MERCHANT] Aucune commission à payer - profile?.id:", profile?.id, "sendflowDebt:", sendflowDebt);
      toast.error("Aucune commission à payer");
      return;
    }

    if (profile.balance < sendflowDebt) {
      console.log("❌ [MERCHANT] Solde insuffisant - balance:", profile.balance, "debt:", sendflowDebt);
      toast.error("Solde insuffisant pour payer la commission Sendflow");
      return;
    }

    try {
      console.log("💳 [MERCHANT] Début du paiement commission Sendflow:", sendflowDebt, "FCFA");

      // Débiter le compte du marchand
      console.log("🔄 [MERCHANT] Tentative de débit du compte...");
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: profile.balance - sendflowDebt })
        .eq('id', profile.id);

      if (updateError) {
        console.error("❌ [MERCHANT] Erreur lors du débit:", updateError);
        throw updateError;
      }

      console.log("✅ [MERCHANT] Débit effectué, nouveau solde:", profile.balance - sendflowDebt);

      // Enregistrer le paiement dans la table dédiée sendflow_commission_payments
      console.log("📝 [MERCHANT] Enregistrement du paiement dans sendflow_commission_payments...");
      
      const { data: paymentData, error: paymentError } = await supabase
        .from('sendflow_commission_payments')
        .insert({
          merchant_id: profile.id,
          amount: sendflowDebt,
          payment_date: new Date().toISOString().split('T')[0]
        })
        .select();

      if (paymentError) {
        console.error('❌ [MERCHANT] Erreur lors de l\'enregistrement du paiement:', paymentError);
        console.error('❌ [MERCHANT] Détails de l\'erreur:', {
          message: paymentError.message,
          details: paymentError.details,
          hint: paymentError.hint,
          code: paymentError.code
        });
        throw paymentError;
      }

      console.log("✅ [MERCHANT] Paiement enregistré avec succès:", paymentData);

      // Marquer immédiatement comme payé localement et dans l'état
      markAsPaidLocally();
      setSendflowDebt(0);
      setSendflowPaidToday(true);
      
      console.log("✅ [MERCHANT] Marqué comme payé localement et dans l'état");
      
      toast.success(`Commission Sendflow de ${sendflowDebt} FCFA payée`);
      
      // Vérifier immédiatement que le paiement est bien enregistré
      console.log("🔄 [MERCHANT] Vérification immédiate du paiement...");
      const { data: verifyPayment } = await supabase
        .from('sendflow_commission_payments')
        .select('id, created_at')
        .eq('merchant_id', profile.id)
        .eq('payment_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1);
      
      console.log("✅ [MERCHANT] Vérification paiement:", verifyPayment);
      
    } catch (error) {
      console.error('❌ [MERCHANT] Erreur lors du paiement Sendflow:', error);
      console.error('❌ [MERCHANT] Détails complets de l\'erreur:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stack: error.stack
      });
      toast.error(`Erreur lors du paiement: ${error.message || 'Erreur inconnue'}`);
    }
  };

  useEffect(() => {
    checkSendflowDebt();
    // Vérifier toutes les minutes si la dette a changé
    const interval = setInterval(checkSendflowDebt, 60000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header avec notifications et déconnexion - Mobile optimized */}
        <div className="flex justify-between items-start sm:items-center mb-4 sm:mb-8">
          <div className="flex-1">
            <div className="flex items-center justify-start sm:justify-center mb-2 sm:mb-4">
              <Store className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2 sm:mr-3" />
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">
                Interface Commerciale
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-left sm:text-center">
              Tableau de bord pour gérer vos paiements
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 ml-2">
            <UnifiedNotificationBell />
            <LogoutButton />
          </div>
        </div>

        {/* Carte du solde - Mobile optimized */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-center">
              <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-primary mr-3 sm:mr-4" />
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Mon Solde</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {profile?.balance?.toLocaleString() || 0} XAF
                </p>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* QR Code Personnel - Mobile optimized */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <MerchantPersonalQR />
          </div>
        </div>

        {/* Paiements de factures reçus */}
        <BillPaymentRequests />

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