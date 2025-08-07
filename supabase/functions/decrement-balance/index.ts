
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
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request body
    const { user_id, amount } = await req.json()
    
    if (!user_id || !amount) {
      throw new Error('Missing required fields: user_id and amount are required')
    }

    // Check if user exists and has sufficient balance
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user_id)
      .single()
    
    if (userError || !user) {
      throw new Error('User not found')
    }
    
    if (user.balance < amount) {
      throw new Error('Insufficient balance')
    }

    // Decrement user balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: user.balance - amount })
      .eq('id', user_id)
    
    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Balance decremented successfully',
        new_balance: user.balance - amount
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }), 
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
