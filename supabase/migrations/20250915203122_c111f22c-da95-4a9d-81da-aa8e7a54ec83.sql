BEGIN;

-- Assouplir la contrainte pour accepter les types réellement utilisés par nos triggers
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
    'withdrawal_completed'
  )
);

COMMIT;