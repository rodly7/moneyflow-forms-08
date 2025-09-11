
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
    
    // Get request body with better error handling
    let requestBody: BillPaymentRequest
    try {
      const body = await req.json()
      console.log('Request body received:', JSON.stringify(body, null, 2))
      
      if (!body || Object.keys(body).length === 0) {
        console.error('Empty or invalid request body')
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Corps de requête vide ou invalide' 
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }
      
      requestBody = body
    } catch (error) {
      console.error('Error parsing request body:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Format de données invalide: ' + error.message 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
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

    if (profile.balance < amount) {
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

    // Débiter le compte avec la fonction sécurisée
    const { error: balanceError } = await supabase.rpc('secure_increment_balance', {
      target_user_id: user_id,
      amount: -amount,
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
          amount: amount,
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

    // SYSTÈME DE TRANSFERT AUTOMATIQUE POUR PAIEMENTS DE FACTURES
    if (recipient_phone) {
      try {
        console.log('🔍 Recherche du destinataire:', recipient_phone)
        
        // Recherche simple et directe d'abord
        let { data: recipientProfile, error: recipientError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .eq('phone', recipient_phone)
          .maybeSingle()
        
        // Si pas trouvé, essayer avec différentes normalisations
        if (!recipientProfile && !recipientError) {
          const normalized = recipient_phone.replace(/\D/g, '') // Garder seulement les chiffres
          const withoutCountryCode = normalized.slice(-9) // Derniers 9 chiffres
          
          console.log('🔍 Recherche alternative:', { normalized, withoutCountryCode })
          
          // Recherche par pattern de fin de numéro
          const { data: foundProfile } = await supabase
            .from('profiles')
            .select('id, full_name, phone')
            .or(`phone.ilike.%${withoutCountryCode},phone.ilike.%${normalized}`)
            .limit(1)
            .maybeSingle()
          
          recipientProfile = foundProfile
        }

        if (recipientProfile) {
          console.log('✅ Destinataire trouvé:', { 
            id: recipientProfile.id, 
            name: recipientProfile.full_name,
            phone: recipientProfile.phone 
          })
          
          // Commission SendFlow (1.5%)
          const commissionRate = 0.015
          const commission = Math.round(amount * commissionRate)
          const netAmount = amount - commission
          
          console.log('💰 Commission calculée:', { amount, commission, netAmount })
          
          // Créditer le destinataire
          const { error: creditError } = await supabase.rpc('secure_increment_balance', {
            target_user_id: recipientProfile.id,
            amount: netAmount,
            operation_type: 'bill_payment_received',
            performed_by: user_id
          })

          if (creditError) {
            console.error('❌ Erreur crédit destinataire:', creditError)
            throw new Error('Erreur lors du crédit du destinataire')
          }

          console.log('✅ Destinataire crédité:', netAmount, 'XAF')
          
          // Enregistrer le transfert
          await supabase
            .from('transfers')
            .insert({
              sender_id: user_id,
              recipient_id: recipientProfile.id,
              recipient_phone: recipient_phone,
              recipient_full_name: recipientProfile.full_name,
              amount: amount,
              fees: commission,
              status: 'completed',
              currency: 'XAF',
              transfer_type: 'bill_payment'
            })
            
          console.log('✅ Transaction enregistrée')
            
        } else {
          console.log('⚠️ Destinataire non trouvé pour:', recipient_phone)
          console.log('💸 Paiement débité mais pas de compte à créditer')
        }
      } catch (error) {
        console.error('❌ Erreur système de transfert:', error)
        // Le paiement continue même si le transfert échoue
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
