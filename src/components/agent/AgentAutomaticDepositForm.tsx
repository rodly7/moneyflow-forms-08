import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, AlertCircle, Loader2, User, Wallet } from "lucide-react";

import { useDepositOperations } from "@/hooks/useDepositOperations";
import { findUserByPhone } from "@/services/withdrawalService";
import { useToast } from "@/hooks/use-toast";


interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country?: string;
}

export const AgentAutomaticDepositForm = () => {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  
  const { processDeposit, isProcessing } = useDepositOperations();
  const { toast } = useToast();

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    setClientData(null);
    
    try {
      if (value.replace(/\D/g, '').length >= 8) {
        const client = await findUserByPhone(value);
        if (client) {
          setClientData(client);
          toast({
            title: "Client identifié",
            description: `${client.full_name || 'Utilisateur'} identifié`,
          });
        } else {
          toast({
            title: "Utilisateur introuvable",
            description: "Aucun profil associé à ce numéro",
            variant: "destructive"
          });
        }
      }
    } catch (err) {
      console.error('Erreur lors de la recherche du client:', err);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations de l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !clientData) {
      toast({
        title: "Informations incomplètes",
        description: "Saisissez le numéro du client et le montant",
        variant: "destructive"
      });
      return;
    }

    const depositAmount = Number(amount);
    const success = await processDeposit(
      depositAmount,
      clientData.id,
      clientData.full_name,
      clientData.balance,
      phoneNumber
    );

    if (success) {
      setAmount("");
      setPhoneNumber("");
      setClientData(null);
    }
  };

  const isValidAmount = amount && Number(amount) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-500" />
          Dépôt pour client
        </CardTitle>
        <p className="text-sm text-gray-600">
          Saisissez le numéro du client pour retrouver automatiquement ses informations puis entrez le montant à déposer
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identification via numéro de téléphone */}
          <div className="space-y-3">
            <Label>Numéro du client</Label>
            <div className="space-y-2">
              <Input
                id="phone"
                type="tel"
                placeholder="Entrez le numéro du client (ex: +242...)"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="h-12"
                required
              />
              <p className="text-xs text-gray-600">
                La recherche se lance automatiquement dès que le numéro est complet.
              </p>
            </div>
          </div>

          {/* Informations du client */}
          {clientData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
              <div className="flex items-center text-green-800">
                <User className="w-4 h-4 mr-2" />
                <span className="font-medium">
                  {clientData.full_name || 'Nom non disponible'}
                </span>
              </div>
              <div className="text-sm text-green-600">
                Téléphone: {clientData.phone}
              </div>
            </div>
          )}

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant du dépôt (XAF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant à déposer"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-12 text-lg"
              disabled={!clientData}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
            disabled={isProcessing || !isValidAmount || !clientData}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Traitement du dépôt...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Download className="mr-2 h-5 w-5" />
                <span>Effectuer le dépôt</span>
              </div>
            )}
          </Button>
        </form>

      </CardContent>
    </Card>
  );
};
