-- Créer un agent de test avec une vraie photo pour debug
INSERT INTO agents (user_id, agent_id, full_name, phone, country, identity_photo, status) 
VALUES (
  gen_random_uuid(),
  'AG-TEST-001',
  'Charles Ng Test',
  '+221701234567',
  'Sénégal',
  'test-id-card.jpg',
  'active'
) ON CONFLICT (agent_id) DO UPDATE SET
  identity_photo = 'test-id-card.jpg',
  full_name = 'Charles Ng Test';

-- Mettre à jour l'agent existant avec une vraie photo
UPDATE agents 
SET identity_photo = 'test-id-card.jpg'
WHERE agent_id = 'AG-dda64997';