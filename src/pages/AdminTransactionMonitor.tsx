import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TransactionMonitor from "@/components/admin/TransactionMonitor";

const AdminTransactionMonitor = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  if (profile?.role !== 'admin') {
    navigate('/main-admin');
    return null;
  }

  const handleResetTransactionCounts = async () => {
    setIsResetting(true);
    try {
      // Réinitialiser les compteurs de transactions dans la table agents
      const { error } = await supabase
        .from('agents')
        .update({ transactions_count: 0 });

      if (error) throw error;

      toast({
        title: "✅ Compteurs réinitialisés",
        description: "Tous les compteurs de transactions ont été remis à zéro"
      });
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser les compteurs",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/main-admin')}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-600 to-indigo-600 bg-clip-text text-transparent">
                Monitoring des Transactions
              </h1>
              <p className="text-slate-600 mt-1">Suivi en temps réel de toutes les opérations</p>
            </div>
          </div>
          
          <Button
            onClick={handleResetTransactionCounts}
            disabled={isResetting}
            variant="outline"
            className="bg-white/80 hover:bg-red-50 border-red-200 text-red-700 hover:text-red-800"
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Réinitialisation...' : 'Réinitialiser compteurs'}
          </Button>
        </div>

        {/* Transaction Monitor Component */}
        <TransactionMonitor />
      </div>
    </div>
  );
};

export default AdminTransactionMonitor;