
export const calculateWithdrawalFees = (withdrawalAmount: number, userRole: string = 'user') => {
  // Pour les agents : pas de frais sur les retraits
  if (userRole === 'agent') {
    return {
      totalFee: 0,
      agentCommission: 0,
      platformCommission: 0
    };
  }
  
  // Pour les utilisateurs normaux : frais habituels
  const agentCommission = withdrawalAmount * 0.005; // 0.5% pour l'agent
  const platformCommission = withdrawalAmount * 0.01; // 1% pour l'entreprise
  const totalFee = agentCommission + platformCommission; // Total = 1.5%

  return {
    totalFee,
    agentCommission,
    platformCommission
  };
};

export const validateSufficientBalance = (currentBalance: number, withdrawalAmount: number) => {
  if (currentBalance < withdrawalAmount) {
    throw new Error(`Solde insuffisant. Solde actuel: ${currentBalance} FCFA, montant demandé: ${withdrawalAmount} FCFA`);
  }
};
