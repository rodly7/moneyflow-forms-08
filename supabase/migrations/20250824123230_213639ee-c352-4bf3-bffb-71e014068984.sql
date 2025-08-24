
-- Créer une table pour les paramètres de quota des sous-administrateurs
CREATE TABLE IF NOT EXISTS sub_admin_quota_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_limit INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sub_admin_id)
);

-- Politique RLS pour les paramètres de quota
ALTER TABLE sub_admin_quota_settings ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout gérer
CREATE POLICY "Admins can manage quota settings"
  ON sub_admin_quota_settings
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Les sous-admins peuvent voir leurs propres paramètres
CREATE POLICY "Sub-admins can view their own quota settings"
  ON sub_admin_quota_settings
  FOR SELECT
  USING (auth.uid() = sub_admin_id);

-- Insérer des paramètres par défaut pour les sous-admins existants
INSERT INTO sub_admin_quota_settings (sub_admin_id, daily_limit)
SELECT id, 50
FROM profiles
WHERE role = 'sub_admin'
AND id NOT IN (SELECT sub_admin_id FROM sub_admin_quota_settings);

-- Trigger pour créer automatiquement des paramètres de quota pour les nouveaux sous-admins
CREATE OR REPLACE FUNCTION create_sub_admin_quota_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'sub_admin' AND OLD.role != 'sub_admin' THEN
    INSERT INTO sub_admin_quota_settings (sub_admin_id, daily_limit)
    VALUES (NEW.id, 50)
    ON CONFLICT (sub_admin_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_sub_admin_quota_settings
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_sub_admin_quota_settings();
