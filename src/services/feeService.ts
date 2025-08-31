import { supabase } from "@/integrations/supabase/client";

// Définition des types pour une meilleure lisibilité et maintenance
interface FeeResult {
  fee: number;
  rate: number;
  agentCommission?: number;
  moneyFlowCommission?: number;
}

// Définitions des régions par pays
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

// Fonction pour déterminer la région d'un pays
const getCountryRegion = (country: string): 'central_africa' | 'west_africa' | 'europe' | 'other' => {
  if (centralAfricaCountries.includes(country)) return 'central_africa';
  if (westAfricaCountries.includes(country)) return 'west_africa';
  if (europeCountries.includes(country)) return 'europe';
  return 'other';
};

/**
 * Calcule les frais de transfert en fonction du montant, des pays et du type d'utilisateur.
 * @param amount Montant du transfert.
 * @param senderCountry Pays de l'expéditeur.
 * @param recipientCountry Pays du destinataire.
 * @param userType Type d'utilisateur ('user', 'agent', 'admin', 'sub_admin'). Par défaut 'user'.
 * @returns Un objet contenant le montant des frais, le taux appliqué et les commissions (si applicables).
 */
export const calculateTransferFee = (
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
    // Transfert national : 0,6%
    rate = 0.6;
    fee = amount * 0.006;
    moneyFlowCommission = fee; // Tout pour SendFlow
  } else {
    // Transfert international selon les régions
    const senderRegion = getCountryRegion(senderCountry);
    const recipientRegion = getCountryRegion(recipientCountry);

    if (senderRegion === 'central_africa' && recipientRegion === 'central_africa') {
      // Afrique Centrale vers Afrique Centrale : 3%
      rate = 3;
      fee = amount * 0.03;
    } else if (senderRegion === 'west_africa' && recipientRegion === 'west_africa') {
      // Afrique Ouest vers Afrique Ouest : 3%
      rate = 3;
      fee = amount * 0.03;
    } else if ((senderRegion === 'central_africa' && recipientRegion === 'west_africa') ||
               (senderRegion === 'west_africa' && recipientRegion === 'central_africa')) {
      // Afrique Centrale ↔ Afrique Ouest : 6%
      rate = 6;
      fee = amount * 0.06;
    } else if ((senderRegion === 'europe' && (recipientRegion === 'central_africa' || recipientRegion === 'west_africa')) ||
               ((senderRegion === 'central_africa' || senderRegion === 'west_africa') && recipientRegion === 'europe')) {
      // Europe ↔ Afrique : 3%
      rate = 3;
      fee = amount * 0.03;
    } else {
      // Taux international par défaut : 6%
      rate = 6;
      fee = amount * 0.06;
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

/**
 * Calcule les frais pour un paiement de facture (toujours 1%).
 * @param amount Montant de la facture.
 * @returns Un objet contenant le montant des frais et le taux appliqué.
 */
export const calculateBillPaymentFee = (amount: number) => {
  // Frais de facture : 1%
  const fee = amount * 0.01;
  return {
    fee: Math.round(fee),
    rate: 1
  };
};

/**
 * Crédite les frais de transaction sur le compte de la plateforme.
 * @param transactionType Type de transaction ('transfer', 'bill_payment', 'withdrawal').
 * @param amount Montant de la transaction.
 */
export const creditTransactionFees = async (transactionType: string, amount: number): Promise<void> => {
  try {
    let fee = 0;
    
    switch (transactionType) {
      case 'transfer':
        // Calculer les frais selon les nouvelles règles
        if (amount < 800000) {
          fee = amount * 0.065; // 6.5%
        } else {
          fee = amount * 0.05; // 5%
        }
        break;
      case 'bill_payment':
        fee = amount * 0.01; // 1%
        break;
      case 'withdrawal':
        fee = amount * 0.005; // 0.5%
        break;
      default:
        fee = 0;
    }

    if (fee > 0) {
      // Créditer le compte de la plateforme avec les frais
      const { error } = await supabase.rpc('increment_balance', {
        user_id: '00000000-0000-0000-0000-000000000000', // ID spécial pour la plateforme
        amount: Math.round(fee)
      });

      if (error) {
        console.error('Erreur lors du crédit des frais:', error);
      }
    }
  } catch (error) {
    console.error('Erreur lors du traitement des frais:', error);
  }
};
