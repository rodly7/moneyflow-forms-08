-- Add missing column for transaction reference used by RPC function
BEGIN;

-- 1) Add column if it doesn't exist
ALTER TABLE public.withdrawals
ADD COLUMN IF NOT EXISTS transaction_reference text;

-- 2) Ensure fast lookup and uniqueness when provided (do not force existing rows)
CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawals_tx_ref_unique
ON public.withdrawals (transaction_reference)
WHERE transaction_reference IS NOT NULL;

COMMIT;