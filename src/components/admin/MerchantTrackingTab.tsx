import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Store, 
  DollarSign, 
  Calendar,
  TrendingUp,
  Eye,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface MerchantData {
  id: string;
  user_id: string;
  merchant_id: string;
  business_name: string;
  amount: number;
  description: string;
  created_at: string;
  status: string;
  user_profile?: {
    full_name: string;
    phone: string;
    balance: number;
  } | null;
}

interface MerchantStats {
  total_transactions: number;
  total_amount: number;
  today_transactions: number;
  today_amount: number;
}

export const MerchantTrackingTab = () => {
  const [merchants, setMerchants] = useState<MerchantData[]>([]);
  const [stats, setStats] = useState<MerchantStats>({
    total_transactions: 0,
    total_amount: 0,
    today_transactions: 0,
    today_amount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      
      // Charger les paiements marchands directement
      const { data: payments, error } = await supabase
        .from('merchant_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Charger les profils utilisateurs séparément
      const userIds = [...new Set(payments?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance')
        .in('id', userIds);

      // Transformer les données pour correspondre à l'interface
      const transformedPayments = (payments || []).map(payment => {
        const profile = profiles?.find(p => p.id === payment.user_id);
        return {
          ...payment,
          user_profile: profile ? {
            full_name: profile.full_name,
            phone: profile.phone,
            balance: profile.balance
          } : null
        };
      });
      
      setMerchants(transformedPayments);

      // Calculer les statistiques
      const today = new Date().toISOString().split('T')[0];
      const todayPayments = payments?.filter(p => 
        p.created_at.startsWith(today)
      ) || [];

      setStats({
        total_transactions: payments?.length || 0,
        total_amount: payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        today_transactions: todayPayments.length,
        today_amount: todayPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      });

    } catch (error) {
      console.error('Erreur chargement marchands:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  const filteredMerchants = merchants.filter(merchant => 
    merchant.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.merchant_id?.includes(searchTerm) ||
    merchant.user_profile?.phone?.includes(searchTerm)
  );

  // Grouper par marchand
  const merchantGroups = filteredMerchants.reduce((groups, payment) => {
    const key = payment.merchant_id;
    if (!groups[key]) {
      groups[key] = {
        merchant_id: payment.merchant_id,
        business_name: payment.business_name,
        payments: [],
        total_amount: 0,
        transaction_count: 0
      };
    }
    groups[key].payments.push(payment);
    groups[key].total_amount += Number(payment.amount);
    groups[key].transaction_count += 1;
    return groups;
  }, {} as any);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Suivi des Marchands</h2>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {Object.keys(merchantGroups).length} marchands actifs
        </Badge>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.total_transactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volume Total</p>
                <p className="text-2xl font-bold">{stats.total_amount.toLocaleString()} XAF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold">{stats.today_transactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volume Aujourd'hui</p>
                <p className="text-2xl font-bold">{stats.today_amount.toLocaleString()} XAF</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Rechercher des marchands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Rechercher par nom d'entreprise, ID marchand ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Liste des marchands */}
      <div className="grid gap-4">
        {Object.values(merchantGroups).map((group: any) => (
          <Card key={group.merchant_id} className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5" />
                      <h3 className="font-semibold text-lg">{group.business_name}</h3>
                    </div>
                    <Badge variant="default">
                      ID: {group.merchant_id}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>{group.transaction_count} transactions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-green-600 font-semibold">
                        {group.total_amount.toLocaleString()} XAF
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Dernière: {new Date(group.payments[0].created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {/* Dernières transactions */}
                  {selectedMerchant === group.merchant_id && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">Dernières transactions:</h4>
                      {group.payments.slice(0, 5).map((payment: MerchantData) => (
                        <div key={payment.id} className="bg-white p-3 rounded border text-sm">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{payment.amount.toLocaleString()} XAF</span>
                              {payment.description && (
                                <span className="text-gray-600 ml-2">- {payment.description}</span>
                              )}
                            </div>
                            <div className="text-gray-500">
                              {new Date(payment.created_at).toLocaleString('fr-FR')}
                            </div>
                          </div>
                          {payment.user_profile && (
                            <div className="text-gray-600 text-xs mt-1">
                              Client: {payment.user_profile.full_name} ({payment.user_profile.phone})
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMerchant(
                      selectedMerchant === group.merchant_id ? null : group.merchant_id
                    )}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {selectedMerchant === group.merchant_id ? 'Masquer' : 'Détails'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {Object.keys(merchantGroups).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Store className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Aucun marchand trouvé</h3>
              <p className="text-muted-foreground">
                Aucune transaction marchande ne correspond à votre recherche.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};