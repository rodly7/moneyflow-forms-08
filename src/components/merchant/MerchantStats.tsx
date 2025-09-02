import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Users, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MerchantStats = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    todayTotal: 0,
    monthTotal: 0,
    totalTransactions: 0,
    avgTransaction: 0
  });
  const [loading, setLoading] = useState(true);

  // Charger les vraies statistiques
  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;
      
      try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Stats du jour
        const { data: todayData } = await supabase
          .from('merchant_payments')
          .select('amount')
          .eq('merchant_id', profile.id)
          .gte('created_at', startOfToday.toISOString())
          .eq('status', 'completed');

        // Stats du mois
        const { data: monthData } = await supabase
          .from('merchant_payments')
          .select('amount')
          .eq('merchant_id', profile.id)
          .gte('created_at', startOfMonth.toISOString())
          .eq('status', 'completed');

        const todayTotal = todayData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const monthTotal = monthData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const totalTransactions = monthData?.length || 0;
        const avgTransaction = totalTransactions > 0 ? monthTotal / totalTransactions : 0;

        setStats({
          todayTotal,
          monthTotal,
          totalTransactions,
          avgTransaction
        });
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile?.id]);


  return (
    <div className="space-y-6">
      {/* Statistiques Détaillées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Statistiques Détaillées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.todayTotal.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Paiements du jour (XAF)</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.monthTotal.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total du mois (XAF)</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</p>
              <p className="text-sm text-muted-foreground">Transactions totales</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{Math.round(stats.avgTransaction).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Panier moyen (XAF)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Card */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <TrendingUp className="h-5 w-5 mr-2" />
            Avantages SendFlow Merchant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Paiements sans frais</p>
                <p className="text-sm text-muted-foreground">0% de commission</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Paiements instantanés</p>
                <p className="text-sm text-muted-foreground">Réception immédiate</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/50 p-4 rounded-lg">
            <p className="text-sm text-center text-green-700">
              💡 <strong>Astuce :</strong> Affichez votre QR code à la caisse pour faciliter les paiements !
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantStats;