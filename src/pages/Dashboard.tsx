
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDown,
  ArrowUp,
  Banknote,
  CreditCard,
  TrendingUp,
  User,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useUserSession } from "@/hooks/useUserSession";
import KYCStatusBanner from "@/components/dashboard/KYCStatusBanner";

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshSession } = useUserSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      refreshSession();
    } else {
      setIsLoading(false);
    }
  }, [profile, refreshSession]);

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <KYCStatusBanner />
        
        <div className="mb-6">
          <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivez vos finances en temps réel
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Solde actuel
              </CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-6 w-32" />
                ) : (
                  formatCurrency(profile?.balance || 0, profile?.country)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile?.full_name}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Revenus ce mois-ci
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-6 w-32" />
                ) : (
                  formatCurrency(0, profile?.country)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Profil
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {profile?.full_name || 'Utilisateur'}
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {profile?.role || 'user'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/transfer')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Transfert
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => toast({ title: "Fonction à venir", description: "Cette fonctionnalité sera bientôt disponible" })}
              >
                <ArrowDown className="mr-2 h-4 w-4" />
                Retrait
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => toast({ title: "Fonction à venir", description: "Cette fonctionnalité sera bientôt disponible" })}
              >
                <ArrowUp className="mr-2 h-4 w-4" />
                Dépôt
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Transactions récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune transaction récente</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/transactions')}
                >
                  Voir toutes les transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
