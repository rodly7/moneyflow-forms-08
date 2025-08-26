import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency, calculateFee } from '@/lib/utils/currency';

interface SimpleHtmlTransferConfirmationProps {
  amount: number;
  recipientName: string;
  recipientPhone: string;
  senderCountry: string;
  recipientCountry: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SimpleHtmlTransferConfirmation: React.FC<SimpleHtmlTransferConfirmationProps> = ({
  amount,
  recipientName,
  recipientPhone,
  senderCountry,
  recipientCountry,
  onConfirm,
  onCancel,
}) => {
  const { fee } = calculateFee(amount, senderCountry, recipientCountry);
  const totalAmount = amount + fee;

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-semibold">Confirmation de Transfert</h1>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <p>
                  <span className="font-bold">Montant à envoyer:</span> {formatCurrency(amount, 'XAF')}
                </p>
                <p>
                  <span className="font-bold">Frais de transfert:</span> {formatCurrency(fee, 'XAF')}
                </p>
                <p>
                  <span className="font-bold">Montant total:</span> {formatCurrency(totalAmount, 'XAF')}
                </p>
                <p>
                  <span className="font-bold">Destinataire:</span> {recipientName}
                </p>
                <p>
                  <span className="font-bold">Numéro de téléphone:</span> {recipientPhone}
                </p>
              </div>
              <div className="pt-6 text-base font-semibold leading-6 sm:text-lg sm:leading-7">
                <p className="text-gray-900">Confirmer le transfert ?</p>
                <div className="flex justify-between mt-4">
                  <Button onClick={onCancel} variant="secondary">
                    Annuler
                  </Button>
                  <Button onClick={onConfirm}>Confirmer</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
