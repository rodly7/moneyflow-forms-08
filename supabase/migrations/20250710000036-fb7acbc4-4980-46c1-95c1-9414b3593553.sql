-- Créer une politique RLS pour permettre aux utilisateurs de lire les notifications qui leur sont destinées
CREATE POLICY "Users can view notifications sent to them" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM notification_recipients 
    WHERE notification_recipients.notification_id = notifications.id 
    AND notification_recipients.user_id = auth.uid()
  )
);

-- Également créer une politique pour permettre aux utilisateurs d'insérer leurs propres notification_recipients
-- (au cas où on voudrait permettre aux agents de créer des notifications)
CREATE POLICY "Admins and agents can create notification recipients" 
ON public.notification_recipients 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'sub_admin', 'agent')
  )
);