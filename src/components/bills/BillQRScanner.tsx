import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BillQRScannerProps {
  onScanSuccess: (data: any) => void;
  onClose: () => void;
}

export const BillQRScanner: React.FC<BillQRScannerProps> = ({
  onScanSuccess,
  onClose
}) => {
  const handleMockScan = () => {
    // Mock scan data for testing
    const mockData = {
      accountNumber: '12345678',
      provider: 'SENELEC',
      serviceType: 'electricity',
      amount: '50000'
    };
    onScanSuccess(mockData);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Scanner QR Code</p>
              <Button onClick={handleMockScan} className="mb-2">
                Test Scanner
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Pointez votre caméra vers le QR code de la facture
            </p>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              Annuler
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};