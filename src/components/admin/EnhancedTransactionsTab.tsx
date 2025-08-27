import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, RefreshCw, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import jsPDF from 'jspdf';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  sender_full_name?: string;
  recipient_full_name?: string;
  recipient_phone?: string;
  fees: number;
  type: string;
}

interface DailyStats {
  date: string;
  totalAmount: number;
  totalFees: number;
  transactionCount: number;
  transactions: Transaction[];
}

export const EnhancedTransactionsTab = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastAutoExport, setLastAutoExport] = useState<Date | null>(null);

  const loadAllTransactions = async () => {
    try {
      setLoading(true);
      
      // Charger les transferts
      const { data: transfers, error: transferError } = await supabase
        .from('transfers')
        .select(`
          id,
          amount,
          status,
          created_at,
          recipient_full_name,
          recipient_phone,
          fees,
          sender:profiles!sender_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (transferError) throw transferError;

      // Charger les retraits
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select(`
          id,
          amount,
          status,
          created_at,
          withdrawal_phone,
          user:profiles!user_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (withdrawalError) throw withdrawalError;

      // Charger les recharges
      const { data: recharges, error: rechargeError } = await supabase
        .from('recharges')
        .select(`
          id,
          amount,
          status,
          created_at,
          user:profiles!user_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (rechargeError) throw rechargeError;

      // Formater toutes les transactions
      const formattedTransfers = transfers?.map(t => ({
        id: t.id,
        amount: t.amount,
        status: t.status,
        created_at: t.created_at,
        sender_full_name: (t.sender as any)?.full_name || 'N/A',
        recipient_full_name: t.recipient_full_name,
        recipient_phone: t.recipient_phone,
        fees: t.fees || 0,
        type: 'transfer'
      })) || [];

      const formattedWithdrawals = withdrawals?.map(w => ({
        id: w.id,
        amount: w.amount,
        status: w.status,
        created_at: w.created_at,
        sender_full_name: (w.user as any)?.full_name || 'N/A',
        recipient_full_name: 'Retrait',
        recipient_phone: w.withdrawal_phone,
        fees: w.amount * 0.01, // 1% de frais pour les retraits
        type: 'withdrawal'
      })) || [];

      const formattedRecharges = recharges?.map(r => ({
        id: r.id,
        amount: r.amount,
        status: r.status,
        created_at: r.created_at,
        sender_full_name: (r.user as any)?.full_name || 'N/A',
        recipient_full_name: 'Dépôt',
        recipient_phone: '',
        fees: 0,
        type: 'recharge'
      })) || [];

      const allTransactions = [...formattedTransfers, ...formattedWithdrawals, ...formattedRecharges]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(allTransactions);
      calculateDailyStats(allTransactions);
      
    } catch (error) {
      console.error('Erreur chargement transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDailyStats = (allTransactions: Transaction[]) => {
    const statsMap = new Map<string, DailyStats>();

    allTransactions.forEach(transaction => {
      const date = new Date(transaction.created_at).toISOString().split('T')[0];
      
      if (!statsMap.has(date)) {
        statsMap.set(date, {
          date,
          totalAmount: 0,
          totalFees: 0,
          transactionCount: 0,
          transactions: []
        });
      }

      const dayStats = statsMap.get(date)!;
      dayStats.totalAmount += transaction.amount;
      dayStats.totalFees += transaction.fees;
      dayStats.transactionCount += 1;
      dayStats.transactions.push(transaction);
    });

    const sortedStats = Array.from(statsMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setDailyStats(sortedStats);
  };

  const generatePDF = (stats: DailyStats[], isAutoExport = false) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // En-tête
    doc.setFontSize(16);
    doc.text('Rapport Quotidien des Transactions', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition);
    yPosition += 10;

    if (isAutoExport) {
      doc.text('Rapport automatique (24h)', 20, yPosition);
      yPosition += 15;
    } else {
      yPosition += 10;
    }

    // Résumé global
    const totalTransactions = stats.reduce((sum, day) => sum + day.transactionCount, 0);
    const totalAmount = stats.reduce((sum, day) => sum + day.totalAmount, 0);
    const totalFees = stats.reduce((sum, day) => sum + day.totalFees, 0);

    doc.text(`Total des transactions: ${totalTransactions}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Montant total: ${formatCurrency(totalAmount)}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Frais totaux: ${formatCurrency(totalFees)}`, 20, yPosition);
    yPosition += 15;

    // Détails par jour
    stats.forEach((day, index) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(`${new Date(day.date).toLocaleDateString('fr-FR')}`, 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text(`Transactions: ${day.transactionCount}`, 25, yPosition);
      yPosition += 5;
      doc.text(`Montant: ${formatCurrency(day.totalAmount)}`, 25, yPosition);
      yPosition += 5;
      doc.text(`Frais: ${formatCurrency(day.totalFees)}`, 25, yPosition);
      yPosition += 10;
    });

    const filename = isAutoExport 
      ? `rapport-auto-${new Date().toISOString().split('T')[0]}.pdf`
      : `rapport-transactions-${new Date().toISOString().split('T')[0]}.pdf`;

    doc.save(filename);
  };

  // Auto-export après 24h
  useEffect(() => {
    const checkAutoExport = () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (!lastAutoExport || lastAutoExport < oneDayAgo) {
        const yesterdayStats = dailyStats.filter(day => {
          const dayDate = new Date(day.date);
          return dayDate >= oneDayAgo && dayDate < now;
        });

        if (yesterdayStats.length > 0) {
          generatePDF(yesterdayStats, true);
          setLastAutoExport(now);
          localStorage.setItem('lastAutoExport', now.toISOString());
        }
      }
    };

    // Vérifier au chargement
    const savedLastExport = localStorage.getItem('lastAutoExport');
    if (savedLastExport) {
      setLastAutoExport(new Date(savedLastExport));
    }

    if (dailyStats.length > 0) {
      checkAutoExport();
    }

    // Vérifier toutes les heures
    const interval = setInterval(checkAutoExport, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dailyStats, lastAutoExport]);

  useEffect(() => {
    loadAllTransactions();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = searchTerm === '' || 
      t.sender_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.recipient_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.recipient_phone?.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const config = {
      completed: { label: 'Complété', variant: 'default' as const, color: 'bg-green-500' },
      pending: { label: 'En attente', variant: 'secondary' as const, color: 'bg-yellow-500' },
      failed: { label: 'Échoué', variant: 'destructive' as const, color: 'bg-red-500' }
    };

    const { label, variant, color } = config[status as keyof typeof config] || config.pending;
    
    return (
      <Badge variant={variant} className={`${color} text-white`}>
        {label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer': return '💸';
      case 'withdrawal': return '💰';
      case 'recharge': return '💳';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Chargement des transactions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Transactions</h2>
          <p className="text-muted-foreground">Toutes les transactions avec calculs automatiques</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => generatePDF(dailyStats)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Télécharger PDF
          </Button>
          <Button onClick={loadAllTransactions} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volume Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Frais Totaux</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(transactions.reduce((sum, t) => sum + t.fees, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                %
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jours analysés</p>
                <p className="text-2xl font-bold">{dailyStats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Rechercher par nom ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="completed">Complétées</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échouées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques par jour */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques Quotidiennes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyStats.slice(0, 7).map((day) => (
              <div key={day.date} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">{new Date(day.date).toLocaleDateString('fr-FR')}</p>
                  <p className="text-sm text-muted-foreground">{day.transactionCount} transactions</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(day.totalAmount)}</p>
                  <p className="text-sm text-muted-foreground">
                    Frais: {formatCurrency(day.totalFees)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>
            Toutes les Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getTypeIcon(transaction.type)}</div>
                  <div>
                    <p className="font-semibold">
                      {transaction.sender_full_name} → {transaction.recipient_full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.recipient_phone} • {new Date(transaction.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      Frais: {formatCurrency(transaction.fees)}
                    </p>
                  </div>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};