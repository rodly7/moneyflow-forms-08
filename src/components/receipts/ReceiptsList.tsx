import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";
import { Receipt, Download, Search, Calendar, Filter } from "lucide-react";

interface ReceiptData {
  id: string;
  created_at: string;
  amount: number;
  fees: number;
  sender_id: string;
  receiver_phone: string;
  status: string;
}

interface ReceiptsListProps {
  userId: string | undefined;
}

const ReceiptsList = ({ userId }: ReceiptsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: receipts, isLoading, error } = useQuery(
    ["receipts", userId, searchTerm, startDate, endDate, filterStatus],
    async () => {
      if (!userId) return [];

      let query = supabase
        .from("transfers")
        .select("*")
        .eq("sender_id", userId)
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.ilike("receiver_phone", `%${searchTerm}%`);
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching receipts:", error);
        throw error;
      }

      return data as ReceiptData[];
    }
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadReceipt = (receipt: ReceiptData) => {
    // Implement your receipt download logic here
    console.log("Downloading receipt:", receipt.id);
  };

  const filteredReceipts = receipts || [];

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Receipt className="mr-2 h-5 w-5 text-gray-500" />
          Historique des Reçus
        </CardTitle>
        <Badge variant="secondary">{filteredReceipts.length} Reçus</Badge>
      </CardHeader>

      <CardContent className="p-4">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            type="search"
            placeholder="Rechercher par numéro"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="col-span-1 md:col-span-1"
          />

          <div className="col-span-1 md:col-span-1 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
              className="border rounded px-2 py-1 w-full text-sm"
            />
            <span className="mx-1">à</span>
            <input
              type="date"
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="col-span-1 md:col-span-1 border rounded px-2 py-1 text-sm"
          >
            <option value="all">Tous les Status</option>
            <option value="pending">En attente</option>
            <option value="completed">Complété</option>
            <option value="failed">Échoué</option>
          </select>
        </div>

        {/* Receipts List */}
        {isLoading ? (
          <div className="text-center py-4">Chargement des reçus...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            Erreur lors du chargement des reçus.
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="text-center py-4">Aucun reçu trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frais
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReceipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(receipt.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {receipt.receiver_phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(receipt.amount, "XAF")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(receipt.fees, "XAF")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Badge
                        variant={
                          receipt.status === "completed"
                            ? "success"
                            : receipt.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {receipt.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadReceipt(receipt)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReceiptsList;
