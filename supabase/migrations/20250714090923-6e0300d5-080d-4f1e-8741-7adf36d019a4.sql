-- Fix the savings_deposit function to remove updated_at reference for profiles table
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
    
    -- Deduct from user's main balance (without updated_at)
    UPDATE profiles 
    SET balance = balance - p_amount
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

-- Function to check if savings target is reached and auto-transfer
CREATE OR REPLACE FUNCTION public.check_savings_target_and_transfer()
RETURNS TRIGGER AS $$
DECLARE
    v_target_reached BOOLEAN := false;
BEGIN
    -- Check if target amount is set and reached
    IF NEW.target_amount IS NOT NULL AND NEW.balance >= NEW.target_amount THEN
        v_target_reached := true;
        
        -- Transfer savings balance to main balance
        UPDATE profiles 
        SET balance = balance + NEW.balance
        WHERE id = NEW.user_id;
        
        -- Reset savings account balance
        NEW.balance := 0;
        
        -- Log the automatic transfer (optional)
        INSERT INTO audit_logs (
            action,
            table_name,
            record_id,
            user_id,
            new_values
        ) VALUES (
            'savings_target_reached_auto_transfer',
            'savings_accounts',
            NEW.id,
            NEW.user_id,
            jsonb_build_object('transferred_amount', NEW.target_amount, 'target_reached', true)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic transfer when target is reached
DROP TRIGGER IF EXISTS check_savings_target_trigger ON savings_accounts;
CREATE TRIGGER check_savings_target_trigger
    BEFORE UPDATE ON savings_accounts
    FOR EACH ROW
    EXECUTE FUNCTION check_savings_target_and_transfer();

-- Function to prevent deletion if target not reached
CREATE OR REPLACE FUNCTION public.prevent_savings_deletion_before_target()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent deletion if target is set but not reached and balance > 0
    IF OLD.target_amount IS NOT NULL 
       AND OLD.balance < OLD.target_amount 
       AND OLD.balance > 0 THEN
        RAISE EXCEPTION 'Cannot delete savings account before reaching target amount. Current: %, Target: %', 
                       OLD.balance, OLD.target_amount;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent deletion before target
DROP TRIGGER IF EXISTS prevent_savings_deletion_trigger ON savings_accounts;
CREATE TRIGGER prevent_savings_deletion_trigger
    BEFORE DELETE ON savings_accounts
    FOR EACH ROW
    EXECUTE FUNCTION prevent_savings_deletion_before_target();

-- Function for savings withdrawal
CREATE OR REPLACE FUNCTION public.savings_withdrawal(
    p_user_id UUID,
    p_account_id UUID,
    p_amount DECIMAL
) RETURNS JSON AS $$
DECLARE
    v_savings_balance DECIMAL;
    v_target_amount DECIMAL;
    v_result JSON;
BEGIN
    -- Check savings account balance and target
    SELECT balance, target_amount INTO v_savings_balance, v_target_amount
    FROM savings_accounts 
    WHERE id = p_account_id AND user_id = p_user_id;
    
    IF v_savings_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Savings account not found');
    END IF;
    
    IF v_savings_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient savings balance');
    END IF;
    
    -- Check if target is reached before allowing withdrawal
    IF v_target_amount IS NOT NULL AND v_savings_balance < v_target_amount THEN
        RETURN json_build_object('success', false, 'error', 'Cannot withdraw before reaching target amount');
    END IF;
    
    -- Deduct from savings account
    UPDATE savings_accounts 
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;
    
    -- Add to user's main balance
    UPDATE profiles 
    SET balance = balance + p_amount
    WHERE id = p_user_id;
    
    -- Return success
    RETURN json_build_object('success', true, 'message', 'Withdrawal successful');
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;