
export interface FeeCalculation {
  amount: number;
  fees: number;
  total: number;
  feePercentage: number;
}

export const calculateTransferFees = (
  amount: number,
  senderCountry: string,
  recipientCountry: string,
  userType: 'user' | 'agent' | 'admin' | 'sub_admin' = 'user'
): FeeCalculation => {
  const isNational = senderCountry === recipientCountry;
  let feePercentage = 0;
  let fees = 0;

  if (isNational) {
    // Transfert national : 1%
    feePercentage = 1;
    fees = amount * 0.01;
  } else {
    // Transfert international : 6,5% si < 800,000 FCFA, sinon 5%
    if (amount < 800000) {
      feePercentage = 6.5;
      fees = amount * 0.065;
    } else {
      feePercentage = 5;
      fees = amount * 0.05;
    }
  }

  return {
    amount,
    fees: Math.round(fees),
    total: Math.round(amount + fees),
    feePercentage
  };
};

export const calculateBillPaymentFees = (amount: number): FeeCalculation => {
  // Frais de paiement de factures : 1%
  const fees = amount * 0.01;
  
  return {
    amount,
    fees: Math.round(fees),
    total: Math.round(amount + fees),
    feePercentage: 1
  };
};
