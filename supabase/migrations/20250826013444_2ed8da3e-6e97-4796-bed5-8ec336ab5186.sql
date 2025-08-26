
-- Create payment_numbers table for managing Mobile Money payment numbers
CREATE TABLE public.payment_numbers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number text NOT NULL,
  provider text NOT NULL,
  country text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  service_type text NOT NULL DEFAULT 'both' CHECK (service_type IN ('recharge', 'withdrawal', 'both')),
  description text,
  admin_type text NOT NULL DEFAULT 'main_admin' CHECK (admin_type IN ('main_admin', 'sub_admin')),
  admin_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.payment_numbers ENABLE ROW LEVEL Security;

-- Create policies for payment_numbers
CREATE POLICY "Admins and sub-admins can manage payment numbers"
  ON public.payment_numbers
  FOR ALL
  USING (is_admin_or_sub_admin(auth.uid()))
  WITH CHECK (is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active payment numbers"
  ON public.payment_numbers
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Create trigger to update updated_at column
CREATE TRIGGER update_payment_numbers_updated_at
  BEFORE UPDATE ON public.payment_numbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment numbers
INSERT INTO public.payment_numbers (phone_number, provider, country, is_active, is_default, service_type, description, admin_type) VALUES
('+242066164686', 'Mobile Money', 'Congo Brazzaville', true, true, 'both', 'Numéro principal Congo', 'main_admin'),
('780192989', 'Wave', 'Sénégal', true, true, 'both', 'Numéro principal Sénégal', 'main_admin');
