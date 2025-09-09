-- Fix automatic_bills table structure by adding missing columns
ALTER TABLE public.automatic_bills 
ADD COLUMN IF NOT EXISTS bill_type TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS provider_number TEXT,
ADD COLUMN IF NOT EXISTS provider_name TEXT,
ADD COLUMN IF NOT EXISTS meter_number TEXT,
ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS is_automated BOOLEAN DEFAULT false;

-- Update any existing records to have a default bill_type if needed
UPDATE public.automatic_bills 
SET bill_type = 'other' 
WHERE bill_type IS NULL;