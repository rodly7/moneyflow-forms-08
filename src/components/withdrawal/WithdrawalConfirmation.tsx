
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";
import { useWithdrawalConfirmation } from "@/hooks/useWithdrawalConfirmation";
import { useWithdrawalOperations } from "@/hooks/useWithdrawalOperations";

interface WithdrawalConfirmationProps {
  onClose: () => void;
}

const WithdrawalConfirmation = ({ onClose }: WithdrawalConfirmationProps) => {
  const {
    verificationCode,
    setVerificationCode,
    isProcessing
  } = useWithdrawalConfirmation(onClose);

  const { handleConfirm, handleReject } = useWithdrawalOperations(onClose);

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
            placeholder="Entrez le code à 6 chiffres"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            className="text-center text-lg"
          />
        </div>
        
        <div className="text-sm text-gray-600">
          <p>Un agent souhaite effectuer un retrait sur votre compte.</p>
          <p>Entrez le code de vérification pour confirmer ou refuser cette demande.</p>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={() => handleConfirm(verificationCode)}
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
            onClick={() => handleReject(verificationCode)}
            disabled={isProcessing || verificationCode.length !== 6}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Refuser
          </Button>
        </div>

        <Button
          onClick={onClose}
          variant="outline"
          className="w-full"
        >
          Annuler
        </Button>
      </CardContent>
    </Card>
  );
};

export default WithdrawalConfirmation;
