import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";

interface ReferralData {
  totalReferrals: number;
  totalEarnings: number;
}

export const SubAdminReferralsTab = () => {
  const [referralData, setReferralData] = useState<ReferralData>({
    totalReferrals: 0,
    totalEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReferralData = async () => {
      setIsLoading(true);
      try {
        // Fetch total referrals count
        const { data: referrals, error: referralsError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .eq('referred_by', 'your_sub_admin_id'); // Replace 'your_sub_admin_id' with the actual sub-admin ID

        if (referralsError) {
          console.error("Error fetching referrals:", referralsError);
          return;
        }

        const totalReferrals = referrals ? referrals.length : 0;

        // Fetch total earnings from referrals (example: sum of successful transfer amounts)
        // Adjust the query based on your actual database schema and relationships
        const { data: earningsData, error: earningsError } = await supabase
          .from('transactions') // Replace 'transactions' with your actual table name
          .select('amount')
          .eq('referrer_id', 'your_sub_admin_id'); // Replace 'your_sub_admin_id' with the actual sub-admin ID

        if (earningsError) {
          console.error("Error fetching earnings:", earningsError);
          return;
        }

        const totalEarnings = earningsData
          ? earningsData.reduce((sum, transaction) => sum + transaction.amount, 0)
          : 0;

        setReferralData({
          totalReferrals: totalReferrals,
          totalEarnings: totalEarnings,
        });
      } catch (error) {
        console.error("Error fetching referral data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralData();
  }, []);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Mes Parrainages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Chargement des données...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="p-3 rounded-md bg-blue-200">
                <Users className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total de filleuls
                </p>
                <p className="text-2xl font-bold text-blue-800">
                  {referralData.totalReferrals}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="p-3 rounded-md bg-green-200">
                <DollarSign className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Gains totaux
                </p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(referralData.totalEarnings, "XAF")}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
