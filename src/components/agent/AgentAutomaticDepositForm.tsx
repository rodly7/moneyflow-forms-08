import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, User, DollarSign, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils/currency";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  country?: string;
}

const calculateCommission = (amount: number): number => {
  const rate = 0.02;
  return amount * rate;
};

const AgentAutomaticDepositForm = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [client, setClient] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClientLoading, setIsClientLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const validateForm = (): boolean => {
    if (!client) {
      setErrorMessage("Veuillez rechercher un client.");
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage("Montant invalide.");
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleSearchClient = async () => {
    setIsClientLoading(true);
    setClient(null);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, country")
        .eq("phone", phone)
        .single();

      if (error) {
        throw new Error("Client introuvable.");
      }

      if (!data) {
        throw new Error("Client introuvable.");
      }

      setClient({
        id: data.id,
        full_name: data.full_name || "N/A",
        phone: data.phone,
        country: data.country || "N/A",
      });
    } catch (error: any) {
      setErrorMessage(error.message || "Erreur lors de la recherche du client.");
    } finally {
      setIsClientLoading(false);
    }
  };

const handleDeposit = async () => {
  if (!validateForm()) return;

  setIsLoading(true);
  try {
    const depositAmount = parseFloat(amount);
    
    // Use secure_increment_balance function instead of direct balance update
    const { data, error } = await supabase.rpc('secure_increment_balance', {
      target_user_id: client.id,
      amount: depositAmount,
      operation_type: 'agent_deposit',
      performed_by: profile?.id
    });

    if (error) {
      throw error;
    }

    
    
    // Calculate and add commission to agent
    const commission = calculateCommission(depositAmount);
    await supabase.rpc('increment_agent_commission', {
      agent_user_id: profile?.id,
      commission_amount: commission
    });

    toast({
      title: "Dépôt réussi",
      description: `Dépôt de ${formatCurrency(depositAmount)} effectué pour ${client?.full_name}.`,
    });
    setSuccess(true);
    setAmount("");
    setPhone("");
    setClient(null);
  } catch (error: any) {
    console.error("Error during deposit:", error);
    toast({
      title: "Erreur",
      description: error.message || "Impossible d'effectuer le dépôt.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">
          Dépôt Automatique
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Phone Search */}
          <div>
            <Label htmlFor="phone">Numéro de téléphone du client</Label>
            <div className="relative">
              <Input
                type="tel"
                id="phone"
                placeholder="Entrez le numéro de téléphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-12"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Button
                onClick={handleSearchClient}
                disabled={isClientLoading || !phone}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-auto px-3 py-2"
              >
                {isClientLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Recherche...</span>
                  </div>
                ) : (
                  "Rechercher"
                )}
              </Button>
            </div>
          </div>

          {/* Client Info */}
          {client && (
            <div className="p-3 bg-green-50 rounded-md border border-green-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-700">
                  Client trouvé: {client.full_name} ({client.phone})
                </span>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount">Montant du dépôt</Label>
            <div className="relative">
              <Input
                type="number"
                id="amount"
                placeholder="Entrez le montant"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                disabled={!client}
              />
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 rounded-md border border-red-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-700">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button onClick={handleDeposit} className="w-full" disabled={isLoading || !client}>
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Traitement...</span>
              </div>
            ) : (
              "Effectuer le Dépôt"
            )}
          </Button>

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-blue-700">
                  Dépôt réussi!
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentAutomaticDepositForm;
