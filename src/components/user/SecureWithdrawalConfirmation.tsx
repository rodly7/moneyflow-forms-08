import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  User, 
  Phone, 
  DollarSign,
  Eye,
  EyeOff,
  AlertTriangle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";

interface SecureWithdrawalConfirmationProps {
  userName: string;
  userPhone: string;
  withdrawalAmount: number;
  onConfirm: (securityCode: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const SecureWithdrawalConfirmation: React.FC<SecureWithdrawalConfirmationProps> = ({
  userName,
  userPhone,
  withdrawalAmount,
  onConfirm,
  onCancel,
  isLoading
}) => {
  const { toast } = useToast();
  const [securityCode, setSecurityCode] = useState("");
  const [showSecurityCode, setShowSecurityCode] = useState(false);

  const handleConfirm = () => {
    if (!securityCode) {
      toast({
        title: "Code de sécurité requis",
        description: "Veuillez entrer le code de sécurité pour confirmer le retrait.",
        variant: "destructive",
      });
      return;
    }
    onConfirm(securityCode);
  };

  const toggleSecurityCodeVisibility = () => {
    setShowSecurityCode(!showSecurityCode);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Confirmation Sécurisée</CardTitle>
        <Shield className="h-5 w-5 text-blue-500" />
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-700">
              Veuillez vérifier les informations suivantes avant de confirmer votre retrait.
            </p>
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium">Nom:</p>
            <p className="text-sm text-gray-600">{userName}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium">Téléphone:</p>
            <p className="text-sm text-gray-600">{userPhone}</p>
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium">Montant du retrait:</p>
            <p className="text-sm text-gray-600">{formatCurrency(withdrawalAmount)}</p>
          </div>

          <Separator />

          <div>
            <Label htmlFor="securityCode">Code de sécurité</Label>
            <div className="relative">
              <Input
                type={showSecurityCode ? "text" : "password"}
                id="securityCode"
                placeholder="Entrez le code de sécurité"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleSecurityCodeVisibility}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              >
                {showSecurityCode ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
              Annuler
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Confirmer...
                </>
              ) : (
                "Confirmer"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
