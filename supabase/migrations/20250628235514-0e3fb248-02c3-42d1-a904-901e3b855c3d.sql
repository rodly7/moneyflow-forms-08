
-- Créer la table notifications pour stocker les notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('all', 'role', 'country', 'individual')),
  target_role TEXT,
  target_country TEXT,
  target_users UUID[],
  sent_by UUID REFERENCES auth.users(id),
  total_recipients INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Créer la table notification_recipients pour suivre l'envoi individuel
CREATE TABLE public.notification_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'read', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(notification_id, user_id)
);

-- Activer RLS sur les deux tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour notifications
CREATE POLICY "Admins can manage all notifications" 
  ON public.notifications 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sub_admin')
    )
  );

-- Politiques RLS pour notification_recipients
CREATE POLICY "Users can view their own notification recipients" 
  ON public.notification_recipients 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notification recipients" 
  ON public.notification_recipients 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sub_admin')
    )
  );

-- Index pour améliorer les performances
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notification_recipients_user_id ON public.notification_recipients(user_id);
CREATE INDEX idx_notification_recipients_notification_id ON public.notification_recipients(notification_id);
