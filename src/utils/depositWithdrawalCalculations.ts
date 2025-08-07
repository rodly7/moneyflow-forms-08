
export const calculateDepositFees = (amount: number, hasCompletedDailyQuota: boolean = false, dailyVolume: number = 0) => {
  const DAILY_QUOTA = 500000; // Quota journalier de 500,000
  const currentHour = new Date().getHours();
  const isBefore19h = currentHour < 19;
  
  // Commission pour les agents sur les dépôts
  const baseCommissionRate = 0.005; // 0,5% de base
  const bonusCommissionRate = 0.01; // 1% si quota atteint avant 19h
  
  // Vérifier si le quota est atteint avant 19h
  const quotaReachedBefore19h = (dailyVolume + amount) >= DAILY_QUOTA && isBefore19h;
  
  const agentCommissionRate = quotaReachedBefore19h ? bonusCommissionRate : baseCommissionRate;
  const agentCommission = Math.round(amount * agentCommissionRate);
  
  // Pas de frais pour le client sur les dépôts
  const totalFee = 0;
  const platformCommission = 0;

  return {
    totalFee,
    agentCommission,
    platformCommission
  };
};

export const calculateWithdrawalFees = (amount: number, userRole: string = 'user') => {
  // Pour les agents : pas de frais sur les retraits mais ils reçoivent une commission
  if (userRole === 'agent') {
    return {
      totalFee: 0,
      agentCommission: 0,
      platformCommission: 0
    };
  }
  
  // Pour les utilisateurs normaux : pas de frais pour le client
  // L'agent reçoit 0,2% de commission sur les retraits
  const agentCommissionRate = 0.002; // 0,2%
  const agentCommission = Math.round(amount * agentCommissionRate);
  
  const totalFee = 0; // Pas de frais pour le client
  const platformCommission = 0; // Pas de commission entreprise affichée

  return {
    totalFee,
    agentCommission,
    platformCommission
  };
};
