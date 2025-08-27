import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/currency";
import { DollarSign, AlertCircle } from "lucide-react";

interface WithdrawalAmountSectionProps {
  amount: string;
  setAmount: (amount: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export const WithdrawalAmountSection = ({
  amount,
  setAmount,
  onSubmit,
  isLoading,
  errorMessage,
}: WithdrawalAmountSectionProps) => {
  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">Montant du Retrait</CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant à retirer</Label>
            <div className="relative">
              <Input
                type="number"
                id="amount"
                placeholder="Entrez le montant"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 rounded-md border border-red-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-700">{errorMessage}</span>
              </div>
            </div>
          )}

          <Button onClick={onSubmit} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Traitement...</span>
              </div>
            ) : (
              "Confirmer le Retrait"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
