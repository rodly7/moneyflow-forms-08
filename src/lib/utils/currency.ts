// Helper functions for currency formatting and calculations

// Calculate transfer fees with current business rules
export const calculateFee = (
  amount: number,
  senderCountry: string,
  recipientCountry: string,
  userType: 'user' | 'agent' | 'admin' | 'sub_admin' = 'user'
) => {
  const isNational = senderCountry === recipientCountry;
  let fee = 0;
  let rate = 0;
  let agentCommission = 0;
  let moneyFlowCommission = 0;

  if (isNational) {
    // National transfer: 1%
    rate = 1;
    fee = amount * 0.01;
    moneyFlowCommission = fee; // All for SendFlow
  } else {
    // International transfer: 6.5% if < 800,000 XAF, else 5%
    if (amount < 800000) {
      rate = 6.5;
      fee = amount * 0.065;
    } else {
      rate = 5;
      fee = amount * 0.05;
    }

    // For international transfers, agent commission if user is an agent
    if (userType === 'agent') {
      agentCommission = fee * 0.1; // 10% for the agent
      moneyFlowCommission = fee * 0.9; // 90% for SendFlow
    } else {
      moneyFlowCommission = fee; // All for SendFlow
    }
  }

  return {
    fee: Math.round(fee),
    rate,
    agentCommission: Math.round(agentCommission),
    moneyFlowCommission: Math.round(moneyFlowCommission)
  };
};

// Format currency with locale fr-FR and no decimals
export const formatCurrency = (amount: number, currency: string = 'XAF'): string => {
  if (isNaN(amount)) return '0 ' + currency;

  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  return `${formatted} ${currency}`;
};

// Map country to currency code
export const getCurrencyForCountry = (country: string): string => {
  const currencyMap: { [key: string]: string } = {
    'Cameroun': 'XAF',
    'Congo Brazzaville': 'XAF',
    'Gabon': 'XAF',
    'Guinée Équatoriale': 'XAF',
    'République Centrafricaine': 'XAF',
    'Tchad': 'XAF',
    'Sénégal': 'XAF',
    'France': 'EUR',
    'Italie': 'EUR',
    'Canada': 'CAD',
    'États-Unis': 'USD',
    'Royaume-Uni': 'GBP',
    'Suisse': 'CHF'
  };

  return currencyMap[country] || 'XAF';
};

// Simple currency conversion using demo rates against XAF
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;

  // Demo exchange rates relative to XAF
  const exchangeRates: { [key: string]: number } = {
    'XAF': 1,
    'EUR': 655.957,
    'USD': 580.5,
    'CAD': 430.2,
    'GBP': 735.8,
    'CHF': 640.1
  };

  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;

  // Convert to XAF then to target currency
  const xafAmount = amount / fromRate;
  return xafAmount * toRate;
};
