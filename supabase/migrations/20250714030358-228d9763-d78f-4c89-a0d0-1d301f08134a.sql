-- Create savings_accounts table
CREATE TABLE public.savings_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    target_amount DECIMAL(15,2),
    target_date DATE,
    auto_deposit_amount DECIMAL(15,2),
    auto_deposit_frequency TEXT CHECK (auto_deposit_frequency IN ('daily', 'weekly', 'monthly')),
    interest_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own savings accounts" 
ON public.savings_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own savings accounts" 
ON public.savings_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings accounts" 
ON public.savings_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings accounts" 
ON public.savings_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_savings_accounts_updated_at
BEFORE UPDATE ON public.savings_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle savings deposits
CREATE OR REPLACE FUNCTION public.savings_deposit(
    p_user_id UUID,
    p_account_id UUID,
    p_amount DECIMAL
) RETURNS JSON AS $$
DECLARE
    v_user_balance DECIMAL;
    v_result JSON;
BEGIN
    -- Check user balance
    SELECT balance INTO v_user_balance 
    FROM profiles 
    WHERE id = p_user_id;
    
    IF v_user_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    IF v_user_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;
    
    -- Deduct from user's main balance
    UPDATE profiles 
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Add to savings account
    UPDATE savings_accounts 
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;
    
    -- Return success
    RETURN json_build_object('success', true, 'message', 'Deposit successful');
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;