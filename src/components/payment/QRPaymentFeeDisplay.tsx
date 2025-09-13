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
    // Les frais Sendflow ne sont JAMAIS affichés ou payés par l'utilisateur
    // Ils sont uniquement à la charge interne du marchand
    setSendflowFee(0);
  }, [isMerchant, userId]);

  // Frais: 0 si marchand, sinon 1%
  const regularFees = isMerchant ? 0 : Math.round(amount * 0.01);
  // L'utilisateur ne paie JAMAIS les frais Sendflow - toujours 0 côté client
  const total = amount + regularFees;
 
  return (
    <div className={`${isMerchant ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} ${isMobile ? 'p-2' : 'p-3'} rounded-lg border`}>
      <div className={`${isMobile ? 'text-xs' : 'text-sm'} space-y-1`}>
        <div className="flex justify-between">
          <span className="text-gray-600">Montant:</span>
          <span className="font-medium">{amount.toLocaleString()} FCFA</span>
        </div>
        
        {/* Frais: 0 pour les marchands, 1% sinon */}
        {isMerchant ? (
          <div className="flex justify-between">
            <span className="text-green-600">Frais:</span>
            <span className="font-medium text-green-600">0 FCFA</span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span className="text-gray-600">Frais (1%):</span>
            <span className="font-medium">{regularFees.toLocaleString()} FCFA</span>
          </div>
        )}
        
        <div className={`flex justify-between border-t pt-1 ${isMobile ? 'text-sm' : ''}`}>
          <span className="font-semibold text-gray-800">Total:</span>
          <span className={`font-bold ${isMerchant ? 'text-green-600' : 'text-blue-600'}`}>
            {total.toLocaleString()} FCFA
          </span>
        </div>
        
        {isMerchant ? (
          <div className="text-center">
            <span className="text-green-600 font-medium text-xs">✓ Paiement sans frais chez les marchands</span>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-green-600 font-medium text-xs">✓ 1% de frais appliqués</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRPaymentFeeDisplay;