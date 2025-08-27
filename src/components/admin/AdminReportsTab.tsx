
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker";
import { Download, TrendingUp, Users, DollarSign, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useState } from "react";

interface ReportData {
  total_transfers: number;
  total_volume: number;
  new_users: number;
  active_users: number;
  date: string;
}

const AdminReportsTab = () => {
  const [dateRange, setDateRange] = useState<Date[]>([new Date(), new Date()]);
  const [reportType, setReportType] = useState("daily");

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ["admin-reports", dateRange, reportType],
    queryFn: async () => {
      if (!dateRange || dateRange.length !== 2) return [];

      const startDate = dateRange[0]?.toISOString().split('T')[0];
      const endDate = dateRange[1]?.toISOString().split('T')[0];

      // Use a simpler query to get transaction data
      const { data, error } = await supabase
        .from('money_transfers')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) {
        console.error("Erreur lors de la récupération des rapports:", error);
        throw new Error("Impossible de charger les rapports");
      }

      // Process the data to match ReportData format
      const mockData: ReportData[] = [{
        total_transfers: data?.length || 0,
        total_volume: data?.reduce((sum, transfer) => sum + (transfer.amount || 0), 0) || 0,
        new_users: 0,
        active_users: 0,
        date: new Date().toISOString().split('T')[0]
      }];

      return mockData;
    },
  });

  const downloadCSV = () => {
    if (!reports) return;

    const csvRows = [];
    const headers = ['Date', 'Total Transferts', 'Volume Total', 'Nouveaux Utilisateurs', 'Utilisateurs Actifs'];
    csvRows.push(headers.join(','));

    for (const row of reports) {
      const values = [
        row.date,
        row.total_transfers,
        row.total_volume,
        row.new_users,
        row.active_users
      ];
      csvRows.push(values.join(','));
    }

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', 'true');
    a.setAttribute('href', url);
    a.setAttribute('download', 'admin_reports.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Rapports et Statistiques
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={downloadCSV}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Type de Rapport</h4>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Période</h4>
              <CalendarDateRangePicker onDateChange={setDateRange} />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Chargement des rapports...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse h-48 bg-gray-200 rounded-md"></div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Impossible de charger les rapports.</p>
          </CardContent>
        </Card>
      ) : (
        reports && reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Volume Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reports.reduce((acc, report) => acc + report.total_volume, 0))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Sur la période sélectionnée
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Nouveaux Utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.reduce((acc, report) => acc + report.new_users, 0)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Sur la période sélectionnée
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Transferts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.reduce((acc, report) => acc + report.total_transfers, 0)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Sur la période sélectionnée
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Aucun résultat</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Aucun rapport disponible pour la période sélectionnée.</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default AdminReportsTab;
