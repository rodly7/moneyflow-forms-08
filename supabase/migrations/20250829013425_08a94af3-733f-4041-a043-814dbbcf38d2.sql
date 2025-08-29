-- Créer une fonction pour synchroniser toutes les photos d'identité depuis le bucket
CREATE OR REPLACE FUNCTION public.sync_all_identity_photos()
RETURNS TABLE(user_id UUID, photo_url TEXT, sync_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'storage'
AS $$
DECLARE
    photo_record RECORD;
    extracted_user_id UUID;
    public_url TEXT;
    sync_count INTEGER := 0;
BEGIN
    -- Parcourir tous les objets dans le bucket id-cards
    FOR photo_record IN 
        SELECT name FROM storage.objects 
        WHERE bucket_id = 'id-cards' 
        ORDER BY created_at DESC
    LOOP
        -- Extraire l'UUID utilisateur du nom du fichier (format: uuid/filename)
        BEGIN
            extracted_user_id := SPLIT_PART(photo_record.name, '/', 1)::UUID;
            
            -- Générer l'URL publique
            public_url := 'https://msasycggbiwyxlczknwj.supabase.co/storage/v1/object/public/id-cards/' || photo_record.name;
            
            -- Mettre à jour le profil utilisateur avec l'URL de la photo
            UPDATE profiles 
            SET id_card_photo_url = public_url
            WHERE id = extracted_user_id 
            AND (id_card_photo_url IS NULL OR id_card_photo_url = '');
            
            -- Vérifier si la mise à jour a affecté une ligne
            IF FOUND THEN
                sync_count := sync_count + 1;
                user_id := extracted_user_id;
                photo_url := public_url;
                sync_status := 'UPDATED';
                RETURN NEXT;
            ELSE
                user_id := extracted_user_id;
                photo_url := public_url;
                sync_status := 'ALREADY_EXISTS';
                RETURN NEXT;
            END IF;
            
        EXCEPTION 
            WHEN OTHERS THEN
                user_id := NULL;
                photo_url := photo_record.name;
                sync_status := 'ERROR: ' || SQLERRM;
                RETURN NEXT;
        END;
    END LOOP;
    
    RAISE NOTICE 'Synchronisation terminée: % photos mises à jour', sync_count;
    RETURN;
END;
$$;