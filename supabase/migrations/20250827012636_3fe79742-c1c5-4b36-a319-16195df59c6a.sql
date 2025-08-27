
-- Ajouter les colonnes date de naissance et photo de carte d'identité au profil
ALTER TABLE profiles 
ADD COLUMN birth_date DATE,
ADD COLUMN id_card_photo_url TEXT;

-- Ajouter les colonnes à la table agents également si elles n'existent pas déjà
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS identity_photo TEXT;
