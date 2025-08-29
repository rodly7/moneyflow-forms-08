-- Ajouter une photo d'identité de test pour l'agent existant
UPDATE agents 
SET identity_photo = 'agent_identity/test_id_card.jpg'
WHERE agent_id = 'AG-dda64997';