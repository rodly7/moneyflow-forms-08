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
  Calendar,
  CreditCard,
  FileText,
  TrendingDown,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { CardWrapper } from "@/components/ui/card-wrapper";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUserSession } from "@/hooks/useUserSession";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MainNav } from "@/components/main-nav";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { Sidebar } from "@/components/sidebar";
import { PWAInstallMessage } from "@/components/pwa/PWAInstallMessage";
import { dashboardConfig } from "@/config/dashboard";
import { capitalize } from "@/lib/utils";
import { useRecipientVerification } from "@/hooks/useRecipientVerification";
import { useSecurityValidation } from "@/hooks/useSecurityValidation";
import { TransferForm } from "@/components/dashboard/TransferForm";
import { WithdrawForm } from "@/components/dashboard/WithdrawForm";
import { DepositForm } from "@/components/dashboard/DepositForm";
import { useSearchParams } from "react-router-dom";
import { useSidebar } from "@/hooks/use-sidebar";
import KYCStatusBanner from "@/components/dashboard/KYCStatusBanner";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const showTransfer = searchParams.get('showTransfer') === 'true';
  const showWithdraw = searchParams.get('showWithdraw') === 'true';
  const showDeposit = searchParams.get('showDeposit') === 'true';
  const { isOpen, onOpen, onClose } = useSidebar();
  const { isSmScreen } = useMediaQuery();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPWAInstall, setShowPWAInstall] = useState(true);
  const { data, isLoading, isError } = useDashboardData();
  const { refreshSession } = useUserSession();
  const { verifyRecipient } = useRecipientVerification();
  const { validateFinancialOperation } = useSecurityValidation();
  const [showTransferForm, setShowTransferForm] = useState(showTransfer);
  const [showWithdrawForm, setShowWithdrawForm] = useState(showWithdraw);
  const [showDepositForm, setShowDepositForm] = useState(showDeposit);

  useEffect(() => {
    if (showTransfer) setShowTransferForm(true);
    if (showWithdraw) setShowWithdrawForm(true);
    if (showDeposit) setShowDepositForm(true);
  }, [showTransfer, showWithdraw, showDeposit]);

  useEffect(() => {
    if (!profile) {
      refreshSession();
    }
  }, [profile, refreshSession]);

  useEffect(() => {
    if (isError) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  if (showPWAInstall) {
    return <PWAInstallMessage onContinue={() => setShowPWAInstall(false)} />;
  }

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
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
          <div className="col-span-4">
            <MainNav items={dashboardConfig.mainNav} />
            <div className="border-b pb-4">
              <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
                Tableau de bord
              </h1>
              <p className="text-sm text-muted-foreground">
                Suivez vos finances en temps réel
              </p>
            </div>
          </div>
          <div className="hidden lg:block">
            <Sidebar
              items={dashboardConfig.sidebarNav}
              isAgent={profile?.role === 'agent'}
              isAdmin={profile?.role === 'admin'}
              isSubAdmin={profile?.role === 'sub_admin'}
            />
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-5 mt-6">
          <div className="col-span-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <CardWrapper>
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
                      ) : isError ? (
                        "Erreur"
                      ) : (
                        formatCurrency(data?.totalRevenue || 0, profile?.country)
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
                      ) : isError ? (
                        "Erreur"
                      ) : (
                        formatCurrency(data?.revenueThisMonth || 0, profile?.country)
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
              </CardWrapper>
            </div>
            <div className="grid gap-6 grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle>Aperçu</CardTitle>
                </CardHeader>
                <CardContent>
                  <OverviewChart data={data?.overviewData || []} isLoading={isLoading} />
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-6 grid-cols-1">
              <RecentSales data={data?.recentSales || []} isLoading={isLoading} />
            </div>
          </div>
          <div className="hidden lg:block">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowTransferForm(!showTransferForm)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Transfert
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Retrait
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowDepositForm(!showDepositForm)}
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Dépot
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {showTransferForm && (
          <TransferForm
            onClose={() => setShowTransferForm(false)}
            verifyRecipient={verifyRecipient}
            validateFinancialOperation={validateFinancialOperation}
          />
        )}
        {showWithdrawForm && (
          <WithdrawForm
            onClose={() => setShowWithdrawForm(false)}
            validateFinancialOperation={validateFinancialOperation}
          />
        )}
        {showDepositForm && (
          <DepositForm
            onClose={() => setShowDepositForm(false)}
            validateFinancialOperation={validateFinancialOperation}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
