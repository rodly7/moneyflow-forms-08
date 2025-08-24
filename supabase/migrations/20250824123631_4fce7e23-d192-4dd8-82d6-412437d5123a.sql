
-- Mettre à jour la limite quotidienne par défaut à 300 pour tous les sous-administrateurs
UPDATE sub_admin_quota_settings 
SET daily_limit = 300, updated_at = now() 
WHERE daily_limit = 50;

-- Modifier la fonction trigger pour utiliser 300 comme limite par défaut pour les nouveaux sous-admins
CREATE OR REPLACE FUNCTION create_sub_admin_quota_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'sub_admin' AND (OLD.role IS NULL OR OLD.role != 'sub_admin') THEN
    INSERT INTO sub_admin_quota_settings (sub_admin_id, daily_limit)
    VALUES (NEW.id, 300)
    ON CONFLICT (sub_admin_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
