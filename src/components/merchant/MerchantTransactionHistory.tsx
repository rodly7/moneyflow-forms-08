import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const MerchantTransactionHistory = () => {
  // Données d'exemple - à remplacer par de vraies données
  const transactions = [
    {
      id: 'TX001',
      amount: 5000,
      customerName: 'Client A',
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      description: 'Commande #123'
    },
    {
      id: 'TX002',
      amount: 2500,
      customerName: 'Client B',
      status: 'pending',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1h ago
      description: 'Achat divers'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Payé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Échoué</Badge>;
      default:
        return <Badge>Inconnu</Badge>;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Paiements</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun paiement reçu aujourd'hui</p>
            <p className="text-sm text-muted-foreground mt-2">
              Les paiements par QR code apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(transaction.status)}
                  <div>
                    <p className="font-medium">{transaction.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(transaction.timestamp)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {transaction.amount.toLocaleString()} XAF
                  </p>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MerchantTransactionHistory;