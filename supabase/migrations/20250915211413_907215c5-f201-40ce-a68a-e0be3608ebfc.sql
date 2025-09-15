-- Add client info columns to merchant_payments for merchant-side display without violating RLS on profiles
ALTER TABLE public.merchant_payments
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS meter_number text;

-- Optional: future-proof by adding bill_type if needed by UI (kept nullable)
ALTER TABLE public.merchant_payments
  ADD COLUMN IF NOT EXISTS bill_type text;