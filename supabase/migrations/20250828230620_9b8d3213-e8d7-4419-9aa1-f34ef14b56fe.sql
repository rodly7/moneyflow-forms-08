-- Créer le bucket selfies manquant
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('selfies', 'selfies', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;