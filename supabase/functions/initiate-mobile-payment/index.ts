
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  amount: number
  provider: 'wave' | 'orange' | 'airtel' | 'momo'
  phone?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { amount, provider, phone }: PaymentRequest = await req.json()

    // Validation
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Montant invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Générer un session_id unique
    const sessionId = crypto.randomUUID()

    let paymentData: any = {}
    let checkoutUrl: string | null = null
    let ussdCode: string | null = null

    // Configuration des APIs selon le provider
    switch (provider) {
      case 'wave':
        // Intégration Wave API
        paymentData = await initiateWavePayment(amount, sessionId, user.id)
        checkoutUrl = paymentData.checkout_url
        break
      
      case 'orange':
        // Intégration Orange Money API
        paymentData = await initiateOrangePayment(amount, phone || '', sessionId)
        ussdCode = paymentData.ussd_code
        break
      
      case 'airtel':
        // Intégration Airtel Money API
        paymentData = await initiateAirtelPayment(amount, phone || '', sessionId)
        ussdCode = paymentData.ussd_code
        break
      
      case 'momo':
        // Intégration MTN MoMo API
        paymentData = await initiateMoMoPayment(amount, phone || '', sessionId)
        ussdCode = paymentData.ussd_code
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Provider non supporté' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Enregistrer la session de paiement
    const { data: session, error } = await supabaseClient
      .from('payment_sessions')
      .insert({
        user_id: user.id,
        amount,
        currency: 'XAF',
        payment_method: provider,
        provider,
        session_id: sessionId,
        checkout_url: checkoutUrl,
        ussd_code: ussdCode,
        provider_transaction_id: paymentData.transaction_id
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création session:', error)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création de la session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        sessionId,
        checkoutUrl,
        ussdCode,
        provider,
        amount,
        status: 'pending'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Fonctions d'intégration pour chaque provider
async function initiateWavePayment(amount: number, sessionId: string, userId: string) {
  const waveApiKey = Deno.env.get('WAVE_API_KEY')
  const waveApiUrl = Deno.env.get('WAVE_API_URL') || 'https://api.wave.com'
  
  const response = await fetch(`${waveApiUrl}/v1/checkout/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${waveApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount * 100, // Wave utilise les centimes
      currency: 'XAF',
      success_url: `${Deno.env.get('FRONTEND_URL')}/payment/success?session=${sessionId}`,
      cancel_url: `${Deno.env.get('FRONTEND_URL')}/payment/cancel?session=${sessionId}`,
      webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-callback`,
      metadata: {
        user_id: userId,
        session_id: sessionId
      }
    })
  })

  return await response.json()
}

async function initiateOrangePayment(amount: number, phone: string, sessionId: string) {
  const orangeApiKey = Deno.env.get('ORANGE_API_KEY')
  const orangeApiUrl = Deno.env.get('ORANGE_API_URL') || 'https://api.orange.com'
  
  const response = await fetch(`${orangeApiUrl}/orange-money-webpay/dev/v1/webpayment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${orangeApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      merchant_key: Deno.env.get('ORANGE_MERCHANT_KEY'),
      currency: 'XAF',
      order_id: sessionId,
      amount: amount,
      return_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-callback`,
      cancel_url: `${Deno.env.get('FRONTEND_URL')}/payment/cancel?session=${sessionId}`,
      notif_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-callback`,
      lang: 'fr',
      reference: sessionId
    })
  })

  const data = await response.json()
  return {
    transaction_id: data.pay_token,
    ussd_code: `*144*${data.pay_token}#`
  }
}

async function initiateAirtelPayment(amount: number, phone: string, sessionId: string) {
  const airtelApiKey = Deno.env.get('AIRTEL_API_KEY')
  const airtelApiUrl = Deno.env.get('AIRTEL_API_URL') || 'https://openapi.airtel.africa'
  
  const response = await fetch(`${airtelApiUrl}/merchant/v1/payments/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${airtelApiKey}`,
      'Content-Type': 'application/json',
      'X-Country': 'SN',
      'X-Currency': 'XAF'
    },
    body: JSON.stringify({
      reference: sessionId,
      subscriber: {
        country: 'SN',
        currency: 'XAF',
        msisdn: phone
      },
      transaction: {
        amount: amount,
        country: 'SN',
        currency: 'XAF',
        id: sessionId
      }
    })
  })

  const data = await response.json()
  return {
    transaction_id: data.data.transaction.id,
    ussd_code: `*555*${sessionId}#`
  }
}

async function initiateMoMoPayment(amount: number, phone: string, sessionId: string) {
  const momoApiKey = Deno.env.get('MOMO_API_KEY')
  const momoApiUrl = Deno.env.get('MOMO_API_URL') || 'https://sandbox.momodeveloper.mtn.com'
  
  const response = await fetch(`${momoApiUrl}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${momoApiKey}`,
      'Content-Type': 'application/json',
      'X-Reference-Id': sessionId,
      'X-Target-Environment': 'sandbox'
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: 'XAF',
      externalId: sessionId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phone
      },
      payerMessage: 'Recharge compte',
      payeeNote: `Recharge ${amount} XAF`
    })
  })

  return {
    transaction_id: sessionId,
    ussd_code: `*126*${sessionId}#`
  }
}
