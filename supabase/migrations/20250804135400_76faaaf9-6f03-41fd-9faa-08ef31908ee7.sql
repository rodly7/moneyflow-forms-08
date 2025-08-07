-- Create receipts table for storing generated receipts
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own receipts" 
ON public.receipts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own receipts" 
ON public.receipts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all receipts" 
ON public.receipts 
FOR ALL 
USING (is_admin_or_sub_admin(auth.uid()))
WITH CHECK (is_admin_or_sub_admin(auth.uid()));

-- Add columns to automatic_bills table for payment number and meter number
ALTER TABLE public.automatic_bills 
ADD COLUMN IF NOT EXISTS payment_number TEXT,
ADD COLUMN IF NOT EXISTS meter_number TEXT;