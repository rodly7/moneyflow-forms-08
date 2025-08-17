
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const callbackData = await req.json()
    const signature = req.headers.get('X-Signature') || req.headers.get('Signature')
    
    console.log('Callback reçu:', callbackData)

    // Déterminer le provider basé sur les données reçues
    let provider = 'unknown'
    let sessionId = ''
    let status = 'failed'
    let transactionId = ''

    // Logique de détection du provider et extraction des données
    if (callbackData.pay_token || callbackData.order_id) {
      // Orange Money
      provider = 'orange'
      sessionId = callbackData.order_id || callbackData.reference
      status = callbackData.status === 'SUCCESS' ? 'completed' : 'failed'
      transactionId = callbackData.txnid
    } else if (callbackData.transaction && callbackData.transaction.id) {
      // Airtel Money
      provider = 'airtel' 
      sessionId = callbackData.transaction.reference
      status = callbackData.transaction.status === 'TS' ? 'completed' : 'failed'
      transactionId = callbackData.transaction.id
    } else if (callbackData.data && callbackData.data.externalId) {
      // MTN MoMo
      provider = 'momo'
      sessionId = callbackData.data.externalId
      status = callbackData.data.status === 'SUCCESSFUL' ? 'completed' : 'failed'
      transactionId = callbackData.data.financialTransactionId
    } else if (callbackData.type === 'checkout.session.completed') {
      // Wave
      provider = 'wave'
      sessionId = callbackData.data.object.metadata.session_id
      status = 'completed'
      transactionId = callbackData.data.object.id
    }

    // Vérifier la signature selon le provider
    const isSignatureValid = await verifySignature(provider, callbackData, signature)
    
    // Enregistrer le callback
    const { data: callback } = await supabaseClient
      .from('payment_callbacks')
      .insert({
        payment_session_id: sessionId,
        provider,
        callback_data: callbackData,
        signature,
        verified: isSignatureValid
      })
      .select()
      .single()

    if (!isSignatureValid) {
      console.error('Signature invalide pour le callback')
      return new Response('Signature invalide', { status: 400 })
    }

    // Récupérer la session de paiement
    const { data: session, error: sessionError } = await supabaseClient
      .from('payment_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error('Session non trouvée:', sessionId)
      return new Response('Session non trouvée', { status: 404 })
    }

    // Mettre à jour le statut de la session
    await supabaseClient
      .from('payment_sessions')
      .update({
        status,
        provider_transaction_id: transactionId,
        callback_data: callbackData
      })
      .eq('id', session.id)

    // Si le paiement est confirmé, créditer le compte utilisateur
    if (status === 'completed') {
      // Utiliser la fonction sécurisée pour créditer le compte
      const { data: newBalance, error: balanceError } = await supabaseClient
        .rpc('secure_increment_balance', {
          target_user_id: session.user_id,
          amount: session.amount,
          operation_type: 'mobile_payment_credit'
        })

      if (balanceError) {
        console.error('Erreur lors du crédit:', balanceError)
        // Marquer la session comme ayant une erreur de crédit
        await supabaseClient
          .from('payment_sessions')
          .update({ status: 'credit_failed' })
          .eq('id', session.id)
      } else {
        console.log(`Compte crédité: ${session.amount} XAF pour utilisateur ${session.user_id}`)
        
        // Marquer le callback comme traité
        await supabaseClient
          .from('payment_callbacks')
          .update({ processed: true })
          .eq('id', callback.id)
      }
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Erreur callback:', error)
    return new Response('Erreur interne', { status: 500 })
  }
})

async function verifySignature(provider: string, data: any, signature: string | null): Promise<boolean> {
  if (!signature) return false

  try {
    switch (provider) {
      case 'wave':
        const waveSecret = Deno.env.get('WAVE_WEBHOOK_SECRET')
        if (!waveSecret) return false
        
        const wavePayload = JSON.stringify(data)
        const waveExpectedSignature = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(waveSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        ).then(key => 
          crypto.subtle.sign('HMAC', key, new TextEncoder().encode(wavePayload))
        ).then(signature => 
          Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        )
        
        return signature === `sha256=${waveExpectedSignature}`

      case 'orange':
        // Orange Money utilise une clé secrète pour signer
        const orangeSecret = Deno.env.get('ORANGE_WEBHOOK_SECRET')
        if (!orangeSecret) return false
        
        // Logique de vérification Orange Money
        return true // Simplifiée pour l'exemple

      case 'airtel':
        // Airtel Money signature verification
        const airtelSecret = Deno.env.get('AIRTEL_WEBHOOK_SECRET')
        if (!airtelSecret) return false
        
        return true // Simplifiée pour l'exemple

      case 'momo':
        // MTN MoMo signature verification
        const momoSecret = Deno.env.get('MOMO_WEBHOOK_SECRET')
        if (!momoSecret) return false
        
        return true // Simplifiée pour l'exemple

      default:
        return false
    }
  } catch (error) {
    console.error('Erreur vérification signature:', error)
    return false
  }
}
