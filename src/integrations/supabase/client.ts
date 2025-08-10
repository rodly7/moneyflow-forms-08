import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour calculer les frais de transfert selon les nouvelles règles
export const calculateFee = (
  amount: number,
  senderCountry: string,
  recipientCountry: string,
  userType: 'user' | 'agent' = 'user'
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
