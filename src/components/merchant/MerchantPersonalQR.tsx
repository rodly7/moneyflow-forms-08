import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Printer, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const MerchantPersonalQR = () => {
  const { profile } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // QR code personnel du commerçant (même structure que les utilisateurs)
  const personalQRData = JSON.stringify({
    type: 'merchant_profile',
    userId: profile?.id || '',
    fullName: profile?.full_name || 'Commerçant',
    phone: profile?.phone || '',
    currency: 'XAF',
    timestamp: Date.now()
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
      link.download = `qr-merchant-${profile?.id}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    
    toast({
      title: "QR Code téléchargé",
      description: "Votre QR code personnel a été sauvegardé"
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mon QR Code - ${profile?.full_name}`,
          text: `Scannez pour me payer sans frais`,
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
          <title>Mon QR Code - ${profile?.full_name}</title>
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
            .subtitle { font-size: 18px; color: #2563eb; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>${profile?.full_name}</h1>
            <div class="subtitle">Mon QR Code Personnel</div>
            <div style="margin: 20px 0;">
              ${svgData}
            </div>
            <p><small>Scannez pour me payer sans frais</small></p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="h-5 w-5 mr-2" />
          Mon QR Code Personnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* QR Code Display - Mobile optimized */}
        <div className="text-center" ref={qrRef}>
          <div className="bg-white p-4 sm:p-6 rounded-lg border-2 inline-block">
            <QRCodeSVG
              value={personalQRData}
              size={window.innerWidth < 640 ? 180 : 200}
              level="M"
              includeMargin={true}
            />
          </div>
        </div>

        {/* Merchant Info - Mobile optimized */}
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-base sm:text-lg">{profile?.full_name}</h3>
          <p className="text-primary font-medium text-sm">ID: {profile?.id?.slice(0, 8)}...</p>
          <p className="text-xs sm:text-sm text-green-600">✓ Paiements sans frais</p>
        </div>

        {/* Action Buttons - Mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <Button variant="outline" onClick={handleDownload} size="sm" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            <span className="text-xs sm:text-sm">Télécharger</span>
          </Button>
          <Button variant="outline" onClick={handleShare} size="sm" className="w-full">
            <Share2 className="h-4 w-4 mr-2" />
            <span className="text-xs sm:text-sm">Partager</span>
          </Button>
          <Button variant="outline" onClick={handlePrint} size="sm" className="w-full">
            <Printer className="h-4 w-4 mr-2" />
            <span className="text-xs sm:text-sm">Imprimer</span>
          </Button>
        </div>

        {/* Instructions - Mobile optimized */}
        <div className="bg-muted p-3 sm:p-4 rounded-lg">
          <h4 className="font-medium mb-2 text-sm sm:text-base">Pour vos clients :</h4>
          <ol className="text-xs sm:text-sm space-y-1 list-decimal list-inside">
            <li>Scanner ce QR code avec SendFlow</li>
            <li>Saisir le montant à payer</li>
            <li>Confirmer le paiement</li>
            <li>Vous recevez l'argent instantanément !</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default MerchantPersonalQR;