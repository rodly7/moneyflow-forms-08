
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";
import { useSimpleWithdrawal } from "@/hooks/useSimpleWithdrawal";

interface SimpleWithdrawalConfirmationProps {
  onClose: () => void;
}

const SimpleWithdrawalConfirmation = ({ onClose }: SimpleWithdrawalConfirmationProps) => {
  const [verificationCode, setVerificationCode] = useState("");
  const { confirmWithdrawal, isProcessing } = useSimpleWithdrawal();

  const handleConfirm = async () => {
    if (verificationCode.length !== 6) return;
    
    const result = await confirmWithdrawal(verificationCode);
    if (result.success) {
      onClose();
    }
  };

  const handleReject = async () => {
    // Pour simplifier, on ferme juste la modal
    onClose();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Confirmer le retrait</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verificationCode">Code de vérification</Label>
          <Input
            id="verificationCode"
            type="text"
            placeholder="Code à 6 chiffres"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            className="text-center text-lg"
          />
        </div>
        
        <div className="text-sm text-gray-600 text-center">
          <p>Entrez le code de vérification pour confirmer le retrait</p>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || verificationCode.length !== 6}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Confirmer
          </Button>
          
          <Button
            onClick={handleReject}
            disabled={isProcessing}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleWithdrawalConfirmation;
