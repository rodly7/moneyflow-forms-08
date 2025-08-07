
-- Fonction pour synchroniser les numéros de téléphone entre profiles et auth.users
DO $$
DECLARE
    profile_record RECORD;
    user_email TEXT;
BEGIN
    -- Parcourir tous les profils qui ont un numéro de téléphone
    FOR profile_record IN 
        SELECT id, phone 
        FROM public.profiles 
        WHERE phone IS NOT NULL AND phone != ''
    LOOP
        -- Générer l'email basé sur le numéro de téléphone
        user_email := profile_record.phone || '@sendflow.app';
        
        -- Mettre à jour l'email dans auth.users pour correspondre au numéro
        UPDATE auth.users 
        SET email = user_email,
            phone = profile_record.phone,
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                                jsonb_build_object('phone', profile_record.phone)
        WHERE id = profile_record.id;
        
        RAISE NOTICE 'Synchronisé utilisateur % avec email % et téléphone %', 
                     profile_record.id, user_email, profile_record.phone;
    END LOOP;
END $$;

-- Créer une fonction trigger pour maintenir la synchronisation automatiquement
CREATE OR REPLACE FUNCTION sync_phone_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Quand le téléphone est mis à jour dans profiles, mettre à jour auth.users
    IF TG_OP = 'UPDATE' AND OLD.phone IS DISTINCT FROM NEW.phone THEN
        UPDATE auth.users 
        SET email = NEW.phone || '@sendflow.app',
            phone = NEW.phone,
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                                jsonb_build_object('phone', NEW.phone)
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour maintenir la synchronisation
DROP TRIGGER IF EXISTS sync_phone_trigger ON public.profiles;
CREATE TRIGGER sync_phone_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_phone_to_auth();
