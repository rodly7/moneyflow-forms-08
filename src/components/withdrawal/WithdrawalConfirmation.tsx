import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/currency';
import { ArrowDownLeft, CheckCircle, AlertCircle, Clock, User, Phone, MapPin } from 'lucide-react';

interface WithdrawalConfirmationProps {
  amount: number;
  phoneNumber: string;
  fullName: string;
  country: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const WithdrawalConfirmation: React.FC<WithdrawalConfirmationProps> = ({
  amount,
  phoneNumber,
  fullName,
  country,
  onConfirm,
  onCancel,
  isLoading
}) => {
  const { toast } = useToast();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = async () => {
    setIsConfirmed(true);
    onConfirm();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Confirmation de Retrait
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-gray-700">
            Veuillez vérifier les informations suivantes avant de confirmer le retrait :
          </p>
          <div className="space-y-1">
            <p className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-2" />
              Nom complet: <span className="font-medium ml-1">{fullName}</span>
            </p>
            <p className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              Numéro de téléphone: <span className="font-medium ml-1">{phoneNumber}</span>
            </p>
            <p className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              Pays: <span className="font-medium ml-1">{country}</span>
            </p>
            <p className="flex items-center text-sm text-gray-600">
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Montant à retirer: <span className="font-medium ml-1">{formatCurrency(amount)}</span>
            </p>
          </div>
        </div>

        {/* Confirmation Actions */}
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || isConfirmed}
          >
            {isLoading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmer le Retrait
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WithdrawalConfirmation;
