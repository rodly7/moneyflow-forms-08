
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Minus, User, Shield, Loader2 } from "lucide-react";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { formatCurrency } from "@/integrations/supabase/client";

export const AgentAutomaticWithdrawalForm = () => {
  const {
    amount,
    setAmount,
    phoneNumber,
    setPhoneNumber,
    clientData,
    isSearchingClient,
    isProcessing,
    searchClientByPhone,
    handleSubmit
  } = useAgentWithdrawalEnhanced();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    if (clientData) {
      // Reset client data when phone changes
    }

    if (value.length >= 8) {
      searchClientByPhone(value);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <Minus className="w-5 h-5" />
          Retrait Client Automatique
        </CardTitle>
        <p className="text-sm text-gray-600">
          Le retrait sera effectué immédiatement et vous recevrez votre commission
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro du client</Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                placeholder="Entrez le numéro du client"
                value={phoneNumber}
                onChange={handlePhoneChange}
                required
                className="h-12 text-base"
              />
              {isSearchingClient && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                </div>
              )}
            </div>
            
            {/* Fixed space for search feedback */}
            <div className="min-h-[80px] mt-2">
              {clientData && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2 animate-fade-in">
                  <div className="flex items-center text-green-800">
                    <User className="w-4 h-4 mr-2" />
                    <span className="font-medium">{clientData.full_name || 'Nom non disponible'}</span>
                  </div>
                  <div className="text-sm text-green-600">
                    Solde: {formatCurrency(clientData.balance || 0, 'XAF')}
                  </div>
                  <div className="text-xs text-green-500 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Client vérifié
                  </div>
                </div>
              )}

              {phoneNumber.length >= 8 && !clientData && !isSearchingClient && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md animate-fade-in">
                  <p className="text-red-700 text-sm">
                    Aucun client trouvé avec ce numéro
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant du retrait (XAF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-12 text-lg"
              disabled={!clientData}
            />
            
            {/* Fixed space for amount validation */}
            <div className="min-h-[100px] mt-2">
              {amount && clientData && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-md animate-fade-in">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Montant du retrait:</span>
                      <span className="font-medium">{formatCurrency(Number(amount), 'XAF')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Votre commission (0,5%):</span>
                      <span className="font-medium text-emerald-600">
                        {formatCurrency(Number(amount) * 0.005, 'XAF')}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Débité du client:</span>
                      <span>{formatCurrency(Number(amount), 'XAF')}</span>
                    </div>
                    {Number(amount) > (clientData.balance || 0) && (
                      <div className="text-red-600 text-xs mt-2">
                        ⚠️ Solde client insuffisant
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            disabled={
              isProcessing || 
              !clientData || 
              !amount || 
              Number(amount) <= 0 ||
              Number(amount) > (clientData?.balance || 0)
            }
          >
            {isProcessing ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Traitement en cours...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Minus className="mr-2 h-5 w-5" />
                <span>Effectuer le retrait</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
