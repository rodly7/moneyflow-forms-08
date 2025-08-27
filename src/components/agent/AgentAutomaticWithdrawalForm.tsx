import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, User, CreditCard, AlertCircle } from "lucide-react";
import { AgentBalanceCard } from "./AgentBalanceCard";
import { formatCurrency } from "@/lib/utils/currency";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";

export const AgentAutomaticWithdrawalForm = () => {
  const {
    amount,
    setAmount,
    phoneNumber,
    setPhoneNumber,
    clientData,
    isSearchingClient,
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    isProcessing,
    fetchAgentBalances,
    searchClientByPhone,
    handleSubmit
  } = useAgentWithdrawalEnhanced();

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle>Retrait Automatique</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AgentBalanceCard
            balance={agentBalance}
            isLoading={isLoadingBalance}
            onRefresh={fetchAgentBalances}
          />

          <div>
            <Label htmlFor="phoneNumber">Numéro de téléphone du client</Label>
            <div className="relative">
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: +221773637752"
                disabled={isSearchingClient}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute right-1 top-1 rounded px-3"
                onClick={() => searchClientByPhone(phoneNumber)}
                disabled={isSearchingClient}
              >
                {isSearchingClient ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Recherche...</span>
                  </div>
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Rechercher
              </Button>
            </div>
            {clientData && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
                <User className="w-4 h-4 mr-2 text-green-600" />
                <span className="text-sm text-green-700">
                  Client trouvé: {clientData.full_name} ({clientData.phone})
                </span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Montant à retirer</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Traitement...</span>
              </div>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Confirmer le retrait
              </>
            )}
          </Button>

          {agentCommissionBalance <= 10000 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Attention: Votre solde de commission est bas. Veuillez recharger.
              </span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
