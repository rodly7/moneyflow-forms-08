
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, UserPlus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";

interface AgentDeposit {
  agentId: string;
  agentName: string;
  amount: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

const BatchAgentDeposit = () => {
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<AgentDeposit[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkAmount, setBulkAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newDeposits: AgentDeposit[] = [];

      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header
        const [agentId, agentName, amount] = line.split(',');
        if (agentId && agentName && amount) {
          newDeposits.push({
            agentId: agentId.trim(),
            agentName: agentName.trim(),
            amount: parseFloat(amount.trim()),
            status: 'pending'
          });
        }
      });

      setDeposits(newDeposits);
      toast({
        title: "Fichier chargé",
        description: `${newDeposits.length} dépôts détectés`,
      });
    };
    reader.readAsText(file);
  };

  const processBatchDeposits = async () => {
    setIsProcessing(true);
    const updatedDeposits = [...deposits];

    for (let i = 0; i < updatedDeposits.length; i++) {
      const deposit = updatedDeposits[i];
      try {
        const { data, error } = await supabase
          .from('admin_deposits')
          .insert({
            admin_id: (await supabase.auth.getUser()).data.user?.id || '',
            target_user_id: deposit.agentId,
            amount: deposit.amount,
            currency: 'XAF',
            target_currency: 'XAF',
            notes: notes || `Dépôt groupé pour ${deposit.agentName}`
          });

        if (error) throw error;

        updatedDeposits[i].status = 'success';
      } catch (error) {
        console.error('Erreur dépôt:', error);
        updatedDeposits[i].status = 'error';
        updatedDeposits[i].error = error instanceof Error ? error.message : 'Erreur inconnue';
      }

      setDeposits([...updatedDeposits]);
    }

    setIsProcessing(false);
    toast({
      title: "Traitement terminé",
      description: "Vérifiez le statut de chaque dépôt",
    });
  };

  const addBulkDepositToAllAgents = async () => {
    if (!bulkAmount || deposits.length === 0) return;

    const amount = parseFloat(bulkAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez saisir un montant valide",
        variant: "destructive"
      });
      return;
    }

    const updatedDeposits = deposits.map(deposit => ({
      ...deposit,
      amount: amount,
      status: 'pending' as const
    }));

    setDeposits(updatedDeposits);
    toast({
      title: "Montants mis à jour",
      description: `Montant de ${formatCurrency(amount)} appliqué à tous les agents`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Dépôt Groupé d'Agents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-upload">Importer fichier CSV</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="flex-1"
              />
              <Button variant="outline" size="icon">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Format: agent_id,agent_name,amount
            </p>
          </div>

          {/* Bulk amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bulk-amount">Montant pour tous (FCFA)</Label>
              <Input
                id="bulk-amount"
                type="number"
                value={bulkAmount}
                onChange={(e) => setBulkAmount(e.target.value)}
                placeholder="50000"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={addBulkDepositToAllAgents}
                disabled={!bulkAmount || deposits.length === 0}
              >
                Appliquer à tous
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dépôt mensuel agents..."
              rows={3}
            />
          </div>
        </div>

        {/* Deposits list */}
        {deposits.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Dépôts à traiter ({deposits.length})
              </h3>
              <Button 
                onClick={processBatchDeposits}
                disabled={isProcessing || deposits.every(d => d.status !== 'pending')}
              >
                <Send className="w-4 h-4 mr-2" />
                {isProcessing ? "Traitement..." : "Traiter tous"}
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {deposits.map((deposit, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{deposit.agentName}</p>
                    <p className="text-sm text-muted-foreground">ID: {deposit.agentId}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-bold">{formatCurrency(deposit.amount)}</p>
                  </div>
                  <Badge 
                    variant={
                      deposit.status === 'success' ? 'default' :
                      deposit.status === 'error' ? 'destructive' : 'secondary'
                    }
                  >
                    {deposit.status === 'success' ? 'Réussi' :
                     deposit.status === 'error' ? 'Erreur' : 'En attente'}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {deposits.filter(d => d.status === 'pending').length}
                  </p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {deposits.filter(d => d.status === 'success').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Réussis</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {deposits.filter(d => d.status === 'error').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Erreurs</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchAgentDeposit;
