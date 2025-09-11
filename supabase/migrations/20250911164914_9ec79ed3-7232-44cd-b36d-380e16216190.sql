-- Enable RLS and policies for transfers to make bill-payment transfers visible to recipients
-- and allow client fallback to insert transfers sent by the authenticated user.

-- Enable RLS (safe if already enabled)
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Allow users to view transfers they sent or received
CREATE POLICY "Users can view own sent or received transfers"
ON public.transfers
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Allow users to insert transfers they send (used by client fallback)
CREATE POLICY "Users can insert transfers they send"
ON public.transfers
FOR INSERT
WITH CHECK (auth.uid() = sender_id);
