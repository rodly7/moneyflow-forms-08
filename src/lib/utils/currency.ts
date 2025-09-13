// Helper functions for currency formatting and calculations

// Regional country definitions
const centralAfricaCountries = [
  'Congo Brazzaville', 'Gabon', 'Cameroun', 'Guinée Équatoriale', 
  'République Centrafricaine', 'Tchad'
];

const westAfricaCountries = [
  'Sénégal', 'Côte d\'Ivoire', 'Mali', 'Burkina Faso', 'Niger', 
  'Guinée', 'Mauritanie', 'Gambie', 'Sierra Leone', 'Libéria'
];

const europeCountries = [
  'France', 'Italie', 'Espagne', 'Allemagne', 'Belgique', 
  'Pays-Bas', 'Suisse', 'Royaume-Uni'
];

// Helper function to determine country region
const getCountryRegion = (country: string): 'central_africa' | 'west_africa' | 'europe' | 'other' => {
  if (centralAfricaCountries.includes(country)) return 'central_africa';
  if (westAfricaCountries.includes(country)) return 'west_africa';
  if (europeCountries.includes(country)) return 'europe';
  return 'other';
};

// Calculate transfer fees with regional business rules
export const calculateFee = (
  amount: number,
  senderCountry: string,
  recipientCountry: string,
  userType: 'user' | 'agent' | 'admin' | 'sub_admin' | 'merchant' | 'provider' = 'user'
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
    // International transfer rates based on regions
    const senderRegion = getCountryRegion(senderCountry);
    const recipientRegion = getCountryRegion(recipientCountry);

    if (senderRegion === 'central_africa' && recipientRegion === 'central_africa') {
      // Central Africa to Central Africa: 3%
      rate = 3;
      fee = amount * 0.03;
    } else if (senderRegion === 'west_africa' && recipientRegion === 'west_africa') {
      // West Africa to West Africa: 3%
      rate = 3;
      fee = amount * 0.03;
    } else if ((senderRegion === 'central_africa' && recipientRegion === 'west_africa') ||
               (senderRegion === 'west_africa' && recipientRegion === 'central_africa')) {
      // Central Africa ↔ West Africa: 6%
      rate = 6;
      fee = amount * 0.06;
    } else if ((senderRegion === 'europe' && (recipientRegion === 'central_africa' || recipientRegion === 'west_africa')) ||
               ((senderRegion === 'central_africa' || senderRegion === 'west_africa') && recipientRegion === 'europe')) {
      // Europe ↔ Africa: 3%
      rate = 3;
      fee = amount * 0.03;
    } else {
      // Default international rate: 6%
      rate = 6;
      fee = amount * 0.06;
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
