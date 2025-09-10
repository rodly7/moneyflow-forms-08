import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Download, User, Phone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';

export const ProviderQRCode = () => {
  const { user, profile } = useAuth();

  const generateQRData = () => {
    return JSON.stringify({
      userId: user?.id,
      name: profile?.full_name || 'Fournisseur',
      phone: profile?.phone || '',
      action: 'withdrawal',
      type: 'provider',
      timestamp: Date.now()
    });
  };

  const downloadQR = () => {
    const svg = document.querySelector('#provider-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const link = document.createElement('a');
        link.download = `qr-fournisseur-${profile?.phone || 'retrait'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code de Retrait
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Utilisez ce QR code pour permettre aux clients de retirer leurs fonds
        </p>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <QrCode className="h-4 w-4 mr-2" />
              Afficher le QR Code
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">QR Code de Retrait Fournisseur</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex justify-center">
                {user?.id ? (
                  <QRCodeSVG
                    id="provider-qr-code"
                    value={generateQRData()}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                ) : (
                  <div className="w-[200px] h-[200px] bg-muted rounded-lg flex items-center justify-center">
                    <QrCode className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {profile?.full_name || 'Fournisseur'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {profile?.phone || 'N/A'}
                  </span>
                </div>
              </div>

              <Button 
                onClick={downloadQR} 
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger QR Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};