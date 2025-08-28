-- Créer les buckets de stockage pour les avatars et cartes d'identité
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('id-cards', 'id-cards', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Créer les politiques RLS pour le bucket avatars (public)
INSERT INTO storage.policies (bucket_id, name, definition, command, permissive)
VALUES 
  ('avatars', 'Authenticated users can upload avatars', 
   '(auth.uid() IS NOT NULL) AND (storage.foldername(name))[1] = auth.uid()::text', 
   'INSERT', true),
  ('avatars', 'Authenticated users can update their avatars', 
   '(auth.uid() IS NOT NULL) AND (storage.foldername(name))[1] = auth.uid()::text', 
   'UPDATE', true),
  ('avatars', 'Avatars are publicly viewable', 
   'true', 
   'SELECT', true),
  ('avatars', 'Users can delete their own avatars', 
   '(auth.uid() IS NOT NULL) AND (storage.foldername(name))[1] = auth.uid()::text', 
   'DELETE', true)
ON CONFLICT (bucket_id, name) DO UPDATE SET
  definition = EXCLUDED.definition,
  command = EXCLUDED.command;

-- Créer les politiques RLS pour le bucket id-cards (privé)
INSERT INTO storage.policies (bucket_id, name, definition, command, permissive)
VALUES 
  ('id-cards', 'Users can upload their own ID cards', 
   '(auth.uid() IS NOT NULL) AND (storage.foldername(name))[1] = auth.uid()::text', 
   'INSERT', true),
  ('id-cards', 'Users can update their own ID cards', 
   '(auth.uid() IS NOT NULL) AND (storage.foldername(name))[1] = auth.uid()::text', 
   'UPDATE', true),
  ('id-cards', 'Users can view their own ID cards', 
   '(auth.uid() IS NOT NULL) AND (storage.foldername(name))[1] = auth.uid()::text', 
   'SELECT', true),
  ('id-cards', 'Admins can view all ID cards', 
   'is_admin_or_sub_admin(auth.uid())', 
   'SELECT', true),
  ('id-cards', 'Users can delete their own ID cards', 
   '(auth.uid() IS NOT NULL) AND (storage.foldername(name))[1] = auth.uid()::text', 
   'DELETE', true)
ON CONFLICT (bucket_id, name) DO UPDATE SET
  definition = EXCLUDED.definition,
  command = EXCLUDED.command;