
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface BillPaymentRequest {
  user_id: string;
  amount: number;
  bill_type?: string;
  provider?: string;
  account_number?: string;
  recipient_phone?: string;
  bill_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Configuration serveur manquante' 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Read raw body text to avoid JSON parsing issues
    let requestBody: BillPaymentRequest
    try {
      const rawText = await req.text()
      console.log('Raw request body:', rawText || '(empty)')

      if (!rawText) {
        return new Response(
          JSON.stringify({ success: false, message: 'Corps de requête vide' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const parsed = JSON.parse(rawText)
      if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'Corps de requête invalide' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      requestBody = parsed as BillPaymentRequest
    } catch (error) {
      console.error('Error parsing request body:', error)
      return new Response(
        JSON.stringify({ success: false, message: 'Format de données invalide: ' + (error as Error).message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { user_id, amount, bill_type, provider, account_number, recipient_phone, bill_id } = requestBody

    // Validation des paramètres requis
    if (!user_id || !amount || (!bill_type && !bill_id)) {
      console.error('Missing required parameters:', { user_id, amount, bill_type, bill_id })
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Paramètres manquants (user_id, amount, bill_type ou bill_id requis)' 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('Processing bill payment:', { user_id, amount, bill_type, provider, account_number })

    // Calculer le montant total avec frais de 1.5%
    const feeRate = 0.015;
    const fees = Math.round(amount * feeRate);
    const totalAmount = amount + fees;

    console.log('Fee calculation:', { amount, fees, totalAmount })

    // Vérifier le solde de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user_id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Utilisateur introuvable' 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    if (profile.balance < totalAmount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Solde insuffisant pour effectuer ce paiement' 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Débiter le compte (montant + frais) uniquement si aucun transfert instantané n'est demandé
    if (!recipient_phone) {
      const { error: balanceError } = await supabase.rpc('secure_increment_balance', {
        target_user_id: user_id,
        amount: -totalAmount,
        operation_type: 'bill_payment',
        performed_by: user_id
      })

      if (balanceError) {
        console.error('Balance update error:', balanceError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Erreur lors de la mise à jour du solde' 
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        )
      }
    }

    // Si c'est un paiement de facture automatique, mettre à jour le statut
    if (bill_id) {
      const { error: billError } = await supabase
        .from('automatic_bills')
        .update({ 
          status: 'paid',
          last_payment_date: new Date().toISOString(),
          payment_attempts: 0
        })
        .eq('id', bill_id)

      if (billError) {
        console.error('Bill update error:', billError)
        // Rollback balance update
        await supabase.rpc('secure_increment_balance', {
          target_user_id: user_id,
          amount: totalAmount,
          operation_type: 'refund',
          performed_by: user_id
        })
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Erreur lors de la mise à jour de la facture' 
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        )
      }
    } else {
      // Pour les paiements manuels, créer une entrée dans automatic_bills pour historique
      const { error: billInsertError } = await supabase
        .from('automatic_bills')
        .insert({
          user_id: user_id,
          bill_name: `${bill_type || 'payment'}_${provider || 'manual'}`,
          amount: amount,
          status: 'completed',
          payment_number: recipient_phone || '',
          meter_number: account_number || '',
          due_date: new Date().toISOString().split('T')[0],
          recurrence: 'once'
        })

      if (billInsertError) {
        console.error('Bill insert error:', billInsertError)
        // Continue anyway as this is just for history
      }
    }

    // SYSTÈME DE TRANSFERT AUTOMATIQUE POUR PAIEMENTS DE FACTURES (logique inline identique à process-money-transfer)
    if (recipient_phone) {
      console.log('🔧 Début du transfert instantané (inline)')
      try {
        // 1) Débiter l'expéditeur du montant total avec frais
        const { data: newSenderBalance, error: debitError } = await supabase.rpc('increment_balance', {
          user_id: user_id,
          amount: -totalAmount
        })
        if (debitError) {
          console.error('❌ Erreur débit expéditeur:', debitError)
          return new Response(
            JSON.stringify({ success: false, message: 'Erreur lors du débit du compte' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        // 2) Obtenir les données utilisateur pour l'historique
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('full_name, phone, country')
          .eq('id', user_id)
          .single()

        if (userError) {
          console.error('❌ Erreur profil utilisateur:', userError)
          // Rollback du débit
          await supabase.rpc('increment_balance', { user_id: user_id, amount: totalAmount })
          return new Response(
            JSON.stringify({ success: false, message: 'Erreur lors de la récupération du profil utilisateur' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        // 3) Rechercher le destinataire par téléphone
        let recipientProfile = null
        const { data: foundRecipient } = await supabase
          .from('profiles')
          .select('id, full_name, phone, country')
          .eq('phone', recipient_phone)
          .maybeSingle()

        if (foundRecipient) {
          recipientProfile = foundRecipient
        } else {
          // Recherche alternative avec normalisation
          const normalized = recipient_phone.replace(/\D/g, '')
          const withoutCountryCode = normalized.slice(-9)
          
          const { data: altRecipient } = await supabase
            .from('profiles')
            .select('id, full_name, phone, country')
            .or(`phone.ilike.%${withoutCountryCode},phone.ilike.%${normalized}`)
            .limit(1)
            .maybeSingle()
          
          recipientProfile = altRecipient
        }

        if (recipientProfile) {
          // 3a) Créditer le destinataire du montant original (sans frais)
          const { error: creditError } = await supabase.rpc('increment_balance', {
            user_id: recipientProfile.id,
            amount: amount
          })
          if (creditError) {
            console.error('❌ Erreur crédit destinataire:', creditError)
            // Rollback débit
            await supabase.rpc('increment_balance', { user_id: user_id, amount: totalAmount })
            return new Response(
              JSON.stringify({ success: false, message: 'Crédit du destinataire impossible' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          }

          // 4) Enregistrer le transfert complété (non bloquant)
          const { error: transferError } = await supabase
            .from('transfers')
            .insert({
              sender_id: user_id,
              recipient_id: recipientProfile.id,
              recipient_phone: recipient_phone,
              recipient_full_name: recipientProfile.full_name,
              recipient_country: recipientProfile.country || 'Congo Brazzaville',
              amount: amount,
              fees: fees,
              status: 'completed',
              currency: 'XAF',
              description: `Paiement facture ${bill_type || 'manual'} - ${provider || 'manual'} - ${account_number || ''}`,
              sender_name: userProfile.full_name,
              sender_phone: userProfile.phone
            })
          if (transferError) console.error('⚠️ Erreur enregistrement transfert:', transferError)

          // Enregistrer également côté marchand pour l'affichage sans accès au profil client
          try {
            await supabase
              .from('merchant_payments')
              .insert({
                user_id: user_id,
                merchant_id: recipientProfile.id,
                business_name: provider || recipientProfile.full_name,
                amount: amount,
                currency: 'XAF',
                status: 'completed',
                description: `Paiement facture ${bill_type || 'manuel'}`,
                client_name: userProfile.full_name,
                client_phone: userProfile.phone,
                meter_number: account_number || '',
                bill_type: bill_type || 'manuel'
              })
          } catch (e) {
            console.error('⚠️ Erreur enregistrement merchant_payments:', e)
          }

          console.log('✅ Transfert instantané réussi:', { amount, fees, totalAmount })
        } else {
          // 3b) Destinataire non trouvé -> créer un transfert en attente (pas de rollback, comme process-money-transfer)
          const claim_code = Math.random().toString(36).substring(2, 8).toUpperCase()
          const { error: pendingError } = await supabase
            .from('pending_transfers')
            .insert({
              sender_id: user_id,
              recipient_phone: recipient_phone,
              amount: amount,
              fees: fees,
              currency: 'XAF',
              claim_code: claim_code,
              status: 'pending'
            })
          if (pendingError) {
            console.error('❌ Erreur création transfert en attente:', pendingError)
            // Rollback débit
            await supabase.rpc('increment_balance', { user_id: user_id, amount: totalAmount })
            return new Response(
              JSON.stringify({ success: false, message: 'Erreur lors de la création du transfert en attente' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
          }

          console.log('⏳ Destinataire introuvable: transfert en attente créé')
        }
      } catch (error) {
        console.error('❌ Erreur transfert instantané (inline):', error)
        // Rollback par sécurité
        await supabase.rpc('increment_balance', { user_id: user_id, amount: amount })
        return new Response(
          JSON.stringify({ success: false, message: 'Erreur système lors du transfert' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    }

    // Enregistrer l'historique de paiement
    const { error: historyError } = await supabase
      .from('bill_payment_history')
      .insert({
        bill_id: bill_id || null,
        user_id: user_id,
        amount: amount,
        status: 'success',
        balance_before: profile.balance,
        balance_after: profile.balance - amount,
        attempt_number: 1,
        payment_date: new Date().toISOString()
      })

    if (historyError) {
      console.error('History insert error:', historyError)
    }

    console.log('Bill payment successful')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paiement effectué avec succès',
        amount: amount,
        new_balance: profile.balance - amount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Erreur interne du serveur: ' + error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
