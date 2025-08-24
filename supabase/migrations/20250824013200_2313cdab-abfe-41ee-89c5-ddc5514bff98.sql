
-- Table pour les codes de parrainage
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Table pour les parrainages
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  referrer_reward NUMERIC DEFAULT 500,
  referred_reward NUMERIC DEFAULT 250,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_id)
);

-- Table pour les récompenses de parrainage
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('signup', 'first_transaction', 'commission')),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les demandes utilisateur (recharge/retrait)
CREATE TABLE user_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('recharge', 'withdrawal')),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES profiles(id),
  rejection_reason TEXT
);

-- Table pour l'inventaire
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  max_stock INTEGER NOT NULL DEFAULT 100,
  min_threshold INTEGER NOT NULL DEFAULT 10,
  unit_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'low_stock', 'out_of_stock')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer des index pour les performances
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX idx_user_requests_user_id ON user_requests(user_id);
CREATE INDEX idx_user_requests_status ON user_requests(status);

-- Activer RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour referral_codes
CREATE POLICY "Users can view their own referral codes" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour referrals
CREATE POLICY "Users can view referrals they're involved in" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can create referrals" ON referrals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all referrals" ON referrals
  FOR ALL USING (is_admin_or_sub_admin(auth.uid()));

-- Politiques RLS pour referral_rewards
CREATE POLICY "Users can view their own rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all rewards" ON referral_rewards
  FOR ALL USING (is_admin_or_sub_admin(auth.uid()));

-- Politiques RLS pour user_requests
CREATE POLICY "Users can create their own requests" ON user_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests" ON user_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all requests" ON user_requests
  FOR ALL USING (is_admin_or_sub_admin(auth.uid()));

-- Politiques RLS pour inventory_items
CREATE POLICY "Admins can manage inventory" ON inventory_items
  FOR ALL USING (is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Users can view inventory" ON inventory_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insérer des données de test pour l'inventaire
INSERT INTO inventory_items (name, category, stock, max_stock, min_threshold, unit_price, status) VALUES
('Cartes Orange Money', 'Télécom', 150, 200, 50, 1000, 'available'),
('Cartes MTN Mobile Money', 'Télécom', 25, 100, 30, 1000, 'low_stock'),
('Cartes Airtel Money', 'Télécom', 0, 100, 20, 1000, 'out_of_stock'),
('Crédits de Communication', 'Services', 500, 1000, 100, 100, 'available'),
('Cartes de Recharge Électricité', 'Utilities', 75, 150, 25, 500, 'available'),
('Cartes Internet Mobile', 'Télécom', 12, 80, 15, 2000, 'low_stock');

-- Insérer des données de test pour les demandes utilisateur
INSERT INTO user_requests (user_id, operation_type, amount, payment_method, payment_phone, status) 
SELECT 
  id,
  CASE WHEN random() > 0.5 THEN 'recharge' ELSE 'withdrawal' END,
  (random() * 50000 + 5000)::numeric,
  CASE WHEN random() > 0.5 THEN 'Orange Money' ELSE 'MTN Mobile Money' END,
  '+237' || (600000000 + (random() * 99999999)::int)::text,
  'pending'
FROM profiles 
WHERE role = 'user' 
LIMIT 5;
