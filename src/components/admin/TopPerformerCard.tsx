import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, User, Shield, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TopPerformer {
  id: string;
  full_name: string | null;
  phone: string;
  role: 'user' | 'agent';
  transaction_count: number;
  total_volume: number;
}

const TopPerformerCard = () => {
  const [topPerformer, setTopPerformer] = useState<TopPerformer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTopPerformer = async () => {
    try {
      // Récupérer les transferts par utilisateur
      const { data: transfersData } = await supabase
        .from('transfers')
        .select(`
          sender_id,
          amount,
          profiles!transfers_sender_id_fkey(full_name, phone, role)
        `)
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Dernières 24h

      // Récupérer les retraits par utilisateur
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select(`
          user_id,
          amount,
          profiles!withdrawals_user_id_fkey(full_name, phone, role)
        `)
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Dernières 24h

      // Combiner et compter les transactions
      const userStats = new Map<string, {
        id: string;
        full_name: string | null;
        phone: string;
        role: 'user' | 'agent';
        transaction_count: number;
        total_volume: number;
      }>();

      // Traiter les transferts
      transfersData?.forEach(transfer => {
        const profile = transfer.profiles as any;
        if (profile) {
          const existing = userStats.get(transfer.sender_id) || {
            id: transfer.sender_id,
            full_name: profile.full_name,
            phone: profile.phone,
            role: profile.role,
            transaction_count: 0,
            total_volume: 0
          };
          existing.transaction_count += 1;
          existing.total_volume += transfer.amount;
          userStats.set(transfer.sender_id, existing);
        }
      });

      // Traiter les retraits
      withdrawalsData?.forEach(withdrawal => {
        const profile = withdrawal.profiles as any;
        if (profile) {
          const existing = userStats.get(withdrawal.user_id) || {
            id: withdrawal.user_id,
            full_name: profile.full_name,
            phone: profile.phone,
            role: profile.role,
            transaction_count: 0,
            total_volume: 0
          };
          existing.transaction_count += 1;
          existing.total_volume += withdrawal.amount;
          userStats.set(withdrawal.user_id, existing);
        }
      });

      // Trouver le top performer
      let topUser: TopPerformer | null = null;
      for (const user of userStats.values()) {
        if (!topUser || user.transaction_count > topUser.transaction_count) {
          topUser = user;
        }
      }

      setTopPerformer(topUser);
    } catch (error) {
      console.error('Erreur lors du chargement du top performer:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le top performer",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopPerformer();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchTopPerformer, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top Performer (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Top Performer (24h)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!topPerformer ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucune transaction dans les dernières 24h
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {topPerformer.role === 'agent' ? (
                    <Shield className="h-6 w-6" />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {topPerformer.full_name || "Nom non défini"}
                  </p>
                  <Badge variant={topPerformer.role === 'agent' ? 'default' : 'secondary'}>
                    {topPerformer.role === 'agent' ? 'Agent' : 'Utilisateur'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{topPerformer.phone}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {topPerformer.transaction_count}
                </p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-bold text-primary">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XAF',
                    maximumFractionDigits: 0,
                    notation: 'compact'
                  }).format(topPerformer.total_volume)}
                </p>
                <p className="text-xs text-muted-foreground">Volume</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopPerformerCard;