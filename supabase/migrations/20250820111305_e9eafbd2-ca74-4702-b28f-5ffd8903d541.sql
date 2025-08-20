
-- Vérifier la structure de la table pending_transfers et ajouter recipient_email si nécessaire
ALTER TABLE pending_transfers 
ADD COLUMN IF NOT EXISTS recipient_email TEXT;

-- Mettre à jour la colonne pour qu'elle soit nullable
ALTER TABLE pending_transfers 
ALTER COLUMN recipient_email DROP NOT NULL;
