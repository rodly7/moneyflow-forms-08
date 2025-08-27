import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { Wallet, TrendingUp, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubAdminRechargeTabProps {
  userId: string | undefined;
}

const SubAdminRechargeTab: React.FC<SubAdminRechargeTabProps> = ({ userId }) => {
  const { toast } = useToast();
  const [totalRecharges, setTotalRecharges] = useState(0);
  const [totalRechargeVolume, setTotalRechargeVolume] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRechargeData = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data: recharges, error: rechargesError } = await supabase
        .from('recharges')
        .select('amount')
        .eq('user_id', userId);

      if (rechargesError) {
        console.error("Erreur lors de la récupération des recharges:", rechargesError);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de recharge",
          variant: "destructive"
        });
        return;
      }

      const totalRechargesCount = recharges?.length || 0;
      const totalRechargeVolumeSum = recharges?.reduce((sum, recharge) => sum + recharge.amount, 0) || 0;

      setTotalRecharges(totalRechargesCount);
      setTotalRechargeVolume(totalRechargeVolumeSum);

    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRechargeData();
  }, [userId, toast]);

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">Recharges</CardTitle>
        <Wallet className="h-6 w-6 text-gray-500" />
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-600">Volume Total</span>
              </div>
              <span className="text-lg font-bold text-gray-800">{formatCurrency(totalRechargeVolume, 'XAF')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Nombre de Recharges</span>
              </div>
              <span className="text-lg font-bold text-gray-800">{totalRecharges}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubAdminRechargeTab;
