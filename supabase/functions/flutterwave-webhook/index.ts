import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FlutterwaveWebhookPayload {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    customer: {
      email: string;
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const FLUTTERWAVE_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY')
    if (!FLUTTERWAVE_SECRET_KEY) {
      throw new Error('FLUTTERWAVE_SECRET_KEY is not set')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are not set')
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify webhook signature
    const flutterwaveSignature = req.headers.get('verif-hash')
    if (!flutterwaveSignature) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Parse webhook payload
    const payload: FlutterwaveWebhookPayload = await req.json()
    console.log('Received Flutterwave webhook:', payload)

    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const txRef = payload.data.tx_ref
      
      // Update recharge status and provider transaction ID
      const { data: recharge, error: rechargeError } = await supabase
        .from('recharges')
        .update({
          status: 'completed',
          provider_transaction_id: payload.data.flw_ref
        })
        .eq('transaction_reference', txRef)
        .select('user_id, amount')
        .single()

      if (rechargeError) {
        console.error('Error updating recharge:', rechargeError)
        throw rechargeError
      }

      if (!recharge) {
        throw new Error('Recharge not found')
      }

      // Update user balance
      const { error: balanceError } = await supabase.rpc('increment_balance', {
        user_id: recharge.user_id,
        amount: recharge.amount
      })

      if (balanceError) {
        console.error('Error updating balance:', balanceError)
        throw balanceError
      }

      console.log(`Successfully processed payment for transaction ${txRef}`)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})