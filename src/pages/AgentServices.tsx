import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, ArrowRight, RefreshCw, LogOut, Shield, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { supabase } from "@/integrations/supabase/client";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

const AgentServices = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMobile } = useDeviceDetection();
  const [agentBalance, setAgentBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const fetchAgentBalance = async () => {
    if (user?.id) {
      setIsLoadingBalance(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setAgentBalance(data.balance || 0);
      } catch (error) {
        console.error("Erreur lors du chargement du solde agent:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre solde",
          variant: "destructive"
        });
      }
      setIsLoadingBalance(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/agent-auth');
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAgentBalance();
  }, [user?.id]);

  if (!profile || profile.role !== 'agent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h2>
            <p className="text-gray-600 mb-6">Cette page est réservée aux agents autorisés.</p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4 px-0 sm:py-8 sm:px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 w-full space-y-6 px-4">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6 backdrop-blur-sm bg-white/70 rounded-2xl p-4 shadow-lg border border-white/20 w-full">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/agent-dashboard')} 
            className="text-gray-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Services Agent
          </h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchAgentBalance}
              disabled={isLoadingBalance}
              className="hover:bg-green-50 border border-green-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              {!isMobile && <span className="ml-1">Déconnexion</span>}
            </Button>
          </div>
        </div>

        {/* Enhanced Balance Card */}
        <Card className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0 shadow-2xl backdrop-blur-sm w-full">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-200" />
                <h3 className="text-blue-100 text-lg">Solde Agent</h3>
              </div>
              <div className="text-4xl font-bold mb-4 text-white drop-shadow-lg">
                {agentBalance.toLocaleString('fr-FR')} XAF
              </div>
              <p className="text-blue-100 text-sm flex items-center justify-center gap-2">
                📍 Pays: {profile.country}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Tabs */}
        <div className="backdrop-blur-sm bg-white/70 rounded-2xl shadow-xl border border-white/30 overflow-hidden w-full">
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-1 bg-gray-100/50 m-2 rounded-xl">
              <TabsTrigger value="deposit" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Plus className="w-4 h-4" />
                Dépôt/Retrait
              </TabsTrigger>
            </TabsList>


            <TabsContent value="deposit" className="p-4 w-full">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 w-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-blue-600">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    Services de Dépôt et Retrait
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-gray-600 text-lg">
                      Gérez les dépôts et retraits de vos clients en toute sécurité
                    </p>
                    <Button 
                      onClick={() => navigate('/deposit-withdrawal')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 h-12 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      Accéder aux services de dépôt/retrait
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AgentServices;
