-- Créer une table pour les messages de support client
CREATE TABLE IF NOT EXISTS public.customer_support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'responded')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'transaction', 'account', 'technical', 'complaint')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  response TEXT,
  responded_by UUID REFERENCES auth.users(id),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.customer_support_messages ENABLE ROW LEVEL SECURITY;

-- Policies pour les utilisateurs (peuvent créer et voir leurs propres messages)
CREATE POLICY "Users can create their own support messages" 
ON public.customer_support_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own support messages" 
ON public.customer_support_messages 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policies pour les sous-administrateurs et administrateurs (peuvent voir et répondre à tous les messages)
CREATE POLICY "Sub-admins and admins can view all support messages" 
ON public.customer_support_messages 
FOR SELECT 
USING (is_admin_or_sub_admin(auth.uid()));

CREATE POLICY "Sub-admins and admins can update support messages" 
ON public.customer_support_messages 
FOR UPDATE 
USING (is_admin_or_sub_admin(auth.uid()));

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_customer_support_messages_updated_at
BEFORE UPDATE ON public.customer_support_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour les performances
CREATE INDEX idx_customer_support_messages_user_id ON public.customer_support_messages(user_id);
CREATE INDEX idx_customer_support_messages_status ON public.customer_support_messages(status);
CREATE INDEX idx_customer_support_messages_created_at ON public.customer_support_messages(created_at DESC);