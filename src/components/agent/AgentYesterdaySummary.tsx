import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';
import { Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';

interface YesterdaySummary {
  totalVolume: number;
  totalTransactions: number;
  newUsers: number;
}

const AgentYesterdaySummary = () => {
  const { user } = useAuth();
  const [yesterdaySummary, setYesterdaySummary] = useState<YesterdaySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchYesterdaySummary = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
        const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);

        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('agent_id', user.id)
          .gte('created_at', yesterdayStart.toISOString())
          .lte('created_at', yesterdayEnd.toISOString());

        if (error) {
          console.error("Erreur lors de la récupération des transactions d'hier:", error);
          setLoading(false);
          return;
        }

        const totalVolume = data.reduce((sum, transaction) => sum + transaction.amount, 0);
        const totalTransactions = data.length;

        // Récupérer le nombre de nouveaux utilisateurs (simulé ici, à adapter selon votre logique)
        const newUsers = Math.floor(Math.random() * 10); // Nombre aléatoire pour l'exemple

        setYesterdaySummary({
          totalVolume,
          totalTransactions,
          newUsers,
        });
      } catch (error) {
        console.error("Erreur lors du calcul du résumé d'hier:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchYesterdaySummary();
  }, [user?.id]);

  if (loading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Résumé d'hier</CardTitle>
        </CardHeader>
        <CardContent>
          Chargement...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Résumé d'hier</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center p-4 rounded-lg bg-gray-50">
          <Calendar className="w-6 h-6 text-gray-500 mr-3" />
          <div>
            <div className="text-sm font-medium text-gray-600">Volume Total</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(yesterdaySummary?.totalVolume || 0)}</div>
          </div>
        </div>

        <div className="flex items-center p-4 rounded-lg bg-gray-50">
          <TrendingUp className="w-6 h-6 text-green-500 mr-3" />
          <div>
            <div className="text-sm font-medium text-gray-600">Transactions</div>
            <div className="text-lg font-bold text-gray-900">{yesterdaySummary?.totalTransactions || 0}</div>
          </div>
        </div>

        <div className="flex items-center p-4 rounded-lg bg-gray-50">
          <Users className="w-6 h-6 text-blue-500 mr-3" />
          <div>
            <div className="text-sm font-medium text-gray-600">Nouveaux Utilisateurs</div>
            <div className="text-lg font-bold text-gray-900">{yesterdaySummary?.newUsers || 0}</div>
          </div>
        </div>

        <div className="flex items-center p-4 rounded-lg bg-gray-50">
          <DollarSign className="w-6 h-6 text-purple-500 mr-3" />
          <div>
            <div className="text-sm font-medium text-gray-600">Revenus</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency((yesterdaySummary?.totalVolume || 0) * 0.01)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentYesterdaySummary;
