-- Créer une fonction pour synchroniser les photos d'identité des agents vers les profils
CREATE OR REPLACE FUNCTION sync_agent_identity_photos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Synchroniser les photos d'identité des agents vers les profils utilisateurs
  UPDATE profiles 
  SET id_card_photo_url = (
    SELECT CASE 
      -- Si c'est une image de test, ne pas la copier
      WHEN a.identity_photo = 'test-id-card.jpg' THEN NULL
      -- Si c'est un vrai fichier, générer l'URL publique Supabase
      WHEN a.identity_photo IS NOT NULL AND a.identity_photo != 'test-id-card.jpg' 
      THEN 'https://msasycggbiwyxlczknwj.supabase.co/storage/v1/object/public/id-cards/' || a.identity_photo
      ELSE NULL
    END
  )
  FROM agents a
  WHERE profiles.id = a.user_id 
  AND a.identity_photo IS NOT NULL;
  
  -- Synchroniser les photos des vérifications d'identité
  UPDATE profiles 
  SET id_card_photo_url = COALESCE(
    iv.id_card_url,
    kv.id_document_url,
    profiles.id_card_photo_url
  )
  FROM identity_verifications iv
  FULL OUTER JOIN kyc_verifications kv ON iv.user_id = kv.user_id
  WHERE profiles.id = COALESCE(iv.user_id, kv.user_id)
  AND (iv.id_card_url IS NOT NULL OR kv.id_document_url IS NOT NULL);
  
END;
$$;

-- Exécuter la synchronisation
SELECT sync_agent_identity_photos();