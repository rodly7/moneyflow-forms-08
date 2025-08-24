
-- Créer la table pour les paramètres des sous-administrateurs
CREATE TABLE public.sub_admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  daily_request_limit INTEGER NOT NULL DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour traquer les demandes quotidiennes des sous-administrateurs
CREATE TABLE public.sub_admin_daily_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_admin_id UUID REFERENCES auth.users NOT NULL,
  request_type TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_sub_admin_settings_user_id ON sub_admin_settings(user_id);
CREATE INDEX idx_sub_admin_daily_requests_date ON sub_admin_daily_requests(sub_admin_id, date);

-- RLS pour sub_admin_settings
ALTER TABLE public.sub_admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sub-admins can manage their own settings"
  ON public.sub_admin_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS pour sub_admin_daily_requests
ALTER TABLE public.sub_admin_daily_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sub-admins can manage their own daily requests"
  ON public.sub_admin_daily_requests
  FOR ALL
  USING (auth.uid() = sub_admin_id)
  WITH CHECK (auth.uid() = sub_admin_id);

CREATE POLICY "Admins can view all sub-admin daily requests"
  ON public.sub_admin_daily_requests
  FOR SELECT
  USING (is_admin(auth.uid()));
