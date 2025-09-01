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

  // Données d'exemple pour l'affichage graphique
  const weeklyStats = [
    { day: 'Lun', amount: 15000, transactions: 8 },
    { day: 'Mar', amount: 12000, transactions: 6 },
    { day: 'Mer', amount: 18000, transactions: 12 },
    { day: 'Jeu', amount: 22000, transactions: 15 },
    { day: 'Ven', amount: 35000, transactions: 24 },
    { day: 'Sam', amount: 28000, transactions: 18 },
    { day: 'Dim', amount: 8000, transactions: 4 }
  ];

  const totalWeekly = weeklyStats.reduce((sum, day) => sum + day.amount, 0);
  const totalTransactions = weeklyStats.reduce((sum, day) => sum + day.transactions, 0);
  const avgTransaction = totalTransactions > 0 ? totalWeekly / totalTransactions : 0;

  return (
    <div className="space-y-6">
      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Résumé de la Semaine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.todayTotal.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Aujourd'hui</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.monthTotal.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Ce mois</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{Math.round(stats.avgTransaction).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Panier moyen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">0</p>
              <p className="text-sm text-muted-foreground">Frais payés</p>
            </div>
          </div>

          <div className="space-y-3">
            {weeklyStats.map((day, index) => {
              const percentage = totalWeekly > 0 ? (day.amount / totalWeekly) * 100 : 0;
              return (
                <div key={day.day} className="flex items-center space-x-4">
                  <div className="w-12 text-sm font-medium">{day.day}</div>
                  <div className="flex-1">
                    <div className="bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm font-medium">
                    {day.amount.toLocaleString()}
                  </div>
                  <div className="w-16 text-right">
                    <Badge variant="outline" className="text-xs">
                      {day.transactions} tx
                    </Badge>
                  </div>
                </div>
              );
            })}
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