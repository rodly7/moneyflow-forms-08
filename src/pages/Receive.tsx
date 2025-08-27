
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase, formatCurrency, getCurrencyForCountry } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const Receive = () => {
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [rechargeCode, setRechargeCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Récupérer le profil de l'utilisateur
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Obtenir la devise de l'utilisateur
  const userCurrency = profile?.country ? getCurrencyForCountry(profile.country) : "XAF";

  // Générer un code aléatoire de 6 chiffres
  const generateRechargeCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Fonction pour initier la recharge
  const handleInitiateRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Générer un code de recharge
      const code = generateRechargeCode();
      
      // Enregistrer la demande de recharge en attente
      const { error } = await supabase.from('recharges').insert({
        user_id: user?.id,
        amount: Number(amount),
        country: profile?.country || "Congo Brazzaville",
        payment_method: "wallet",
        payment_phone: profile?.phone || "",
        payment_provider: "agent",
        status: 'pending',
        transaction_reference: code
      });
      
      if (error) throw error;
      
      // Afficher le code de recharge
      setRechargeCode(code);
      setShowCodeDialog(true);
      
    } catch (error) {
      console.error('Erreur lors de l\'initiation de la recharge:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'initiation de la recharge",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour vérifier un code de recharge
  const handleVerifyRecharge = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Code invalide",
        description: "Veuillez entrer un code à 6 chiffres",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      // Vérifier si le code existe et est valide
      const { data, error } = await supabase
        .from('recharges')
        .select('*')
        .eq('transaction_reference', verificationCode)
        .eq('status', 'pending')
        .single();
        
      if (error || !data) {
        throw new Error("Code de recharge invalide ou déjà utilisé");
      }
      
      // S'assurer que l'agent n'est pas l'utilisateur qui a fait la demande
      if (data.user_id === user?.id) {
        throw new Error("Vous ne pouvez pas confirmer votre propre recharge");
      }

      // Mettre à jour le statut de la recharge
      await supabase
        .from('recharges')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
        
      // Ajouter le montant au solde de l'utilisateur
      await supabase.rpc('increment_balance', {
        user_id: data.user_id,
        amount: data.amount
      });
      
      // Déduire le montant du compte de l'agent
      // Nous devons utiliser increment_balance avec une valeur négative
      // puisque decrement_balance n'existe pas
      await supabase.rpc('increment_balance', {
        user_id: user?.id,
        amount: -data.amount
      });
      
      toast({
        title: "Recharge confirmée",
        description: `La recharge de ${formatCurrency(data.amount, userCurrency)} a été effectuée avec succès`,
      });
      
      // Fermer la boîte de dialogue et réinitialiser
      setVerificationCode("");
      setShowCodeDialog(false);
      navigate('/');
      
    } catch (error) {
      console.error('Erreur lors de la vérification du code:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la vérification du code",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-lg mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Recharger mon compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isProfileLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <form onSubmit={handleInitiateRecharge} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={profile?.full_name || ""}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    type="text"
                    value={profile?.country || ""}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant à recharger ({userCurrency})</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="100"
                    placeholder={`Entrez le montant en ${userCurrency}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                    <div className="flex justify-between">
                      <span>Montant:</span>
                      <span>{formatCurrency(Number(amount), userCurrency)}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Traitement..." : "Obtenir un code de recharge"}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCodeDialog(true)}
                  >
                    Confirmer une recharge
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog pour afficher le code de recharge */}
      <Dialog open={showCodeDialog && !!rechargeCode} onOpenChange={(open) => {
        if (!open) {
          setRechargeCode("");
        }
        setShowCodeDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Votre code de recharge</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <p className="text-center text-sm text-gray-600">
              Partagez ce code avec l'agent qui va confirmer votre recharge de {amount && formatCurrency(Number(amount), userCurrency)}.
            </p>
            
            <div className="bg-gray-100 p-5 rounded-lg shadow-sm w-full">
              <InputOTP maxLength={6} value={rechargeCode} disabled>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <div className="text-center font-bold text-2xl tracking-widest my-2">
              {rechargeCode}
            </div>
            
            <p className="text-center text-xs text-gray-500">
              Ce code est valide jusqu'à ce que la recharge soit confirmée.
            </p>
            
            <Button 
              onClick={() => {
                setRechargeCode("");
                setShowCodeDialog(false);
              }}
              className="w-full mt-4"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour vérifier un code de recharge */}
      <Dialog open={showCodeDialog && !rechargeCode} onOpenChange={(open) => {
        if (!open) {
          setVerificationCode("");
        }
        setShowCodeDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer une recharge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <p className="text-sm text-gray-600">
              Entrez le code de recharge fourni par l'utilisateur:
            </p>
            
            <InputOTP 
              maxLength={6} 
              value={verificationCode} 
              onChange={setVerificationCode}
              disabled={isVerifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            
            <div className="flex gap-2 justify-end mt-6">
              <Button 
                variant="outline"
                onClick={() => {
                  setVerificationCode("");
                  setShowCodeDialog(false);
                }}
                disabled={isVerifying}
              >
                Annuler
              </Button>
              
              <Button 
                onClick={handleVerifyRecharge}
                disabled={verificationCode.length !== 6 || isVerifying}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isVerifying ? "Vérification..." : "Confirmer la recharge"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Receive;
