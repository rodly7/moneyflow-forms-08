import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Shield, Search, User } from 'lucide-react';
import { toast } from 'sonner';

interface UserTransaction {
  user_id: string;
  user_name: string;
  phone: string;
  national_daily_amount: number;
  international_daily_amount: number;
  total_daily_amount: number;
  transaction_count: number;
  last_transaction: string;
  is_risky: boolean;
  is_verified: boolean;
}

const NATIONAL_DAILY_LIMIT = 200000; // 200,000 XAF
const INTERNATIONAL_DAILY_LIMIT = 500000; // 500,000 XAF

export const UserFraudMonitoring = () => {
  const [users, setUsers] = useState<UserTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUserTransactions();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchUserTransactions();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUserTransactions = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Récupérer les transferts du jour
      const { data: transfers, error: transfersError } = await supabase
        .from('transfers')
        .select(`
          sender_id,
          amount,
          created_at,
          status,
          recipient_country
        `)
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`)
        .eq('status', 'completed');

      if (transfersError) throw transfersError;

      // Récupérer les retraits du jour
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select(`
          user_id,
          amount,
          created_at,
          status
        `)
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`)
        .eq('status', 'completed');

      if (withdrawalsError) throw withdrawalsError;

      // Récupérer les profils utilisateurs avec leur pays
      const userIds = [
        ...new Set([
          ...(transfers?.map(t => t.sender_id) || []),
          ...(withdrawals?.map(w => w.user_id) || [])
        ])
      ];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country, is_verified')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Analyser les données par utilisateur
      const userStats = new Map<string, UserTransaction>();

      // Traiter les transferts
      transfers?.forEach(transfer => {
        const userId = transfer.sender_id;
        const userProfile = profilesMap.get(userId);
        const userName = userProfile?.full_name || 'Inconnu';
        const phone = userProfile?.phone || '';
        const amount = Number(transfer.amount);
        
        // Déterminer si c'est un transfert national ou international
        const senderCountry = userProfile?.country;
        const recipientCountry = transfer.recipient_country;
        const isInternational = senderCountry !== recipientCountry;

        if (!userStats.has(userId)) {
          userStats.set(userId, {
            user_id: userId,
            user_name: userName,
            phone,
            national_daily_amount: isInternational ? 0 : amount,
            international_daily_amount: isInternational ? amount : 0,
            total_daily_amount: amount,
            transaction_count: 1,
            last_transaction: transfer.created_at,
            is_risky: false,
            is_verified: userProfile?.is_verified || false
          });
        } else {
          const existing = userStats.get(userId)!;
          if (isInternational) {
            existing.international_daily_amount += amount;
          } else {
            existing.national_daily_amount += amount;
          }
          existing.total_daily_amount += amount;
          existing.transaction_count += 1;
          if (new Date(transfer.created_at) > new Date(existing.last_transaction)) {
            existing.last_transaction = transfer.created_at;
          }
        }
      });

      // Traiter les retraits
      withdrawals?.forEach(withdrawal => {
        const userId = withdrawal.user_id;
        const userProfile = profilesMap.get(userId);
        const userName = userProfile?.full_name || 'Inconnu';
        const phone = userProfile?.phone || '';
        const amount = Number(withdrawal.amount);

        if (!userStats.has(userId)) {
          userStats.set(userId, {
            user_id: userId,
            user_name: userName,
            phone,
            national_daily_amount: amount, // Considérer les retraits comme nationaux
            international_daily_amount: 0,
            total_daily_amount: amount,
            transaction_count: 1,
            last_transaction: withdrawal.created_at,
            is_risky: false,
            is_verified: userProfile?.is_verified || false
          });
        } else {
          const existing = userStats.get(userId)!;
          existing.national_daily_amount += amount;
          existing.total_daily_amount += amount;
          existing.transaction_count += 1;
          if (new Date(withdrawal.created_at) > new Date(existing.last_transaction)) {
            existing.last_transaction = withdrawal.created_at;
          }
        }
      });

      // Marquer les utilisateurs à risque
      const userList = Array.from(userStats.values()).map(user => ({
        ...user,
        is_risky: user.national_daily_amount > NATIONAL_DAILY_LIMIT || 
                 user.international_daily_amount > INTERNATIONAL_DAILY_LIMIT
      }));

      // Trier par montant total décroissant
      userList.sort((a, b) => b.total_daily_amount - a.total_daily_amount);

      setUsers(userList);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      toast.error('Erreur lors du chargement des données de fraude');
    } finally {
      setLoading(false);
    }
  };

  const banUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_banned: true, 
          banned_at: new Date().toISOString(),
          banned_reason: 'Dépassement des plafonds de transaction journaliers'
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Utilisateur ${userName} banni avec succès`);
      fetchUserTransactions(); // Rafraîchir les données
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      toast.error('Erreur lors du bannissement de l\'utilisateur');
    }
  };

  const filteredUsers = users.filter(user =>
    user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  const riskyUsers = filteredUsers.filter(user => user.is_risky);
  const totalRiskyAmount = riskyUsers.reduce((sum, user) => sum + user.total_daily_amount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs à risque</p>
                <p className="text-2xl font-bold text-destructive">{riskyUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total utilisateurs actifs</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Montant à risque (XAF)</p>
              <p className="text-2xl font-bold text-destructive">
                {totalRiskyAmount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Plafond National</p>
              <p className="text-lg font-bold text-orange-600">
                {NATIONAL_DAILY_LIMIT.toLocaleString()} XAF
              </p>
              <p className="text-sm text-muted-foreground">Plafond International</p>
              <p className="text-lg font-bold text-red-600">
                {INTERNATIONAL_DAILY_LIMIT.toLocaleString()} XAF
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchUserTransactions} variant="outline">
          <Shield className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Auto-refresh 5s</span>
        </div>
      </div>

      {/* Alert for risky users */}
      {riskyUsers.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {riskyUsers.length} utilisateur(s) ont dépassé les plafonds journaliers de transaction.
            Montant total à risque: {totalRiskyAmount.toLocaleString()} XAF
          </AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring des Transactions Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.user_id}
                className={`p-4 rounded-lg border ${
                  user.is_risky ? 'border-destructive bg-destructive/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{user.user_name}</h4>
                      <Badge variant={user.is_risky ? 'destructive' : 'secondary'}>
                        {user.phone}
                      </Badge>
                      <Badge variant={user.is_verified ? 'default' : 'outline'}>
                        {user.is_verified ? '✓ Vérifié' : '⚠ Non vérifié'}
                      </Badge>
                      {user.is_risky && (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          À RISQUE
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">National: </span>
                        <span className={user.national_daily_amount > NATIONAL_DAILY_LIMIT ? 'text-destructive font-medium' : ''}>
                          {user.national_daily_amount.toLocaleString()} XAF
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">International: </span>
                        <span className={user.international_daily_amount > INTERNATIONAL_DAILY_LIMIT ? 'text-destructive font-medium' : ''}>
                          {user.international_daily_amount.toLocaleString()} XAF
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transactions: </span>
                        <span>{user.transaction_count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dernière: </span>
                        <span>{new Date(user.last_transaction).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {user.is_risky && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => banUser(user.user_id, user.user_name)}
                    >
                      Bannir
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};