
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Plus, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/integrations/supabase/client";

const AdminSelfRecharge = () => {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Limite maximale pour éviter l'erreur "Amount too large"
  const MAX_AMOUNT = 10000000; // 10 millions FCFA

  const handleSelfRecharge = async () => {
    if (!amount || !user?.id) {
      toast({
        title: "Données manquantes",
        description: "Veuillez saisir un montant",
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

    // Vérifier la limite maximale
    if (rechargeAmount > MAX_AMOUNT) {
      toast({
        title: "Montant trop élevé",
        description: `Le montant maximum autorisé est de ${formatCurrency(MAX_AMOUNT, 'XAF')}`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Utilisation de la fonction sécurisée
      const { error } = await supabase.rpc('secure_increment_balance', {
        target_user_id: user.id,
        amount: rechargeAmount,
        operation_type: 'admin_self_recharge',
        performed_by: user.id
      });

      if (error) {
        console.error('Erreur RPC:', error);
        throw error;
      }

      // Log de l'opération
      await supabase
        .from('audit_logs')
        .insert({
          action: 'admin_self_recharge',
          table_name: 'profiles',
          record_id: user.id,
          old_values: { old_balance: profile?.balance || 0 },
          new_values: { 
            amount: rechargeAmount,
            reason: reason || 'Auto-recharge administrateur'
          }
        });

      toast({
        title: "Recharge effectuée avec succès",
        description: `Votre solde a été crédité de ${formatCurrency(rechargeAmount, 'XAF')}`,
      });

      // Reset form
      setAmount("");
      setReason("");

      // Recharger la page pour mettre à jour le solde affiché
      window.location.reload();

    } catch (error: any) {
      console.error('Erreur lors de la recharge:', error);
      
      let errorMessage = "Erreur lors de la recharge de votre solde";
      
      // Gestion spécifique des erreurs
      if (error?.message?.includes('Amount too large')) {
        errorMessage = `Montant trop élevé. Maximum autorisé: ${formatCurrency(MAX_AMOUNT, 'XAF')}`;
      } else if (error?.message?.includes('Insufficient balance')) {
        errorMessage = "Solde insuffisant pour cette opération";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
        <CardTitle className="flex items-center gap-3 text-green-700">
          <Wallet className="w-6 h-6" />
          Recharge de votre solde
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Solde actuel */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Solde actuel</p>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(profile?.balance || 0, 'XAF')}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Formulaire de recharge */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recharge-amount" className="text-gray-700 font-medium">
              Montant à ajouter (FCFA)
            </Label>
            <Input
              id="recharge-amount"
              type="number"
              placeholder="Ex: 500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
              max={MAX_AMOUNT}
            />
            <p className="text-xs text-gray-500">
              Montant maximum: {formatCurrency(MAX_AMOUNT, 'XAF')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recharge-reason" className="text-gray-700 font-medium">
              Raison (optionnel)
            </Label>
            <Textarea
              id="recharge-reason"
              placeholder="Raison de la recharge..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Aperçu du nouveau solde */}
        {amount && Number(amount) > 0 && Number(amount) <= MAX_AMOUNT && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Aperçu de la recharge</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Solde actuel: {formatCurrency(profile?.balance || 0, 'XAF')}</p>
                  <p>• Montant à ajouter: {formatCurrency(Number(amount), 'XAF')}</p>
                  <p className="font-semibold">• Nouveau solde: {formatCurrency((profile?.balance || 0) + Number(amount), 'XAF')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Avertissement si montant trop élevé */}
        {amount && Number(amount) > MAX_AMOUNT && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-2">Montant trop élevé</h4>
                <p className="text-sm text-red-700">
                  Le montant maximum autorisé est de {formatCurrency(MAX_AMOUNT, 'XAF')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action */}
        <div className="flex justify-end">
          <Button
            onClick={handleSelfRecharge}
            disabled={isProcessing || !amount || Number(amount) <= 0 || Number(amount) > MAX_AMOUNT}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-full px-8 h-12"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Traitement...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Recharger mon solde
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSelfRecharge;
