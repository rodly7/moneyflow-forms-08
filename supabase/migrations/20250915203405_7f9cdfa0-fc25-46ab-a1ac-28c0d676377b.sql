BEGIN;

-- Supprimer la contrainte existante et la recréer avec tous les types utilisés
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_notification_type_check
CHECK (
  notification_type IN (
    'info',
    'success',
    'warning',
    'error',
    'individual',
    'transfer_pending',
    'withdrawal_created',
    'withdrawal_completed',
    'country',
    'role',
    'all'
  )
);

COMMIT;