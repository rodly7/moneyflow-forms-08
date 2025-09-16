BEGIN;

-- Fix transfer failure caused by invalid notification_type ('transfer_received')
-- Remove the duplicate trigger/function using a non-allowed type and rely on existing notify_money_received()
DROP TRIGGER IF EXISTS trigger_notify_transfer_received ON public.transfers;
DROP FUNCTION IF EXISTS public.notify_transfer_received();

COMMIT;