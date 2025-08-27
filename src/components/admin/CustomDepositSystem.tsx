import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface DepositFormState {
  agentId: string;
  amount: number;
  description: string;
}

const CustomDepositSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [depositForm, setDepositForm] = useState<DepositFormState>({
    agentId: "",
    amount: 0,
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setDepositForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer cette action.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setDepositSuccess(false);

    try {
      // Vérifier si l'agent existe
      const { data: agentData, error: agentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', depositForm.agentId)
        .single();

      if (agentError || !agentData) {
        throw new Error("Agent introuvable. Veuillez vérifier l'ID de l'agent.");
      }

      // Effectuer le dépôt via une fonction Supabase (RPC)
      const { error: depositError } = await supabase.rpc('admin_deposit_funds', {
        agent_id: depositForm.agentId,
        deposit_amount: depositForm.amount,
        admin_id: user.id,
        deposit_description: depositForm.description
      });

      if (depositError) {
        throw new Error(depositError.message || "Impossible d'effectuer le dépôt.");
      }

      toast({
        title: "Dépôt effectué",
        description: `Dépôt de ${formatCurrency(depositForm.amount, 'XAF')} effectué avec succès pour l'agent ${depositForm.agentId}.`,
      });

      setDepositSuccess(true);
      setDepositForm({
        agentId: "",
        amount: 0,
        description: "",
      });
    } catch (error: any) {
      console.error("Erreur lors du dépôt:", error);
      toast({
        title: "Erreur lors du dépôt",
        description: error.message || "Une erreur est survenue lors du dépôt.",
        variant: "destructive",
      });
      setDepositSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">Système de Dépôt Personnalisé</CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="agentId">ID de l'Agent</Label>
            <Input
              type="text"
              id="agentId"
              placeholder="Entrez l'ID de l'agent"
              value={depositForm.agentId}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Montant à Déposer</Label>
            <Input
              type="number"
              id="amount"
              placeholder="Entrez le montant"
              value={String(depositForm.amount)}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description du Dépôt</Label>
            <Textarea
              id="description"
              placeholder="Entrez une description"
              value={depositForm.description}
              onChange={handleInputChange}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Traitement...</span>
              </div>
            ) : (
              "Effectuer le Dépôt"
            )}
          </Button>
        </form>

        {depositSuccess && (
          <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-700">
                Dépôt effectué avec succès !
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <Wallet className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-700">Informations Importantes</h4>
          </div>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Assurez-vous que l'ID de l'agent est correct avant de procéder.</li>
            <li>Le montant sera crédité sur le compte de l'agent immédiatement.</li>
            <li>Une description claire aide à suivre les dépôts effectués.</li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-700">
              Note: Cette action est irréversible. Vérifiez attentivement les informations avant de confirmer.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomDepositSystem;
