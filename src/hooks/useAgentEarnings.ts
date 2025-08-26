
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface EarningsData {
  totalEarnings: number;
  todayEarnings: number;
  yesterdayEarnings: number;
  thisWeekEarnings: number;
  lastWeekEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
}

export const useAgentEarnings = () => {
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
        // Mock data since the RPC function doesn't exist
        const mockData = {
          total_earnings: 45000,
          today_earnings: 2500,
          yesterday_earnings: 3200,
          this_week_earnings: 15000,
          last_week_earnings: 12000,
          this_month_earnings: 35000,
          last_month_earnings: 40000,
        };

        setEarnings({
          totalEarnings: mockData.total_earnings || 0,
          todayEarnings: mockData.today_earnings || 0,
          yesterdayEarnings: mockData.yesterday_earnings || 0,
          thisWeekEarnings: mockData.this_week_earnings || 0,
          lastWeekEarnings: mockData.last_week_earnings || 0,
          thisMonthEarnings: mockData.this_month_earnings || 0,
          lastMonthEarnings: mockData.last_month_earnings || 0,
        });
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
