import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, TrendingUp, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";

interface ReportData {
  totalTransfersAmount: number;
  totalWithdrawalsAmount: number;
  totalUsers: number;
}

const AdminReportsTab = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reportData, setReportData] = useState<ReportData>({
    totalTransfersAmount: 0,
    totalWithdrawalsAmount: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReportData = async () => {
      if (!date) return;

      setIsLoading(true);
      try {
        const formattedDate = format(date, "yyyy-MM-dd", { locale: fr });

        // Fetch total transfers amount
        const { data: transfersData, error: transfersError } = await supabase.rpc(
          'get_total_transfers_amount_for_date',
          { p_date: formattedDate }
        );

        if (transfersError) {
          console.error("Erreur lors de la récupération du montant total des transferts:", transfersError);
          toast({
            title: "Erreur",
            description: "Impossible de charger le montant total des transferts",
            variant: "destructive"
          });
        }

        const totalTransfersAmount = transfersData ? Number(transfersData) : 0;

        // Fetch total withdrawals amount
        const { data: withdrawalsData, error: withdrawalsError } = await supabase.rpc(
          'get_total_withdrawals_amount_for_date',
          { p_date: formattedDate }
        );

        if (withdrawalsError) {
          console.error("Erreur lors de la récupération du montant total des retraits:", withdrawalsError);
          toast({
            title: "Erreur",
            description: "Impossible de charger le montant total des retraits",
            variant: "destructive"
          });
        }

        const totalWithdrawalsAmount = withdrawalsData ? Number(withdrawalsData) : 0;

        // Fetch total number of users
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('count(*)', { count: 'exact' });

        if (usersError) {
          console.error("Erreur lors de la récupération du nombre total d'utilisateurs:", usersError);
          toast({
            title: "Erreur",
            description: "Impossible de charger le nombre total d'utilisateurs",
            variant: "destructive"
          });
        }

        const totalUsers = usersData ? usersData[0].count : 0;

        setReportData({
          totalTransfersAmount,
          totalWithdrawalsAmount,
          totalUsers,
        });

      } catch (error) {
        console.error("Erreur lors du chargement des données du rapport:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du rapport",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [date, toast]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Rapports & Statistiques</CardTitle>
        <div className="space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={
                  "h-8 w-[220px] justify-start text-left font-normal" +
                  (date ? " text-sm" : " text-muted-foreground")
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date > new Date() || date < new Date("2023-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost">
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border border-blue-200">
            <CardContent className="flex flex-row items-center justify-between space-y-0 p-4">
              <div>
                <TrendingUp className="h-6 w-6 text-blue-500 mb-2" />
                <p className="text-sm font-medium text-gray-600">
                  Montant Total Transferts
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <span className="loading loading-dots loading-sm"></span>
                  ) : (
                    formatCurrency(reportData.totalTransfersAmount)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border border-green-200">
            <CardContent className="flex flex-row items-center justify-between space-y-0 p-4">
              <div>
                <DollarSign className="h-6 w-6 text-green-500 mb-2" />
                <p className="text-sm font-medium text-gray-600">
                  Montant Total Retraits
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <span className="loading loading-dots loading-sm"></span>
                  ) : (
                    formatCurrency(reportData.totalWithdrawalsAmount)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border border-purple-200">
            <CardContent className="flex flex-row items-center justify-between space-y-0 p-4">
              <div>
                <Users className="h-6 w-6 text-purple-500 mb-2" />
                <p className="text-sm font-medium text-gray-600">
                  Nombre Total d'Utilisateurs
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <span className="loading loading-dots loading-sm"></span>
                  ) : (
                    reportData.totalUsers
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminReportsTab;
