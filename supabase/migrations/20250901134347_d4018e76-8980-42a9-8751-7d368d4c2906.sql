-- Create table for merchant payments
CREATE TABLE public.merchant_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  merchant_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'XAF',
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merchant_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own merchant payments" 
ON public.merchant_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert merchant payments" 
ON public.merchant_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all merchant payments" 
ON public.merchant_payments 
FOR SELECT 
USING (is_admin_or_sub_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_merchant_payments_updated_at
BEFORE UPDATE ON public.merchant_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();