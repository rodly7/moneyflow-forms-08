
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QrCode, Download, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface QRCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRCodeGenerator = ({ isOpen, onClose }: QRCodeGeneratorProps) => {
  const { user, profile } = useAuth();
  
  // Générer les données QR pour le retrait
  const generateQRData = () => {
    if (!user || !profile) return '';
    
    const qrData = {
      userId: user.id,
      fullName: profile.full_name || 'Utilisateur',
      phone: profile.phone,
      action: 'withdraw',
      type: 'user_withdrawal',
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(qrData);
  };

  const qrValue = generateQRData();

  const downloadQR = () => {
    const svg = document.querySelector('#qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'qr-code-retrait.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-emerald-600" />
            Mon QR Code de Retrait
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center p-4 bg-white rounded-lg border">
            {qrValue ? (
              <QRCodeSVG 
                id="qr-code-svg"
                value={qrValue}
                size={200}
                level="M"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#ffffff"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Présentez ce QR code à un agent pour effectuer un retrait
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Nom:</strong> {profile?.full_name || 'Non défini'}</p>
              <p><strong>Téléphone:</strong> {profile?.phone || 'Non défini'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadQR}
              className="flex-1"
              disabled={!qrValue}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeGenerator;
