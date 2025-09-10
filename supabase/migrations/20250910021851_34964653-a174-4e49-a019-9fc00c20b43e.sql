-- Créer les profils des fournisseurs pour les numéros de paiement existants
INSERT INTO profiles (id, phone, full_name, role, balance, country, is_verified, requires_kyc, requires_pin_setup)
VALUES 
  -- SENELEC
  (gen_random_uuid(), '+221338390000', 'SENELEC', 'user', 0, 'Sénégal', true, false, false),
  -- SDE
  (gen_random_uuid(), '+221338390001', 'SDE', 'user', 0, 'Sénégal', true, false, false),
  -- Orange Sénégal
  (gen_random_uuid(), '+221778000000', 'Orange Sénégal', 'user', 0, 'Sénégal', true, false, false),
  -- Free Sénégal
  (gen_random_uuid(), '+221705000000', 'Free Sénégal', 'user', 0, 'Sénégal', true, false, false),
  -- Canal+ Sénégal
  (gen_random_uuid(), '+221338654321', 'Canal+ Sénégal', 'user', 0, 'Sénégal', true, false, false)
ON CONFLICT (phone) DO NOTHING;