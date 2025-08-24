
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Clock, CheckCircle, XCircle, User, Phone } from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';

interface UserRequest {
  id: string;
  user_id: string;
  operation_type: 'recharge' | 'withdrawal';
  amount: number;
  payment_method: string;
  payment_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: {
    full_name: string;
    phone: string;
  };
}

const SubAdminRechargeTab = () => {
  // Données mockées temporaires en attendant la mise à jour des types Supabase
  const userRequests: UserRequest[] = [
    {
      id: '1',
      user_id: 'user1',
      operation_type: 'recharge',
      amount: 25000,
      payment_method: 'Orange Money',
      payment_phone: '+237677123456',
      status: 'pending',
      created_at: new Date().toISOString(),
      user: {
        full_name: 'Jean Baptiste Kamga',
        phone: '+237677123456'
      }
    },
    {
      id: '2',
      user_id: 'user2',
      operation_type: 'withdrawal',
      amount: 15000,
      payment_method: 'MTN Mobile Money',
      payment_phone: '+237698765432',
      status: 'pending',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      user: {
        full_name: 'Marie Claire Fouda',
        phone: '+237698765432'
      }
    },
    {
      id: '3',
      user_id: 'user3',
      operation_type: 'recharge',
      amount: 50000,
      payment_method: 'Orange Money',
      payment_phone: '+237655432198',
      status: 'approved',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      user: {
        full_name: 'Paul André Mballa',
        phone: '+237655432198'
      }
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const getOperationIcon = (type: string) => {
    return type === 'recharge' ? (
      <CreditCard className="w-4 h-4 text-green-500" />
    ) : (
      <CreditCard className="w-4 h-4 text-blue-500" />
    );
  };

  const handleApproveRequest = (requestId: string) => {
    console.log('Approving request:', requestId);
    // Ici on implémenterait la logique d'approbation
  };

  const handleRejectRequest = (requestId: string) => {
    console.log('Rejecting request:', requestId);
    // Ici on implémenterait la logique de rejet
  };

  const pendingRequests = userRequests.filter(req => req.status === 'pending');
  const totalPendingAmount = pendingRequests.reduce((sum, req) => sum + req.amount, 0);
  const rechargeRequests = userRequests.filter(req => req.operation_type === 'recharge').length;
  const withdrawalRequests = userRequests.filter(req => req.operation_type === 'withdrawal').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Gestion des Demandes</h2>
        </div>
      </div>

      {/* Statistiques générales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes en Attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-sm text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total en Attente</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPendingAmount, 'XAF')}</div>
            <p className="text-sm text-muted-foreground">Toutes demandes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes de Recharge</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rechargeRequests}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes de Retrait</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withdrawalRequests}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des demandes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Demandes Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getOperationIcon(request.operation_type)}
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {request.user?.full_name || 'Utilisateur inconnu'}
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {request.user?.phone || request.payment_phone}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type: </span>
                    <span className="font-semibold">
                      {request.operation_type === 'recharge' ? 'Recharge' : 'Retrait'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant: </span>
                    <span className="font-semibold">{formatCurrency(request.amount, 'XAF')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Méthode: </span>
                    <span className="font-semibold">{request.payment_method}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date: </span>
                    <span className="font-semibold">
                      {new Date(request.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApproveRequest(request.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approuver
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeter
                    </Button>
                  </div>
                )}
              </div>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                Aucune demande pour le moment
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminRechargeTab;
