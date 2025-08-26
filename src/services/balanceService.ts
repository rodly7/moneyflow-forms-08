
import { supabase } from "@/integrations/supabase/client";

export const getUserBalance = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('balance, country')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return { 
    balance: data.balance || 0,
    country: data.country || 'Congo Brazzaville'
  };
};

export const rechargeUserBalance = async (
  userId: string,
  amount: number,
  paymentMethod: string = 'mobile_money',
  country: string = 'Congo Brazzaville'
) => {
  try {
    console.log("💰 Recharge utilisateur:", { userId, amount, paymentMethod });

    // Générer une référence de transaction
    const transactionReference = `RECH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Créditer le compte utilisateur
    const { error: balanceError } = await supabase.rpc('increment_balance', {
      user_id: userId,
      amount: amount
    });

    if (balanceError) {
      console.error("❌ Erreur lors du crédit:", balanceError);
      throw new Error("Erreur lors du crédit du compte");
    }

    // Enregistrer la transaction de recharge avec le nouveau numéro
    const { error: rechargeError } = await supabase
      .from('recharges')
      .insert({
        user_id: userId,
        amount: amount,
        country: country,
        payment_method: paymentMethod,
        payment_phone: "066164686", // Nouveau numéro Mobile Money sans indicatif
        payment_provider: 'mobile_money',
        transaction_reference: transactionReference,
        status: 'completed'
      });

    if (rechargeError) {
      console.error("❌ Erreur enregistrement recharge:", rechargeError);
      throw new Error("Erreur lors de l'enregistrement de la recharge");
    }

    console.log("✅ Recharge effectuée avec succès");
    return { 
      success: true, 
      transactionReference,
      newBalance: amount 
    };
  } catch (error) {
    console.error("❌ Erreur lors de la recharge:", error);
    throw error;
  }
};

export const processAutomaticRecharge = async (
  userId: string,
  amount: number,
  country: string = 'Congo Brazzaville'
) => {
  return await rechargeUserBalance(userId, amount, 'automatic_recharge', country);
};
