import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Store, TrendingUp, Users, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MerchantQRGenerator from '@/components/merchant/MerchantQRGenerator';
import MerchantTransactionHistory from '@/components/merchant/MerchantTransactionHistory';
import MerchantStats from '@/components/merchant/MerchantStats';

const MerchantDashboard = () => {
  const [merchantData, setMerchantData] = useState({
    businessName: '',
    merchantId: 'MERCH_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    paymentAmount: '',
    description: ''
  });
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const { toast } = useToast();

  const handleGenerateQR = () => {
    if (!merchantData.businessName || !merchantData.paymentAmount) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez renseigner le nom du commerce et le montant",
        variant: "destructive"
      });
      return;
    }
    setShowQRGenerator(true);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-foreground">Interface Commerciale</h1>
          </div>
          <p className="text-muted-foreground">
            Générez des QR codes pour recevoir des paiements sans frais
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Paiements du jour</p>
                  <p className="text-2xl font-bold">0 XAF</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total du mois</p>
                  <p className="text-2xl font-bold">0 XAF</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Clients</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <QrCode className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">QR Scannés</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                Générateur de QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nom du commerce *</Label>
                <Input
                  id="businessName"
                  value={merchantData.businessName}
                  onChange={(e) => setMerchantData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Ex: Restaurant Le Délice"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchantId">ID Commerçant</Label>
                <Input
                  id="merchantId"
                  value={merchantData.merchantId}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Montant (XAF) *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={merchantData.paymentAmount}
                  onChange={(e) => setMerchantData(prev => ({ ...prev, paymentAmount: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Input
                  id="description"
                  value={merchantData.description}
                  onChange={(e) => setMerchantData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Commande #123"
                />
              </div>

              <Button 
                onClick={handleGenerateQR} 
                className="w-full"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Générer QR Code
              </Button>

              <div className="text-center">
                <p className="text-sm text-green-600 font-medium">
                  ✓ Paiements sans frais pour vos clients
                </p>
              </div>
            </CardContent>
          </Card>

          {/* QR Display */}
          {showQRGenerator && (
            <MerchantQRGenerator 
              merchantData={merchantData}
              onClose={() => setShowQRGenerator(false)}
            />
          )}

          {/* Transaction History */}
          <MerchantTransactionHistory />
        </div>

        {/* Detailed Stats */}
        <MerchantStats />
      </div>
    </div>
  );
};

export default MerchantDashboard;