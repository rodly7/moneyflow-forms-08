import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { Users, TrendingUp, Gift, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralData {
  referrer_id: string;
  referrer_name: string;
  referrer_phone: string;
  referred_id: string;
  referred_name: string;
  referred_phone: string;
  referred_at: string;
  referral_bonus: number;
}

interface SubAdminReferralsTabProps {
  subAdminId: string;
}

const SubAdminReferralsTab = ({ subAdminId }: SubAdminReferralsTabProps) => {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferrals = async () => {
    setIsLoading(true);
    try {
      // Fetch referrals data based on the sub-admin ID
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', subAdminId);

      if (error) {
        console.error("Erreur lors de la récupération des parrainages:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de parrainage",
          variant: "destructive"
        });
        return;
      }

      setReferrals(data || []);
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
    fetchReferrals();
  }, [subAdminId]);

  const refreshData = async () => {
    await fetchReferrals();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Parrainages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Parrainages ({referrals.length})
        </CardTitle>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {referrals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {referrals.map((referral) => (
                <div
                  key={referral.referred_id}
                  className="p-4 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Gift className="w-5 h-5 text-green-500" />
                    <h4 className="font-medium">Parrainage</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Parrain:</strong> {referral.referrer_name} ({referral.referrer_phone})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Filleul:</strong> {referral.referred_name} ({referral.referred_phone})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Date:</strong> {new Date(referral.referred_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <p className="text-sm font-medium">
                      Bonus: {formatCurrency(referral.referral_bonus, 'XAF')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun parrainage trouvé pour cet administrateur</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubAdminReferralsTab;
