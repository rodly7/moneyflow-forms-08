
-- Ajouter la colonne recipient_email à la table pending_transfers
ALTER TABLE pending_transfers 
ADD COLUMN IF NOT EXISTS recipient_email TEXT;

-- S'assurer que la colonne peut être nullable
ALTER TABLE pending_transfers 
ALTER COLUMN recipient_email DROP NOT NULL;
