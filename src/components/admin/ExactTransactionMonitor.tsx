
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, Search, Filter, Download, 
  ArrowUpRight, ArrowDownLeft, CreditCard,
  Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { AdminReportService } from '@/services/adminReportService';
import { formatCurrency } from '@/lib/utils/currency';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'transfer' | 'withdrawal' | 'deposit';
  amount: number;
  status: string;
  timestamp: string;
  sender?: { full_name: string; phone: string } | null;
  user?: { full_name: string; phone: string } | null;
  recipient_full_name?: string;
  recipient_phone?: string;
  fees?: number;
  currency?: string;
}

const ExactTransactionMonitor = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const loadRecentTransactions = async () => {
    setLoading(true);
    try {
      const recentTransactions = await AdminReportService.getRecentTransactions(100);
      
      // Transform the data to match our interface with proper type checking
      const transformedTransactions: Transaction[] = recentTransactions.map(transaction => {
        const baseTransaction = {
          id: transaction.id,
          type: transaction.type as 'transfer' | 'withdrawal' | 'deposit',
          amount: transaction.amount,
          status: transaction.status,
          timestamp: transaction.timestamp,
        };

        // Handle transfer type
        if (transaction.type === 'transfer') {
          const transferData = transaction as any;
          return {
            ...baseTransaction,
            sender: transferData.sender || null,
            recipient_full_name: transferData.recipient_full_name || '',
            recipient_phone: transferData.recipient_phone || '',
            fees: transferData.fees || 0,
            currency: transferData.currency || 'XAF'
          };
        } 
        
        // Handle withdrawal type
        if (transaction.type === 'withdrawal') {
          const withdrawalData = transaction as any;
          return {
            ...baseTransaction,
            user: withdrawalData.user || null,
            recipient_phone: withdrawalData.withdrawal_phone || '',
            fees: 0,
            currency: 'XAF'
          };
        } 
        
        // Handle deposit type
        if (transaction.type === 'deposit') {
          const depositData = transaction as any;
          return {
            ...baseTransaction,
            user: depositData.user || null,
            fees: 0,
            currency: depositData.currency || 'XAF'
          };
        }

        // Fallback
        return {
          ...baseTransaction,
          fees: 0,
          currency: 'XAF'
        };
      });
      
      setTransactions(transformedTransactions);
      
      console.log('🔄 Transactions mises à jour:', transformedTransactions.length);
    } catch (error: any) {
      console.error('Erreur chargement transactions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les transactions récentes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentTransactions();
    
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(() => {
      loadRecentTransactions();
    }, 30000);
    
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const senderName = transaction.sender?.full_name || transaction.user?.full_name || '';
    const recipientName = transaction.recipient_full_name || '';
    
    const matchesSearch = searchTerm === '' || 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'transfer': return ArrowUpRight;
      case 'withdrawal': return ArrowDownLeft;
      case 'deposit': return CreditCard;
      default: return Clock;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'bg-green-500', label: 'Complété', icon: CheckCircle },
      pending: { color: 'bg-yellow-500', label: 'En cours', icon: Clock },
      failed: { color: 'bg-red-500', label: 'Échoué', icon: XCircle },
      cancelled: { color: 'bg-gray-500', label: 'Annulé', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      transfer: { color: 'bg-blue-500', label: 'Transfert' },
      withdrawal: { color: 'bg-orange-500', label: 'Retrait' },
      deposit: { color: 'bg-green-500', label: 'Dépôt' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || { color: 'bg-gray-500', label: type };

    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const exportTransactions = () => {
    const csvContent = [
      ['ID', 'Type', 'Montant', 'Statut', 'Expéditeur', 'Destinataire', 'Date', 'Frais'].join(','),
      ...filteredTransactions.map(t => [
        t.id,
        t.type,
        t.amount,
        t.status,
        t.sender?.full_name || t.user?.full_name || 'N/A',
        t.recipient_full_name || 'N/A',
        new Date(t.timestamp).toLocaleString('fr-FR'),
        t.fees || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: `${filteredTransactions.length} transactions exportées`
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Surveillance des Transactions</h2>
          <p className="text-gray-600 mt-1">Monitoring en temps réel avec données exactes</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportTransactions}
            disabled={filteredTransactions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter ({filteredTransactions.length})
          </Button>
          
          <Button
            onClick={loadRecentTransactions}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par ID, nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="pending">En cours</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="transfer">Transferts</SelectItem>
                <SelectItem value="withdrawal">Retraits</SelectItem>
                <SelectItem value="deposit">Dépôts</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Auto-refresh: 30s
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Volume Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.amount, 0))}
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
                <p className="text-sm text-gray-600">En Cours</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredTransactions.filter(t => t.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Frais Collectés</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(filteredTransactions.reduce((sum, t) => sum + (t.fees || 0), 0))}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions Récentes (Temps Réel)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading && (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600">Chargement des transactions...</p>
              </div>
            )}
            
            {!loading && filteredTransactions.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune transaction trouvée</p>
              </div>
            )}
            
            {!loading && filteredTransactions.map((transaction, index) => {
              const Icon = getTransactionIcon(transaction.type);
              const senderName = transaction.sender?.full_name || transaction.user?.full_name || 'N/A';
              const recipientName = transaction.recipient_full_name || transaction.recipient_phone || 'N/A';
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-full">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{senderName}</span>
                        {transaction.type === 'transfer' && (
                          <>
                            <ArrowUpRight className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{recipientName}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getTypeBadge(transaction.type)}
                        {getStatusBadge(transaction.status)}
                        <span className="text-xs text-gray-500">
                          ID: {transaction.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.timestamp).toLocaleString('fr-FR')}
                    </div>
                    
                    {transaction.fees && transaction.fees > 0 && (
                      <div className="text-xs text-orange-600 font-medium">
                        Frais: {formatCurrency(transaction.fees)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExactTransactionMonitor;
