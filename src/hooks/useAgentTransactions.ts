import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  sender_id: string;
  receiver_id: string;
}

const useAgentTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!user?.id) {
          setError('User ID is missing.');
          return;
        }

        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        setTransactions(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user?.id]);

  return { transactions, loading, error };
};

export default useAgentTransactions;
