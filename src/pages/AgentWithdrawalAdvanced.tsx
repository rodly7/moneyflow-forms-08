
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { getCountryCodeForAgent } from "@/services/withdrawalService";
import { AgentBalanceDisplay } from "@/components/agent/AgentBalanceDisplay";
import { AgentAutomaticWithdrawalForm } from "@/components/agent/AgentAutomaticWithdrawalForm";

const AgentWithdrawalAdvanced = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [countryCode, setCountryCode] = useState("+242");
  const [agentCountry, setAgentCountry] = useState("Congo Brazzaville");

  const {
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    fetchAgentBalances
  } = useAgentWithdrawalEnhanced();

  // Récupérer le pays de l'agent pour définir l'indicatif
  useEffect(() => {
    const fetchAgentCountry = async () => {
      if (!user?.id) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Erreur lors de la récupération du profil agent:", error);
          return;
        }

        if (profile?.country) {
          setAgentCountry(profile.country);
          const code = getCountryCodeForAgent(profile.country);
          setCountryCode(code);
          console.log("✅ Pays de l'agent:", profile.country, "Indicatif:", code);
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    };

    fetchAgentCountry();
  }, [user?.id]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-2xl mx-auto space-y-6 px-4">
        {/* En-tête moderne */}
        <div className="flex items-center justify-between mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')} 
            className="text-gray-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Retrait Agent
          </h1>
          <div className="w-20"></div>
        </div>

        {/* Affichage des soldes */}
        <AgentBalanceDisplay
          agentBalance={agentBalance}
          agentCommissionBalance={agentCommissionBalance}
          isLoadingBalance={isLoadingBalance}
          onRefresh={fetchAgentBalances}
          userCountry={agentCountry}
        />

        <AgentAutomaticWithdrawalForm />
      </div>
    </div>
  );
};

export default AgentWithdrawalAdvanced;
