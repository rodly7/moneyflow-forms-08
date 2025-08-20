
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { 
      sender_id, 
      recipient_identifier, 
      transfer_amount, 
      transfer_fees 
    } = await req.json()

    console.log('🔄 Processing money transfer:', {
      sender_id,
      recipient_identifier,
      transfer_amount,
      transfer_fees
    })

    // Vérifier le solde de l'expéditeur
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('balance, full_name, country')
      .eq('id', sender_id)
      .single()

    if (senderError || !senderProfile) {
      console.error('❌ Erreur expéditeur:', senderError)
      throw new Error('Expéditeur non trouvé')
    }

    const totalAmount = transfer_amount + transfer_fees
    if (senderProfile.balance < totalAmount) {
      throw new Error('Solde insuffisant')
    }

    // Chercher le destinataire par téléphone
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, country')
      .eq('phone', recipient_identifier)
      .maybeSingle()

    if (recipientError) {
      console.error('❌ Erreur recherche destinataire:', recipientError)
      throw new Error('Erreur lors de la recherche du destinataire')
    }

    // Débiter l'expéditeur
    const { error: debitError } = await supabase.rpc('increment_balance', {
      user_id: sender_id,
      amount: -totalAmount
    })

    if (debitError) {
      console.error('❌ Erreur débit:', debitError)
      throw new Error('Erreur lors du débit')
    }

    if (recipientProfile) {
      // Destinataire trouvé - transfert direct
      console.log('✅ Destinataire trouvé, transfert direct')
      
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: recipientProfile.id,
        amount: transfer_amount
      })

      if (creditError) {
        console.error('❌ Erreur crédit:', creditError)
        // Rollback
        await supabase.rpc('increment_balance', {
          user_id: sender_id,
          amount: totalAmount
        })
        throw new Error('Erreur lors du crédit')
      }

      // Enregistrer le transfert complété
      const { data: transfer, error: transferError } = await supabase
        .from('transfers')
        .insert({
          sender_id: sender_id,
          recipient_id: recipientProfile.id,
          recipient_full_name: recipientProfile.full_name,
          recipient_phone: recipientProfile.phone,
          recipient_country: recipientProfile.country,
          amount: transfer_amount,
          fees: transfer_fees,
          currency: 'XAF',
          status: 'completed'
        })
        .select()
        .single()

      if (transferError) {
        console.error('⚠️ Erreur enregistrement transfert:', transferError)
      }

      return new Response(
        JSON.stringify({
          success: true,
          transfer_id: transfer?.id,
          status: 'completed',
          message: 'Transfert effectué avec succès'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Destinataire non trouvé - transfert en attente
      console.log('⏳ Destinataire non trouvé, création transfert en attente')
      
      // Générer un code de réclamation
      const claim_code = Math.random().toString(36).substring(2, 8).toUpperCase()

      const { data: pendingTransfer, error: pendingError } = await supabase
        .from('pending_transfers')
        .insert({
          sender_id: sender_id,
          recipient_phone: recipient_identifier,
          recipient_email: '', // Champ requis mais vide pour les transferts par téléphone
          amount: transfer_amount,
          fees: transfer_fees,
          currency: 'XAF',
          claim_code: claim_code,
          status: 'pending'
        })
        .select()
        .single()

      if (pendingError) {
        console.error('❌ Erreur transfert en attente:', pendingError)
        // Rollback
        await supabase.rpc('increment_balance', {
          user_id: sender_id,
          amount: totalAmount
        })
        throw new Error('Erreur lors de la création du transfert en attente')
      }

      return new Response(
        JSON.stringify({
          success: true,
          transfer_id: pendingTransfer.id,
          status: 'pending',
          claim_code: claim_code,
          message: 'Transfert en attente créé'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('❌ Erreur transfert:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
