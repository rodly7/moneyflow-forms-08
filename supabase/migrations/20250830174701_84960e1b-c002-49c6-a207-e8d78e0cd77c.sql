-- Migrer les données des recharges en attente vers user_requests
INSERT INTO public.user_requests (
  user_id,
  operation_type,
  request_type,
  amount,
  payment_method,
  payment_phone,
  status,
  created_at
)
SELECT 
  user_id,
  'recharge' as operation_type,
  'recharge' as request_type,
  amount,
  payment_method,
  payment_phone,
  CASE 
    WHEN status = 'completed' THEN 'approved'
    WHEN status = 'failed' THEN 'rejected'
    ELSE status
  END as status,
  created_at
FROM public.recharges
WHERE status = 'pending';

-- Migrer les données des retraits en attente vers user_requests  
INSERT INTO public.user_requests (
  user_id,
  operation_type,
  request_type,
  amount,
  payment_method,
  payment_phone,
  status,
  created_at
)
SELECT 
  user_id,
  'withdrawal' as operation_type,
  'withdrawal' as request_type,
  amount,
  'mobile_money' as payment_method,
  withdrawal_phone as payment_phone,
  CASE 
    WHEN status = 'completed' THEN 'approved'
    WHEN status = 'failed' THEN 'rejected'
    ELSE status
  END as status,
  created_at
FROM public.withdrawals
WHERE status = 'pending';