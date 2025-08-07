
import { supabase } from "@/integrations/supabase/client";

export interface UserRole {
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
}

export const getUserRole = async (userId: string): Promise<'user' | 'agent' | 'admin' | 'sub_admin'> => {
  try {
    const { data, error } = await supabase.rpc('get_user_role', {
      user_id_param: userId
    });

    if (error) {
      console.error("Error getting user role:", error);
      return 'user';
    }

    return data || 'user';
  } catch (error) {
    console.error("Error in getUserRole:", error);
    return 'user';
  }
};

export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_admin', {
      user_id_param: userId
    });

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error("Error in isAdmin:", error);
    return false;
  }
};

export const isSubAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_sub_admin', {
      user_id_param: userId
    });

    if (error) {
      console.error("Error checking sub-admin status:", error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error("Error in isSubAdmin:", error);
    return false;
  }
};

export const isAdminOrSubAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_admin_or_sub_admin', {
      user_id_param: userId
    });

    if (error) {
      console.error("Error checking admin/sub-admin status:", error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error("Error in isAdminOrSubAdmin:", error);
    return false;
  }
};

export const isAgentOrAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_agent_or_admin', {
      user_id_param: userId
    });

    if (error) {
      console.error("Error checking agent/admin status:", error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error("Error in isAgentOrAdmin:", error);
    return false;
  }
};

export const checkTransactionLimit = async (
  userId: string,
  amount: number,
  operationType: string
): Promise<boolean> => {
  try {
    const userRole = await getUserRole(userId);
    
    const { data, error } = await supabase
      .from('transaction_limits')
      .select('single_limit, daily_limit')
      .eq('operation_type', operationType)
      .eq('user_role', userRole)
      .maybeSingle();

    if (error) {
      console.error("Error checking transaction limits:", error);
      return true; // Allow if we can't check limits
    }

    if (!data) {
      // No limits defined, use default limits
      const defaultLimits = {
        user: 500000,
        agent: 2000000,
        admin: 10000000,
        sub_admin: 5000000
      };
      return amount <= defaultLimits[userRole];
    }

    return amount <= data.single_limit;
  } catch (error) {
    console.error("Error in checkTransactionLimit:", error);
    return true; // Allow if error occurs
  }
};
