import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  RefreshCw, 
  Eye, 
  Calendar,
  Filter,
  Download
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Transaction {
  id: string;
  created_at: string;
  type: string;
  amount: number;
  fees: number;
  currency: string;
  status: string;
  sender_id: string;
  recipient_identifier: string;
  description: string;
  reference_id: string;
  verification_code: string;
  sender_name: string;
  recipient_full_name: string;
  withdrawal_phone: string;
  impact: string;
}

const ExactTransactionMonitor = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (searchQuery) {
        query = query.ilike('description', `%${searchQuery}%`);
      }

      if (selectedDate) {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        query = query.gte('created_at', `${formattedDate} 00:00:00`)
                     .lte('created_at', `${formattedDate} 23:59:59`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setTransactions(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, pageSize, searchQuery, selectedDate]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset page when searching
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1); // Reset page when page size changes
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDate(undefined);
    setPage(1);
  };

  return (
    <Card className="min-h-screen">
      <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">
          Surveillance des Transactions
        </CardTitle>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-3">
          <div className="relative">
            <Input
              type="search"
              placeholder="Rechercher une transaction..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  fetchTransactions();
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                <span>{selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "Filtrer par date"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                locale={fr}
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-4">Aucune transaction trouvée.</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Frais</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.id.substring(0, 8)}</TableCell>
                    <TableCell>{formatDate(new Date(transaction.created_at))}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount, transaction.currency)}</TableCell>
                    <TableCell>{formatCurrency(transaction.fees, transaction.currency)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{transaction.status}</Badge>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <span>Taille de la page:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border rounded px-2 py-1"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
        <div className="space-x-2">
          <Button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            variant="outline"
            size="sm"
          >
            Précédent
          </Button>
          <Button
            onClick={() => handlePageChange(page + 1)}
            disabled={page * pageSize >= totalCount}
            variant="outline"
            size="sm"
          >
            Suivant
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ExactTransactionMonitor;
