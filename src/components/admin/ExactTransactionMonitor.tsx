import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Search, Filter, Download, RefreshCw, Eye, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/currency";

interface Transaction {
  id: string;
  created_at: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  status: string;
  details: any;
}

const ExactTransactionMonitor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, [page, pageSize, selectedDate, filterType, searchTerm]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (searchTerm) {
        query = query.ilike("user_id", `%${searchTerm}%`);
      }

      if (filterType !== "all") {
        query = query.eq("transaction_type", filterType);
      }

      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        query = query.gte("created_at", startOfDay.toISOString());
        query = query.lte("created_at", endOfDay.toISOString());
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching transactions:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les transactions",
          variant: "destructive",
        });
      } else {
        setTransactions(data || []);
        setTotalCount(count || 0);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value);
    setPage(1);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Surveillance des Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Rechercher par ID utilisateur..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <Button variant="outline" size="sm" onClick={() => fetchTransactions()}>
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <Select onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrer par type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="deposit">Dépôts</SelectItem>
                    <SelectItem value="withdrawal">Retraits</SelectItem>
                    <SelectItem value="transfer">Transferts</SelectItem>
                    {/* Add more types as needed */}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    onChange={handleDateChange}
                    className="max-w-[150px]"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                          Chargement...
                        </div>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        Aucune transaction trouvée.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.user_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatCurrency(transaction.amount, "XAF")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.transaction_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge>{transaction.status}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Eye className="w-4 h-4 mr-2" />
                          {/* Implement details view here */}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
              <div className="sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Affichage de{" "}
                    <span className="font-medium">
                      {(page - 1) * pageSize + 1}
                    </span>{" "}
                    à{" "}
                    <span className="font-medium">
                      {Math.min(page * pageSize, totalCount)}
                    </span>{" "}
                    sur{" "}
                    <span className="font-medium">{totalCount}</span> transactions
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <Button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Précédent
                    </Button>
                    <Button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page * pageSize >= totalCount}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Suivant
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="details">
            <div>Detailed transaction info here</div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ExactTransactionMonitor;
