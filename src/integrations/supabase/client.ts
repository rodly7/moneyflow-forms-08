
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://msasycggbiwyxlczknwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYXN5Y2dnYml3eXhsY3prbndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjU5MTMsImV4cCI6MjA1Mjk0MTkxM30.Ezb5GjSg8ApUWR5iNMvVS9bSA7oxudUuYOP2g2ugB_4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour calculer les frais de transfert selon les nouvelles règles
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
    // Transfert national : 1%
    rate = 1;
    fee = amount * 0.01;
    moneyFlowCommission = fee; // Tout pour SendFlow
  } else {
    // Transfert international : 6,5% si < 800,000 FCFA, sinon 5%
    if (amount < 800000) {
      rate = 6.5;
      fee = amount * 0.065;
    } else {
      rate = 5;
      fee = amount * 0.05;
    }
    
    // Pour les transferts internationaux, commission agent selon le type d'utilisateur
    if (userType === 'agent') {
      agentCommission = fee * 0.1; // 10% pour l'agent
      moneyFlowCommission = fee * 0.9; // 90% pour SendFlow
    } else {
      moneyFlowCommission = fee; // Tout pour SendFlow
    }
  }

  return {
    fee: Math.round(fee),
    rate,
    agentCommission: Math.round(agentCommission),
    moneyFlowCommission: Math.round(moneyFlowCommission)
  };
};

// Fonction pour formater les devises
export const formatCurrency = (amount: number, currency: string = 'XAF'): string => {
  if (isNaN(amount)) return '0 ' + currency;
  
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  
  return `${formatted} ${currency}`;
};

// Fonction pour obtenir la devise d'un pays
export const getCurrencyForCountry = (country: string): string => {
  const currencyMap: { [key: string]: string } = {
    'Cameroun': 'XAF',
    'Congo Brazzaville': 'XAF',
    'Gabon': 'XAF',
    'Guinée Équatoriale': 'XAF',
    'République Centrafricaine': 'XAF',
    'Tchad': 'XAF',
    'France': 'EUR',
    'Canada': 'CAD',
    'États-Unis': 'USD',
    'Royaume-Uni': 'GBP',
    'Suisse': 'CHF'
  };
  
  return currencyMap[country] || 'XAF';
};

// Fonction pour convertir les devises (taux fictifs pour démo)
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Taux de change fictifs par rapport au XAF
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
  
  // Convertir vers XAF puis vers la devise cible
  const xafAmount = amount / fromRate;
  return xafAmount * toRate;
};
