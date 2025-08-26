import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';

interface EarningsData {
  totalEarnings: number;
  todayEarnings: number;
  yesterdayEarnings: number;
  thisWeekEarnings: number;
  lastWeekEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
}

const useAgentEarnings = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    todayEarnings: 0,
    yesterdayEarnings: 0,
    thisWeekEarnings: 0,
    lastWeekEarnings: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgentEarnings = async () => {
      if (!user?.id) {
        console.log("Pas d'id utilisateur");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.rpc('get_agent_earnings', {
          agent_id: user.id
        });

        if (error) {
          console.error("Erreur lors de la récupération des gains de l'agent:", error);
          setError(error.message);
        } else {
          setEarnings({
            totalEarnings: data?.total_earnings || 0,
            todayEarnings: data?.today_earnings || 0,
            yesterdayEarnings: data?.yesterday_earnings || 0,
            thisWeekEarnings: data?.this_week_earnings || 0,
            lastWeekEarnings: data?.last_week_earnings || 0,
            thisMonthEarnings: data?.this_month_earnings || 0,
            lastMonthEarnings: data?.last_month_earnings || 0,
          });
        }
      } catch (err: any) {
        console.error("Erreur inattendue lors de la récupération des gains de l'agent:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentEarnings();
  }, [user?.id]);

  return { earnings, loading, error };
};

export default useAgentEarnings;
