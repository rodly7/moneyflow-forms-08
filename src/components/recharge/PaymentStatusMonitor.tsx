
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface PaymentSession {
  id: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  created_at: string;
  expires_at: string;
  ussd_code?: string;
}

const PaymentStatusMonitor = () => {
  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchPaymentSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Erreur récupération sessions:', error);
        return;
      }

      setSessions(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentSessions();

    // S'abonner aux changements en temps réel
    const subscription = supabase
      .channel('payment_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_sessions',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Changement session:', payload);
          fetchPaymentSessions();
          
          // Afficher une notification pour les changements de statut
          if (payload.eventType === 'UPDATE' && payload.new.status !== payload.old.status) {
            const newStatus = payload.new.status;
            if (newStatus === 'completed') {
              toast({
                title: "Paiement confirmé",
                description: `Votre compte a été crédité de ${payload.new.amount} XAF`,
              });
            } else if (newStatus === 'failed') {
              toast({
                title: "Paiement échoué",
                description: "Votre paiement n'a pas pu être traité",
                variant: "destructive"
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'completed':
        return 'Confirmé';
      case 'failed':
        return 'Échoué';
      case 'expired':
        return 'Expiré';
      default:
        return status;
    }
  };

  const getProviderName = (provider: string) => {
    const providers: Record<string, string> = {
      wave: 'Wave',
      orange: 'Orange Money',
      airtel: 'Airtel Money',
      momo: 'MTN MoMo'
    };
    return providers[provider] || provider;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Historique des paiements</CardTitle>
          <CardDescription>
            Suivi de vos recharges mobiles
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchPaymentSessions}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Aucune transaction trouvée
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div 
                key={session.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(session.status)}
                  <div>
                    <div className="font-medium">
                      {session.amount.toLocaleString()} {session.currency}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getProviderName(session.provider)}
                    </div>
                    {session.ussd_code && session.status === 'pending' && (
                      <div className="text-xs text-blue-600 mt-1">
                        Code USSD: {session.ussd_code}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(session.status)}>
                    {getStatusLabel(session.status)}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(session.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentStatusMonitor;
