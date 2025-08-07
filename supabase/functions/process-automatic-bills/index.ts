import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting automatic bill processing...');

    // Traiter les rappels 24h avant
    await sendReminderNotifications();

    // Traiter les factures dues aujourd'hui
    await processDueBills();

    // Réessayer les factures en échec (tentatives quotidiennes)
    await retryFailedBills();

    return new Response(
      JSON.stringify({ success: true, message: 'Bills processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing bills:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function sendReminderNotifications() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Trouver les factures dues demain
  const { data: billsDueTomorrow, error } = await supabase
    .from('automatic_bills')
    .select('*')
    .eq('due_date', tomorrowStr)
    .eq('status', 'pending')
    .eq('is_automated', true);

  if (error) {
    console.error('Error fetching bills due tomorrow:', error);
    return;
  }

  for (const bill of billsDueTomorrow || []) {
    // Vérifier si notification déjà envoyée
    const { data: existingNotification } = await supabase
      .from('bill_notifications')
      .select('id')
      .eq('bill_id', bill.id)
      .eq('notification_type', 'reminder_24h')
      .gte('sent_at', new Date().toISOString().split('T')[0]);

    if (!existingNotification?.length) {
      // Envoyer notification de rappel
      await supabase.from('bill_notifications').insert({
        bill_id: bill.id,
        user_id: bill.user_id,
        notification_type: 'reminder_24h'
      });

      // Créer notification pour l'app
      await supabase.from('notifications').insert({
        title: 'Rappel de facture',
        message: `Votre facture "${bill.bill_name}" de ${bill.amount.toLocaleString()} XAF sera débitée demain automatiquement.`,
        notification_type: 'individual',
        priority: 'high',
        target_users: [bill.user_id],
        sent_by: bill.user_id
      });

      console.log(`Reminder sent for bill: ${bill.bill_name}`);
    }
  }
}

async function processDueBills() {
  const today = new Date().toISOString().split('T')[0];

  // Trouver les factures dues aujourd'hui, triées par priorité
  const { data: billsDueToday, error } = await supabase
    .from('automatic_bills')
    .select('*')
    .eq('due_date', today)
    .eq('status', 'pending')
    .eq('is_automated', true)
    .order('priority', { ascending: true }); // 1 = high priority first

  if (error) {
    console.error('Error fetching bills due today:', error);
    return;
  }

  for (const bill of billsDueToday || []) {
    // Vérifier si notification "due_today" déjà envoyée
    const { data: existingNotification } = await supabase
      .from('bill_notifications')
      .select('id')
      .eq('bill_id', bill.id)
      .eq('notification_type', 'due_today')
      .gte('sent_at', new Date().toISOString().split('T')[0]);

    if (!existingNotification?.length) {
      // Envoyer notification que la facture est due aujourd'hui
      await supabase.from('bill_notifications').insert({
        bill_id: bill.id,
        user_id: bill.user_id,
        notification_type: 'due_today'
      });

      await supabase.from('notifications').insert({
        title: 'Facture due aujourd\'hui',
        message: `Votre facture "${bill.bill_name}" de ${bill.amount.toLocaleString()} XAF sera traitée automatiquement aujourd'hui.`,
        notification_type: 'individual',
        priority: 'high',
        target_users: [bill.user_id],
        sent_by: bill.user_id
      });
    }

    // Traiter le paiement
    const { data: result, error: paymentError } = await supabase
      .rpc('process_automatic_bill_payment', { bill_id_param: bill.id });

    if (paymentError) {
      console.error(`Error processing bill ${bill.bill_name}:`, paymentError);
    } else {
      console.log(`Processed bill ${bill.bill_name}:`, result);
    }
  }
}

async function retryFailedBills() {
  // Trouver les factures en échec qui peuvent être retentées
  const { data: failedBills, error } = await supabase
    .from('automatic_bills')
    .select('*')
    .eq('status', 'pending')
    .eq('is_automated', true)
    .lt('due_date', new Date().toISOString().split('T')[0])
    .gt('payment_attempts', 0)
    .lt('payment_attempts', 30); // max_attempts

  if (error) {
    console.error('Error fetching failed bills:', error);
    return;
  }

  for (const bill of failedBills || []) {
    // Traiter la nouvelle tentative
    const { data: result, error: paymentError } = await supabase
      .rpc('process_automatic_bill_payment', { bill_id_param: bill.id });

    if (paymentError) {
      console.error(`Error retrying bill ${bill.bill_name}:`, paymentError);
    } else {
      console.log(`Retried bill ${bill.bill_name}:`, result);
    }
  }
}