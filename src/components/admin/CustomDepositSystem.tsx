
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils/currency";
import { DollarSign, Users, FileText } from "lucide-react";

const CustomDepositSystem = () => {
  const [targetType, setTargetType] = useState<"user" | "agent">("agent");
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCustomDeposit = async () => {
    if (!user || !targetId.trim() || !amount) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const depositAmount = parseFloat(amount);

      if (isNaN(depositAmount) || depositAmount <= 0) {
        throw new Error("Montant invalide");
      }

      // Insert into admin_deposits table
      const { error } = await supabase
        .from('admin_deposits')
        .insert({
          admin_id: user.id,
          agent_id: targetType === 'agent' ? targetId : null,
          user_id: targetType === 'user' ? targetId : null,
          amount: depositAmount,
          reason: reason || 'Dépôt personnalisé',
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Succès",
        description: `Dépôt de ${formatCurrency(depositAmount)} effectué avec succès`,
      });

      // Reset form
      setTargetId("");
      setAmount("");
      setReason("");
    } catch (error: any) {
      console.error('Erreur lors du dépôt personnalisé:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le dépôt personnalisé",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Dépôt Personnalisé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Type de Destinataire</Label>
          <Select value={targetType} onValueChange={(value: "user" | "agent") => setTargetType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="user">Utilisateur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetId">ID du {targetType === 'agent' ? 'Agent' : 'Utilisateur'}</Label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="targetId"
              placeholder={`ID du ${targetType}`}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Montant (FCFA)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="amount"
              type="number"
              placeholder="100000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10"
              min="1"
            />
          </div>
          {amount && (
            <p className="text-sm text-gray-600">
              Montant formaté: {formatCurrency(parseFloat(amount) || 0)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Raison du dépôt</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Textarea
              id="reason"
              placeholder="Décrivez la raison de ce dépôt personnalisé..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="pl-10 min-h-[80px]"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleCustomDeposit}
            disabled={isLoading || !targetId.trim() || !amount}
            className="w-full"
          >
            {isLoading ? "Traitement en cours..." : "Effectuer le Dépôt"}
          </Button>
        </div>

        {targetId.trim() && amount && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>Aperçu:</strong> Dépôt de {formatCurrency(parseFloat(amount) || 0)} vers {targetType} ID: {targetId}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomDepositSystem;
