
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils/currency";

interface AgentDeposit {
  id: string;
  agentId: string;
  agentName: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
}

const BatchAgentDeposit = () => {
  const [deposits, setDeposits] = useState<AgentDeposit[]>([]);
  const [newDeposit, setNewDeposit] = useState({
    agentId: '',
    agentName: '',
    amount: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const addDeposit = () => {
    if (!newDeposit.agentId || !newDeposit.agentName || newDeposit.amount <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs avec des valeurs valides",
        variant: "destructive"
      });
      return;
    }

    const deposit: AgentDeposit = {
      id: Math.random().toString(36).substr(2, 9),
      ...newDeposit,
      status: 'pending'
    };

    setDeposits([...deposits, deposit]);
    setNewDeposit({ agentId: '', agentName: '', amount: 0 });
  };

  const removeDeposit = (id: string) => {
    setDeposits(deposits.filter(d => d.id !== id));
  };

  const processBatchDeposits = async () => {
    if (deposits.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun dépôt à traiter",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: adminProfile } = await supabase.auth.getUser();
      if (!adminProfile.user?.id) throw new Error("Admin non authentifié");

      for (const deposit of deposits) {
        const { error } = await supabase
          .from('admin_deposits')
          .insert({
            admin_id: adminProfile.user.id,
            target_user_id: deposit.agentId,
            amount: deposit.amount,
            converted_amount: deposit.amount,
            currency: 'XAF',
            target_currency: 'XAF',
            notes: notes || `Dépôt groupé pour agent ${deposit.agentName}`,
            exchange_rate: 1.0,
            deposit_type: 'batch'
          });

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: `${deposits.length} dépôts traités avec succès`,
        variant: "default"
      });

      setDeposits([]);
      setNotes('');
    } catch (error) {
      console.error('Erreur lors du traitement des dépôts:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement des dépôts",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      'Agent ID,Nom Agent,Montant,Statut',
      ...deposits.map(d => `${d.agentId},${d.agentName},${d.amount},${d.status}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_agent_deposits.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalAmount = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Dépôts Groupés d'Agents
            {deposits.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exporter CSV
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="agentId">ID Agent</Label>
              <Input
                id="agentId"
                value={newDeposit.agentId}
                onChange={(e) => setNewDeposit({...newDeposit, agentId: e.target.value})}
                placeholder="ID de l'agent"
              />
            </div>
            <div>
              <Label htmlFor="agentName">Nom Agent</Label>
              <Input
                id="agentName"
                value={newDeposit.agentName}
                onChange={(e) => setNewDeposit({...newDeposit, agentName: e.target.value})}
                placeholder="Nom de l'agent"
              />
            </div>
            <div>
              <Label htmlFor="amount">Montant</Label>
              <Input
                id="amount"
                type="number"
                value={newDeposit.amount}
                onChange={(e) => setNewDeposit({...newDeposit, amount: parseFloat(e.target.value) || 0})}
                placeholder="Montant"
              />
            </div>
          </div>

          <Button onClick={addDeposit} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter au lot
          </Button>

          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes pour tous les dépôts du lot"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {deposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Liste des Dépôts ({deposits.length})
              <Badge variant="secondary">
                Total: {formatCurrency(totalAmount)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deposits.map((deposit) => (
                <div key={deposit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{deposit.agentName}</span>
                    <span className="text-sm text-muted-foreground ml-2">({deposit.agentId})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatCurrency(deposit.amount)}</span>
                    <Badge variant="outline">{deposit.status}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDeposit(deposit.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={processBatchDeposits}
              disabled={isProcessing}
              className="w-full mt-4"
              size="lg"
            >
              {isProcessing ? 'Traitement en cours...' : `Traiter ${deposits.length} dépôt(s)`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchAgentDeposit;
