-- Create table for bill payment numbers
CREATE TABLE IF NOT EXISTS public.bill_payment_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  bill_type TEXT NOT NULL,
  payment_number TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bill_payment_numbers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active payment numbers" 
ON public.bill_payment_numbers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage payment numbers" 
ON public.bill_payment_numbers 
FOR ALL 
USING (is_admin_or_sub_admin(auth.uid()))
WITH CHECK (is_admin_or_sub_admin(auth.uid()));

-- Insert sample data for different countries
INSERT INTO public.bill_payment_numbers (country, bill_type, payment_number, provider_name, description) VALUES
-- Sénégal
('Sénégal', 'electricity_senelec', '221338001234', 'SENELEC', 'Électricité Sénégal'),
('Sénégal', 'water_sde', '221339001234', 'SDE', 'Eau Sénégal'),
('Sénégal', 'internet_orange', '221778001234', 'Orange Sénégal', 'Internet Orange'),
('Sénégal', 'internet_free', '221776001234', 'Free Sénégal', 'Internet Free'),
('Sénégal', 'tv_canal', '221339501234', 'Canal+ Sénégal', 'TV Canal+'),

-- Cameroun
('Cameroun', 'electricity_eneo', '237677001234', 'ENEO', 'Électricité Cameroun'),
('Cameroun', 'water_camwater', '237678001234', 'CAMWATER', 'Eau Cameroun'),
('Cameroun', 'internet_orange', '237677101234', 'Orange Cameroun', 'Internet Orange'),
('Cameroun', 'internet_mtn', '237676001234', 'MTN Cameroun', 'Internet MTN'),

-- Côte d''Ivoire
('Côte d''Ivoire', 'electricity_cie', '225070001234', 'CIE', 'Électricité Côte d''Ivoire'),
('Côte d''Ivoire', 'water_sodeci', '225071001234', 'SODECI', 'Eau Côte d''Ivoire'),
('Côte d''Ivoire', 'internet_orange', '225072001234', 'Orange CI', 'Internet Orange'),
('Côte d''Ivoire', 'internet_mtn', '225073001234', 'MTN CI', 'Internet MTN'),

-- RDC Congo
('RDC Congo', 'electricity_snel', '243810001234', 'SNEL', 'Électricité RDC'),
('RDC Congo', 'water_regideso', '243811001234', 'REGIDESO', 'Eau RDC'),
('RDC Congo', 'internet_orange', '243812001234', 'Orange RDC', 'Internet Orange'),

-- Congo Brazzaville
('Congo Brazzaville', 'electricity_ene', '242060001234', 'ENE', 'Électricité Congo'),
('Congo Brazzaville', 'water_lcde', '242061001234', 'LCDE', 'Eau Congo'),
('Congo Brazzaville', 'internet_airtel', '242062001234', 'Airtel Congo', 'Internet Airtel'),

-- Gabon
('Gabon', 'electricity_seeg', '241074001234', 'SEEG', 'Électricité Gabon'),
('Gabon', 'water_seeg', '241075001234', 'SEEG Eau', 'Eau Gabon'),
('Gabon', 'internet_airtel', '241076001234', 'Airtel Gabon', 'Internet Airtel');

-- Create trigger for updating updated_at
CREATE TRIGGER update_bill_payment_numbers_updated_at
  BEFORE UPDATE ON public.bill_payment_numbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();