-- Augmenter le quota par défaut des sous-admins à 1000
UPDATE sub_admin_quota_settings 
SET daily_limit = 1000 
WHERE daily_limit = 300;

-- Modifier la fonction de création pour utiliser 1000 par défaut
CREATE OR REPLACE FUNCTION public.create_sub_admin_quota_settings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role = 'sub_admin' AND (OLD.role IS NULL OR OLD.role != 'sub_admin') THEN
    INSERT INTO sub_admin_quota_settings (sub_admin_id, daily_limit)
    VALUES (NEW.id, 1000)
    ON CONFLICT (sub_admin_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;