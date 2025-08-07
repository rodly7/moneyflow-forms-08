
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { AutomaticWithdrawalForm } from "@/components/withdrawal/AutomaticWithdrawalForm";
import { getUserBalance } from "@/services/withdrawalService";
import { useToast } from "@/hooks/use-toast";

const Withdraw = () => {
  const { user, isAgent } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Rediriger les agents vers la page de dépôt/retrait
  if (isAgent()) {
    navigate('/deposit');
    return null;
  }

  const fetchUserBalance = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingBalance(true);
      const balanceData = await getUserBalance(user.id);
      setUserBalance(balanceData.balance);
    } catch (error) {
      console.error("❌ Erreur lors du chargement du solde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre solde",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    fetchUserBalance();
  }, [user]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Retrait</h1>
          <div className="w-10"></div>
        </div>

        {isLoadingBalance ? (
          <Card>
            <CardContent className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </CardContent>
          </Card>
        ) : (
          <>
            <AutomaticWithdrawalForm userBalance={userBalance} />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  Information importante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    • Les retraits sont traités automatiquement
                  </p>
                  <p>
                    • Les fonds seront envoyés directement à votre numéro de téléphone
                  </p>
                  <p>
                    • Vous pouvez également vous rendre chez un agent MoneyFlow pour vos retraits
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Withdraw;
