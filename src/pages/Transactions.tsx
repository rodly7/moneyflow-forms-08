
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  FileText, 
  Search, 
  Filter,
  Calendar,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { useUnifiedTransactions } from '@/hooks/useUnifiedTransactions';
import { useAuth } from '@/contexts/AuthContext';

const Transactions = () => {
  const { user } = useAuth();
  const { transactions, isLoading } = useUnifiedTransactions(user?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  console.log("📄 PAGE TRANSACTIONS - Total transactions:", transactions.length);

  // Filtrage des transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.amount.toString().includes(searchTerm);
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'recharge': return <Plus className="w-4 h-4 text-green-600" />;
      case 'withdrawal': return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'transfer_sent': return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      case 'transfer_received': return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'bill_payment': return <FileText className="w-4 h-4 text-purple-600" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'recharge': return 'Recharge';
      case 'withdrawal': return 'Retrait';
      case 'transfer_sent': return 'Transfert envoyé';
      case 'transfer_received': return 'Transfert reçu';
      case 'bill_payment': return 'Paiement facture';
      default: return type;
    }
  };

  const getAmountColor = (impact: string) => {
    return impact === 'credit' ? 'text-green-600' : 'text-red-600';
  };

  const getAmountPrefix = (impact: string) => {
    return impact === 'credit' ? '+' : '-';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const labels = {
      completed: 'Complété',
      pending: 'En attente', 
      failed: 'Échoué'
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  // Statistiques
  const stats = {
    total: transactions.length,
    recharges: transactions.filter(t => t.type === 'recharge').length,
    retraits: transactions.filter(t => t.type === 'withdrawal').length,
    transferts: transactions.filter(t => t.type.startsWith('transfer')).length,
    factures: transactions.filter(t => t.type === 'bill_payment').length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Historique des transactions</h1>
          <p className="text-gray-600">Consultez l'ensemble de vos transactions</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.recharges}</div>
              <div className="text-sm text-gray-600">Recharges</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.retraits}</div>
              <div className="text-sm text-gray-600">Retraits</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.transferts}</div>
              <div className="text-sm text-gray-600">Transferts</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.factures}</div>
              <div className="text-sm text-gray-600">Factures</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une transaction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type de transaction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="recharge">Recharges</SelectItem>
                  <SelectItem value="withdrawal">Retraits</SelectItem>
                  <SelectItem value="transfer_sent">Transferts envoyés</SelectItem>
                  <SelectItem value="transfer_received">Transferts reçus</SelectItem>
                  <SelectItem value="bill_payment">Paiements de factures</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Complété</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des transactions */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Transactions ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Aucune transaction trouvée</p>
                <p className="text-sm">Essayez de modifier vos filtres</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 border border-gray-200"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 rounded-full bg-white border-2">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">
                            {getTransactionLabel(transaction.type)}
                          </span>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>📅 {transaction.date.toLocaleDateString('fr-FR')}</span>
                          <span>🕒 {transaction.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {transaction.verification_code && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Code: {transaction.verification_code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-lg font-bold ${getAmountColor(transaction.impact)}`}>
                        {getAmountPrefix(transaction.impact)}{formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                      {transaction.fees && transaction.fees > 0 && (
                        <p className="text-xs text-gray-500">
                          Frais: {transaction.fees.toLocaleString()} XAF
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Transactions;
