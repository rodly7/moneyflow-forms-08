import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Printer, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MerchantQRGeneratorProps {
  merchantData: {
    businessName: string;
    merchantId: string;
    paymentAmount: string;
    description: string;
  };
  onClose: () => void;
}

const MerchantQRGenerator = ({ merchantData, onClose }: MerchantQRGeneratorProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Données à encoder dans le QR code
  const qrData = JSON.stringify({
    type: 'merchant_payment',
    merchantId: merchantData.merchantId,
    businessName: merchantData.businessName,
    amount: parseFloat(merchantData.paymentAmount),
    description: merchantData.description,
    timestamp: Date.now(),
    currency: 'XAF'
  });

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `qr-payment-${merchantData.merchantId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    
    toast({
      title: "QR Code téléchargé",
      description: "Le QR code a été sauvegardé avec succès"
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code - ${merchantData.businessName}`,
          text: `Scannez pour payer ${merchantData.paymentAmount} XAF`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      toast({
        title: "Partage non supporté",
        description: "Utilisez le bouton télécharger à la place"
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svg = qrRef.current?.querySelector('svg');
    const svgData = svg ? new XMLSerializer().serializeToString(svg) : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${merchantData.businessName}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .qr-container {
              border: 2px solid #000;
              padding: 20px;
              margin: 20px auto;
              max-width: 400px;
            }
            h1 { margin-bottom: 10px; }
            .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>${merchantData.businessName}</h1>
            <div class="amount">${merchantData.paymentAmount} XAF</div>
            ${merchantData.description ? `<p>${merchantData.description}</p>` : ''}
            <div style="margin: 20px 0;">
              ${svgData}
            </div>
            <p><small>Scannez avec l'app pour payer sans frais</small></p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>QR Code de Paiement</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="text-center" ref={qrRef}>
          <div className="bg-white p-6 rounded-lg border-2 inline-block">
            <QRCodeSVG
              value={qrData}
              size={200}
              level="M"
              includeMargin={true}
            />
          </div>
        </div>

        {/* Payment Info */}
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">{merchantData.businessName}</h3>
          <p className="text-2xl font-bold text-primary">{merchantData.paymentAmount} XAF</p>
          {merchantData.description && (
            <p className="text-muted-foreground">{merchantData.description}</p>
          )}
          <p className="text-sm text-green-600">✓ Sans frais pour le client</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Partager
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Instructions pour vos clients :</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Ouvrir l'application SendFlow</li>
            <li>Scanner ce QR code</li>
            <li>Confirmer le paiement</li>
            <li>Paiement instantané sans frais !</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default MerchantQRGenerator;