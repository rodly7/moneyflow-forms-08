-- Mettre à jour les profils avec les vraies photos d'identité du storage
UPDATE profiles 
SET id_card_photo_url = 'https://msasycggbiwyxlczknwj.supabase.co/storage/v1/object/public/id-cards/' || so.name
FROM storage.objects so
WHERE so.bucket_id = 'id-cards' 
AND so.name LIKE profiles.id || '/%'
AND so.name LIKE '%id-card%';

-- Cas spécifiques pour Charlesse (a1a600a7-bba4-4579-8519-010b324edb41)
UPDATE profiles 
SET id_card_photo_url = 'https://msasycggbiwyxlczknwj.supabase.co/storage/v1/object/public/id-cards/a1a600a7-bba4-4579-8519-010b324edb41/id-card-1756428932605.jpeg'
WHERE full_name = 'Charlesse' OR id = 'a1a600a7-bba4-4579-8519-010b324edb41';

-- Charles Rod Ng (77170c4d-92ba-45d6-bdc9-1faa910a2f0e)
UPDATE profiles 
SET id_card_photo_url = 'https://msasycggbiwyxlczknwj.supabase.co/storage/v1/object/public/id-cards/77170c4d-92ba-45d6-bdc9-1faa910a2f0e/id-card-1756284758767.jpeg'
WHERE full_name = 'Charles Rod Ng' OR id = '77170c4d-92ba-45d6-bdc9-1faa910a2f0e';

-- NGANGOUE Charles Rodly (7c102567-de0c-4b97-8a54-dcd60a2b4e9b)
UPDATE profiles 
SET id_card_photo_url = 'https://msasycggbiwyxlczknwj.supabase.co/storage/v1/object/public/id-cards/7c102567-de0c-4b97-8a54-dcd60a2b4e9b/id-card-1756261586745.jpeg'
WHERE full_name = 'NGANGOUE Charles Rodly' OR id = '7c102567-de0c-4b97-8a54-dcd60a2b4e9b';