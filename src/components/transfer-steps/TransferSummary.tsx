import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateFee } from '@/lib/utils/currency';

interface TransferSummaryProps {
  amount: number;
  senderCountry: string;
  recipientCountry: string;
}

export const TransferSummary = ({ amount, senderCountry, recipientCountry }: TransferSummaryProps) => {
  const { fee, rate } = calculateFee(amount, senderCountry, recipientCountry);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé du Transfert</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium">Montant à envoyer</div>
            <div className="text-lg font-bold">{amount} XAF</div>
          </div>
          <div>
            <div className="text-sm font-medium">Frais de transfert</div>
            <div className="text-lg font-bold">{fee} XAF</div>
            <Badge variant="secondary">
              {rate}%
            </Badge>
          </div>
          <div>
            <div className="text-sm font-medium">Total à payer</div>
            <div className="text-lg font-bold">{amount + fee} XAF</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
