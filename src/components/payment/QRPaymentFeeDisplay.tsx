import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface QRPaymentFeeDisplayProps {
  amount: number;
  isMerchant: boolean;
  userId: string;
  isMobile: boolean;
}

const QRPaymentFeeDisplay = ({ amount, isMerchant, userId, isMobile }: QRPaymentFeeDisplayProps) => {
  const [sendflowFee, setSendflowFee] = useState(0);

  useEffect(() => {
    const checkSendflowFee = async () => {
      if (!isMerchant) {
        setSendflowFee(0);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: todayPayments } = await supabase
        .from('merchant_payments')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);
      
      // Si c'est la première transaction du jour, ajouter 50 FCFA pour Sendflow
      if (!todayPayments || todayPayments.length === 0) {
        setSendflowFee(50);
      } else {
        setSendflowFee(0);
      }
    };

    checkSendflowFee();
  }, [isMerchant, userId]);

  // Aucun frais pour les utilisateurs qui paient des marchands
  const regularFees = 0;
  // Seuls les marchands paient les frais Sendflow
  const total = amount + (isMerchant ? sendflowFee : 0);

  return (
    <div className={`${isMerchant ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} ${isMobile ? 'p-2' : 'p-3'} rounded-lg border`}>
      <div className={`${isMobile ? 'text-xs' : 'text-sm'} space-y-1`}>
        <div className="flex justify-between">
          <span className="text-gray-600">Montant:</span>
          <span className="font-medium">{amount.toLocaleString()} FCFA</span>
        </div>
        
        {/* Aucun frais pour les utilisateurs qui paient des marchands */}
        {!isMerchant && (
          <div className="flex justify-between">
            <span className="text-green-600">Frais:</span>
            <span className="font-medium text-green-600">0 FCFA</span>
          </div>
        )}
        
        {isMerchant && sendflowFee > 0 && (
          <div className="flex justify-between">
            <span className="text-orange-600">Frais Sendflow (1ère du jour):</span>
            <span className="font-medium text-orange-600">{sendflowFee} FCFA</span>
          </div>
        )}
        
        <div className={`flex justify-between border-t pt-1 ${isMobile ? 'text-sm' : ''}`}>
          <span className="font-semibold text-gray-800">Total:</span>
          <span className={`font-bold ${isMerchant ? 'text-green-600' : 'text-blue-600'}`}>
            {total.toLocaleString()} FCFA
          </span>
        </div>
        
        {!isMerchant && (
          <div className="text-center">
            <span className="text-green-600 font-medium text-xs">✓ Paiement sans frais pour les clients</span>
          </div>
        )}
        
        {isMerchant && sendflowFee === 0 && (
          <div className="text-center">
            <span className="text-green-600 font-medium text-xs">✓ Aucun frais Sendflow aujourd'hui</span>
          </div>
        )}
        
        {isMerchant && sendflowFee > 0 && (
          <div className="text-center">
            <span className="text-orange-600 font-medium text-xs">⚠️ Frais Sendflow automatique (première transaction du jour)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRPaymentFeeDisplay;