import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple PIN verification for demo - in production, use proper encryption
function verifyPin(inputPin: string, storedPin: string, userId: string): boolean {
  console.log('🔍 Verification PIN:', { inputPin, storedPin, userId });
  // For now, simple comparison. In production, implement proper encryption/decryption
  return inputPin === storedPin;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { phone, pin } = await req.json()
    
    console.log('🔐 PIN Auth attempt for:', phone)

    if (!phone || !pin) {
      throw new Error('Numéro de téléphone et PIN requis')
    }

    // Normaliser le numéro
    const normalizedPhone = phone.replace(/[^\d+]/g, '')
    console.log('📱 Numéro normalisé:', normalizedPhone)
    
    // D'abord, lister tous les numéros pour déboguer
    const { data: allProfiles, error: debugError } = await supabaseAdmin
      .from('profiles')
      .select('phone, full_name, pin_code')
      .not('pin_code', 'is', null)
      .limit(10)
    
    console.log('🔍 Tous les profils avec PIN:', allProfiles)
    
    // Récupérer l'utilisateur avec son PIN
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, pin_code, phone, full_name')
      .eq('phone', normalizedPhone)
      .single()

    console.log('🔍 Recherche pour:', normalizedPhone)
    console.log('🔍 Profil trouvé:', profile)
    console.log('🔍 Erreur profile:', profileError)

    if (profileError || !profile) {
      console.error('❌ User not found:', { normalizedPhone, profileError })
      
      // Essayons aussi une recherche avec LIKE pour trouver des correspondances partielles
      const { data: similarProfiles, error: similarError } = await supabaseAdmin
        .from('profiles')
        .select('phone, full_name')
        .like('phone', `%${normalizedPhone.slice(-8)}%`)
        .limit(5)
      
      console.log('🔍 Profils similaires:', similarProfiles)
      
      throw new Error(`Utilisateur non trouvé avec ce numéro de téléphone: ${normalizedPhone}`)
    }

    if (!profile.pin_code) {
      throw new Error('PIN non configuré. Connectez-vous avec votre mot de passe pour créer un PIN.')
    }

    // Vérifier le PIN
    const isValidPin = verifyPin(pin, profile.pin_code, profile.id)
    
    if (!isValidPin) {
      throw new Error('PIN incorrect')
    }

    console.log('✅ PIN verified for user:', profile.id)

    // Marquer le PIN comme vérifié et retourner les informations utilisateur
    return new Response(
      JSON.stringify({
        success: true,
        message: 'PIN vérifié avec succès',
        user: {
          id: profile.id,
          phone: profile.phone,
          full_name: profile.full_name
        },
        verified: true
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ PIN Auth error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})