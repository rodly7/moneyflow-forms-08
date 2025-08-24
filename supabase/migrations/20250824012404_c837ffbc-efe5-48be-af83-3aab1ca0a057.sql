
-- Add foreign key constraint to audit_logs table to properly relate to profiles
ALTER TABLE audit_logs 
ADD CONSTRAINT fk_audit_logs_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Create an index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
