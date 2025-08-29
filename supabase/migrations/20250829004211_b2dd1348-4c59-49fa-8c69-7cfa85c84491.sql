-- Mettre à jour l'agent existant avec une photo de test
UPDATE agents 
SET identity_photo = 'test-id-card.jpg',
    full_name = 'Charles Ng'
WHERE agent_id = 'AG-dda64997';