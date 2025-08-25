
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download,
  Receipt,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  RefreshCw,
  Search
} from 'lucide-react';
import { useCompleteTransactions } from '@/hooks/useCompleteTransactions';
import { useAuth } from '@/contexts/AuthContext';

const CompleteTransactionHistory = () => {
  const { user } = useAuth();
  const { transactions, loading, refetch } = useCompleteTransactions(user?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className="w-5 h-5 text-green-600" />;
      case 'withdrawal':
        return <Download className="w-5 h-5 text-red-600" />;
      case 'transfer_sent':
        return <ArrowUpRight className="w-5 h-5 text-orange-600" />;
      case 'transfer_received':
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'bill_payment':
        return <Receipt className="w-5 h-5 text-purple-600" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Dépôt';
      case 'withdrawal':
        return 'Retrait';
      case 'transfer_sent':
        return 'Transfert envoyé';
      case 'transfer_received':
        return 'Transfert reçu';
      case 'bill_payment':
        return 'Paiement facture';
      default:
        return type;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'transfer_received':
        return 'text-green-600';
      case 'withdrawal':
      case 'transfer_sent':
      case 'bill_payment':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'transfer_received':
        return '+';
      case 'withdrawal':
      case 'transfer_sent':
      case 'bill_payment':
        return '-';
      default:
        return '';
    }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filtrage par période
    if (periodFilter !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (periodFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(transaction => 
        transaction.date >= startDate
      );
    }

    // Filtrage par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.type === typeFilter
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.status === statusFilter
      );
    }

    // Recherche textuelle
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.recipient?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [transactions, periodFilter, typeFilter, statusFilter, searchTerm]);

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((sum, transaction) => {
      if (transaction.type === 'deposit' || transaction.type === 'transfer_received') {
        return sum + transaction.amount;
      } else {
        return sum - transaction.amount;
      }
    }, 0);
  }, [filteredTransactions]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Chargement des transactions...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solde Net</p>
                <p className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalAmount >= 0 ? '+' : ''}{totalAmount.toLocaleString()} XAF
                </p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Complétées</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredTransactions.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="deposit">Dépôts</SelectItem>
                <SelectItem value="withdrawal">Retraits</SelectItem>
                <SelectItem value="transfer_sent">Transferts envoyés</SelectItem>
                <SelectItem value="transfer_received">Transferts reçus</SelectItem>
                <SelectItem value="bill_payment">Paiements factures</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="completed">Réussi</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={refetch} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique Complet ({filteredTransactions.length} transactions)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground mb-2">Aucune transaction trouvée</p>
              <p className="text-sm text-muted-foreground">
                Modifiez vos filtres pour voir plus de résultats
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-gray-100">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{getTypeLabel(transaction.type)}</h3>
                        {getStatusIcon(transaction.status)}
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status === 'completed' ? 'Réussi' : 
                           transaction.status === 'pending' ? 'En attente' : 
                           transaction.status === 'failed' ? 'Échoué' : 'Annulé'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">{transaction.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{transaction.date.toLocaleDateString('fr-FR')}</span>
                        <span>{transaction.date.toLocaleTimeString('fr-FR')}</span>
                        {transaction.reference_id && (
                          <span className="font-mono">Réf: {transaction.reference_id.substring(0, 8)}</span>
                        )}
                      </div>
                      
                      {(transaction.sender || transaction.recipient) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {transaction.sender && `De: ${transaction.sender}`}
                          {transaction.recipient && `Vers: ${transaction.recipient}`}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getAmountColor(transaction.type)}`}>
                      {getAmountPrefix(transaction.type)}{transaction.amount.toLocaleString()} {transaction.currency}
                    </div>
                    {transaction.fees && transaction.fees > 0 && (
                      <div className="text-xs text-gray-500">
                        Frais: {transaction.fees.toLocaleString()} XAF
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteTransactionHistory;
