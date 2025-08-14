
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSubAdmin } from '@/hooks/useSubAdmin';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, Search, Filter, Download, 
  ArrowUpRight, ArrowDownLeft, CreditCard,
  Clock, CheckCircle, XCircle, AlertCircle,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';

interface Transaction {
  id: string;
  type: 'transfer' | 'withdrawal' | 'deposit';
  amount: number;
  status: string;
  timestamp: string;
  sender?: { full_name: string; phone: string } | null;
  recipient?: { full_name: string; phone: string } | null;
  user?: { full_name: string; phone: string } | null;
  fees?: number;
  currency?: string;
}

const SubAdminTransactionMonitor = () => {
  const { toast } = useToast();
  const { canMonitorTransactions, canExportReports, userCountry } = useSubAdmin();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadTransactions = async () => {
    if (!canMonitorTransactions) return;

    setLoading(true);
    try {
      // Charger les transferts
      const { data: transfersData, error: transfersError } = await supabase
        .from('transfers')
        .select(`
          id,
          amount,
          fees,
          status,
          created_at,
          sender:sender_id(full_name, phone, country),
          recipient_full_name,
          recipient_phone,
          recipient_country
        `)
        .eq('sender.country', userCountry)
        .order('created_at', { ascending: false })
        .limit(100);

      if (transfersError) throw transfersError;

      // Charger les retraits
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select(`
          id,
          amount,
          status,
          created_at,
          user:user_id(full_name, phone, country),
          withdrawal_phone
        `)
        .eq('user.country', userCountry)
        .order('created_at', { ascending: false })
        .limit(100);

      if (withdrawalsError) throw withdrawalsError;

      // Charger les dépôts
      const { data: depositsData, error: depositsError } = await supabase
        .from('recharges')
        .select(`
          id,
          amount,
          status,
          created_at,
          user:user_id(full_name, phone, country),
          payment_phone,
          currency
        `)
        .eq('user.country', userCountry)
        .order('created_at', { ascending: false })
        .limit(100);

      if (depositsError) throw depositsError;

      // Transformer et combiner les données
      const formattedTransactions: Transaction[] = [
        ...(transfersData?.map(t => ({
          id: t.id,
          type: 'transfer' as const,
          amount: t.amount,
          status: t.status,
          timestamp: t.created_at,
          sender: t.sender,
          recipient: {
            full_name: t.recipient_full_name,
            phone: t.recipient_phone
          },
          fees: t.fees,
          currency: 'XAF'
        })) || []),
        ...(withdrawalsData?.map(w => ({
          id: w.id,
          type: 'withdrawal' as const,
          amount: w.amount,
          status: w.status,
          timestamp: w.created_at,
          user: w.user,
          fees: 0,
          currency: 'XAF'
        })) || []),
        ...(depositsData?.map(d => ({
          id: d.id,
          type: 'deposit' as const,
          amount: d.amount,
          status: d.status,
          timestamp: d.created_at,
          user: d.user,
          fees: 0,
          currency: d.currency || 'XAF'
        })) || [])
      ];

      // Trier par date
      formattedTransactions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setTransactions(formattedTransactions);

    } catch (error: any) {
      console.error('Erreur chargement transactions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    
    // Auto-refresh toutes les 60 secondes
    const interval = setInterval(loadTransactions, 60000);
    return () => clearInterval(interval);
  }, [canMonitorTransactions, userCountry]);

  const filteredTransactions = transactions.filter(transaction => {
    const senderName = transaction.sender?.full_name || transaction.user?.full_name || '';
    const recipientName = transaction.recipient?.full_name || '';
    
    const matchesSearch = searchTerm === '' || 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const exportToPDF = () => {
    if (!canExportReports) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions pour exporter",
        variant: "destructive"
      });
      return;
    }

    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(18);
    doc.text(`Rapport Transactions - ${userCountry}`, 20, 20);
    
    // Date
    doc.setFontSize(12);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 20, 30);
    doc.text(`Total transactions: ${filteredTransactions.length}`, 20, 40);
    
    // En-têtes du tableau
    let yPos = 60;
    doc.setFontSize(10);
    doc.text('Type', 20, yPos);
    doc.text('Montant', 60, yPos);
    doc.text('Statut', 100, yPos);
    doc.text('Date', 140, yPos);
    
    // Ligne de séparation
    doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 10;
    
    // Données des transactions
    filteredTransactions.slice(0, 30).forEach((transaction) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(transaction.type, 20, yPos);
      doc.text(`${transaction.amount.toLocaleString()} FCFA`, 60, yPos);
      doc.text(transaction.status, 100, yPos);
      doc.text(new Date(transaction.timestamp).toLocaleDateString('fr-FR'), 140, yPos);
      
      yPos += 8;
    });
    
    // Statistiques
    const totalVolume = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const completedTransactions = filteredTransactions.filter(t => t.status === 'completed').length;
    
    yPos += 10;
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.text('Statistiques:', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Volume total: ${totalVolume.toLocaleString()} FCFA`, 20, yPos);
    yPos += 8;
    doc.text(`Transactions complétées: ${completedTransactions}`, 20, yPos);
    
    // Télécharger
    doc.save(`rapport-transactions-${userCountry}-${Date.now()}.pdf`);
    
    toast({
      title: "Export réussi",
      description: `Rapport PDF généré avec ${filteredTransactions.length} transactions`
    });
  };

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

  if (!canMonitorTransactions) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès limité</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions pour surveiller les transactions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Surveillance des Transactions</h2>
          <p className="text-muted-foreground">
            Monitoring des transactions dans votre territoire{userCountry && ` (${userCountry})`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={filteredTransactions.length === 0 || !canExportReports}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF ({filteredTransactions.length})
          </Button>
          
          <Button
            onClick={loadTransactions}
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
              Auto-refresh: 60s
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
                  {filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} FCFA
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

      {/* Liste des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions Récentes</CardTitle>
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
            
            {!loading && filteredTransactions.map((transaction) => {
              const Icon = getTransactionIcon(transaction.type);
              const senderName = transaction.sender?.full_name || transaction.user?.full_name || 'N/A';
              const recipientName = transaction.recipient?.full_name || 'N/A';
              
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
                        <Badge variant="outline">
                          {transaction.type === 'transfer' ? 'Transfert' : 
                           transaction.type === 'withdrawal' ? 'Retrait' : 'Dépôt'}
                        </Badge>
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
                        {transaction.amount.toLocaleString()} FCFA
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.timestamp).toLocaleString('fr-FR')}
                    </div>
                    
                    {transaction.fees && transaction.fees > 0 && (
                      <div className="text-xs text-orange-600 font-medium">
                        Frais: {transaction.fees.toLocaleString()} FCFA
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

export default SubAdminTransactionMonitor;
