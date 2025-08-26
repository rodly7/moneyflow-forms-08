import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { calculateFee } from '@/lib/utils/currency';

interface TransferDetailsProps {
  amount: number;
  senderCountry: string;
  recipientCountry: string;
  userType?: 'user' | 'agent' | 'admin' | 'sub_admin';
  fee?: number;
  onAmountChange: (amount: number) => void;
  onNoteChange: (note: string) => void;
  note?: string;
}

export const TransferDetails: React.FC<TransferDetailsProps> = ({
  amount,
  senderCountry,
  recipientCountry,
  userType = 'user',
  fee,
  onAmountChange,
  onNoteChange,
  note = '',
}) => {
  const calculatedFee = calculateFee(amount, senderCountry, recipientCountry, userType);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(e.target.value);
    if (!isNaN(newAmount)) {
      onAmountChange(newAmount);
    } else {
      onAmountChange(0);
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNoteChange(e.target.value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Détails du transfert</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="amount">Montant à envoyer</Label>
          <Input
            type="number"
            id="amount"
            placeholder="0"
            value={amount > 0 ? amount.toString() : ''}
            onChange={handleAmountChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="fee">Frais de transfert</Label>
          <Input
            type="text"
            id="fee"
            value={calculatedFee.fee.toString()}
            readOnly
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="note">Note (optionnel)</Label>
          <Textarea
            id="note"
            placeholder="Ajouter une note"
            value={note}
            onChange={handleNoteChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};
