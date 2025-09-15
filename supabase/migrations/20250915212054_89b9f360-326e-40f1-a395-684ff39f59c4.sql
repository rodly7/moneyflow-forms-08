-- Update existing merchant_payments with client info from profiles
UPDATE public.merchant_payments 
SET 
  client_name = profiles.full_name,
  client_phone = profiles.phone
FROM public.profiles 
WHERE merchant_payments.user_id = profiles.id 
  AND (merchant_payments.client_name IS NULL OR merchant_payments.client_phone IS NULL);