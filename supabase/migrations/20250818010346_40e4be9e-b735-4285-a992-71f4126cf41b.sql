-- Add proper RLS policies for agents table to allow admin access
-- This fixes the security issue where agents table might be publicly accessible

-- First, let's add a policy for admins and sub-admins to view all agent data
CREATE POLICY "Admins can view all agent data" 
ON public.agents 
FOR SELECT 
USING (is_admin_or_sub_admin(auth.uid()));

-- Add policy for admins and sub-admins to update agent data (for status changes, etc.)
CREATE POLICY "Admins can update agent data" 
ON public.agents 
FOR UPDATE 
USING (is_admin_or_sub_admin(auth.uid()));

-- Add policy for admins to insert new agent records
CREATE POLICY "Admins can create agent records" 
ON public.agents 
FOR INSERT 
WITH CHECK (is_admin_or_sub_admin(auth.uid()));

-- Add policy for admins to delete agent records if needed
CREATE POLICY "Admins can delete agent records" 
ON public.agents 
FOR DELETE 
USING (is_admin_or_sub_admin(auth.uid()));