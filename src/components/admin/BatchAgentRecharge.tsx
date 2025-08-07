
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, CreditCard, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { formatCurrency } from "@/integrations/supabase/client";

interface Agent {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country: string;
}

const BatchAgentRecharge = () => {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents-for-batch-recharge'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country')
        .eq('role', 'agent')
        .order('full_name');

      if (error) throw error;
      return data as Agent[];
    },
  });

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAgents.length === agents?.length) {
      setSelectedAgents([]);
    } else {
      setSelectedAgents(agents?.map(agent => agent.id) || []);
    }
  };

  const handleBatchRecharge = async () => {
    if (!amount || selectedAgents.length === 0) {
      toast({
        title: "Données manquantes",
        description: "Veuillez sélectionner des agents et saisir un montant",
        variant: "destructive"
      });
      return;
    }

    const rechargeAmount = Number(amount);
    if (rechargeAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      let successCount = 0;
      let failCount = 0;
      const results = [];
      const successfulAgents: string[] = [];

      // Processus de recharge des agents
      for (const agentId of selectedAgents) {
        try {
          const { error } = await supabase.rpc('secure_increment_balance', {
            target_user_id: agentId,
            amount: rechargeAmount,
            operation_type: 'batch_agent_recharge'
          });

          if (error) throw error;
          successCount++;
          successfulAgents.push(agentId);
          results.push({ agentId, success: true });
        } catch (error) {
          console.error(`Erreur pour l'agent ${agentId}:`, error);
          failCount++;
          results.push({ agentId, success: false, error: error.message });
        }
      }

      // Log de l'opération batch
      await supabase
        .from('audit_logs')
        .insert({
          action: 'batch_agent_recharge',
          table_name: 'profiles',
          old_values: { selected_agents: selectedAgents.length },
          new_values: { 
            amount: rechargeAmount, 
            success_count: successCount,
            fail_count: failCount,
            reason: reason || 'Recharge groupée',
            results 
          }
        });

      // Génération automatique de notifications si des recharges ont réussi
      if (successCount > 0) {
        try {
          const currentUser = await supabase.auth.getUser();
          const adminId = currentUser.data.user?.id;

          // Créer la notification principale
          const { data: notification, error: notificationError } = await supabase
            .from('notifications')
            .insert({
              title: 'Recharge de compte effectuée',
              message: `Votre compte a été rechargé de ${rechargeAmount.toLocaleString()} FCFA par l'administrateur. ${reason ? `Motif: ${reason}` : ''}`,
              priority: 'normal',
              notification_type: 'individual',
              target_users: successfulAgents,
              sent_by: adminId,
              total_recipients: successCount
            })
            .select()
            .single();

          if (notificationError) {
            console.error('Erreur lors de la création de la notification:', notificationError);
          } else {
            // Créer les enregistrements pour les destinataires
            const individualNotifications = successfulAgents.map(agentId => ({
              notification_id: notification.id,
              user_id: agentId,
              status: 'sent'
            }));

            const { error: recipientError } = await supabase
              .from('notification_recipients')
              .insert(individualNotifications);

            if (recipientError) {
              console.error('Erreur lors de l\'envoi des notifications aux agents:', recipientError);
            }
          }
        } catch (notificationError) {
          console.error('Erreur lors du processus de notification:', notificationError);
        }
      }

      toast({
        title: "Recharge groupée terminée",
        description: `${successCount} agents rechargés avec succès${successCount > 0 ? ' et notifiés' : ''}, ${failCount} échecs`,
        variant: successCount > 0 ? "default" : "destructive"
      });

      // Reset form
      setSelectedAgents([]);
      setAmount("");
      setReason("");

    } catch (error) {
      console.error('Erreur lors de la recharge groupée:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la recharge groupée",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
        <CardContent className="p-8 text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des agents...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
          <CardTitle className="flex items-center gap-3 text-blue-700">
            <CreditCard className="w-6 h-6" />
            Recharge Groupée des Agents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Configuration de la recharge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-700 font-medium">
                Montant à recharger (FCFA)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Montant en FCFA"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-gray-700 font-medium">
                Raison (optionnel)
              </Label>
              <Input
                id="reason"
                placeholder="Raison de la recharge"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sélection des agents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700 font-medium text-lg">
                Sélectionner les agents ({selectedAgents.length} sélectionnés)
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="rounded-full"
              >
                {selectedAgents.length === agents?.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 bg-gray-50 rounded-xl p-4">
              {agents?.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedAgents.includes(agent.id)}
                      onCheckedChange={() => handleAgentToggle(agent.id)}
                      className="w-5 h-5"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{agent.full_name}</p>
                        <p className="text-sm text-gray-600">{agent.phone}</p>
                        <p className="text-xs text-gray-500">{agent.country}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(agent.balance, 'XAF')}
                    </p>
                    <p className="text-xs text-gray-500">Solde actuel</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé et confirmation */}
          {selectedAgents.length > 0 && amount && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Résumé de l'opération</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• {selectedAgents.length} agents sélectionnés</li>
                    <li>• Montant par agent: {formatCurrency(Number(amount), 'XAF')}</li>
                    <li>• Montant total: {formatCurrency(Number(amount) * selectedAgents.length, 'XAF')}</li>
                    {reason && <li>• Raison: {reason}</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAgents([]);
                setAmount("");
                setReason("");
              }}
              disabled={isProcessing}
              className="rounded-full px-6"
            >
              Réinitialiser
            </Button>
            <Button
              onClick={handleBatchRecharge}
              disabled={isProcessing || selectedAgents.length === 0 || !amount}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full px-8"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Recharger les agents
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchAgentRecharge;
