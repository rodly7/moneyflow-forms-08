
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BarcodeFormat, BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, X, Flashlight, FlashlightOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FastQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string; isMerchant?: boolean }) => void;
  title?: string;
  variant?: 'default' | 'compact';
}

export const FastQRScanner: React.FC<FastQRScannerProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Scanner QR",
  variant = 'default'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFlashlight, setHasFlashlight] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      setError(null);
      setIsScanning(true);

      // Create a new reader instance
      readerRef.current = new BrowserMultiFormatReader();
      
      // Get video devices
      const videoInputDevices = await readerRef.current.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('Aucune caméra trouvée');
      }

      // Force selection of back camera
      let selectedDeviceId = videoInputDevices[0].deviceId;
      
      // Look for back/rear camera specifically
      const backCamera = videoInputDevices.find(device => {
        const label = device.label.toLowerCase();
        return label.includes('back') || 
               label.includes('rear') || 
               label.includes('environment') ||
               label.includes('arrière') ||
               label.includes('principale');
      });
      
      if (backCamera) {
        selectedDeviceId = backCamera.deviceId;
        console.log('📷 Caméra arrière sélectionnée:', backCamera.label);
      } else {
        // If no back camera found by label, try to use the last camera (often back camera on mobile)
        selectedDeviceId = videoInputDevices[videoInputDevices.length - 1].deviceId;
        console.log('📷 Caméra par défaut (dernière):', videoInputDevices[videoInputDevices.length - 1].label);
      }

      // Check for flashlight capability with back camera constraint
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            deviceId: { exact: selectedDeviceId },
            facingMode: { ideal: "environment" } // Force back camera
          }
        });
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        // Check if torch is supported (with proper type checking)
        setHasFlashlight(!!(capabilities as any).torch);
        
        stream.getTracks().forEach(track => track.stop());
      } catch (capError) {
        console.log('Could not check flashlight capability:', capError);
        setHasFlashlight(false);
      }

      // Start decoding with back camera constraints
      await readerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            try {
              const qrData = result.getText();
              const parsed = JSON.parse(qrData);
              
              const userData = {
                userId: parsed.userId,
                fullName: parsed.fullName,
                phone: parsed.phone,
                isMerchant: Boolean(parsed.isMerchant || parsed.action === 'withdrawal' || parsed.type === 'merchant' || parsed.type === 'user_withdrawal')
              };
              
              if (userData.userId && userData.fullName && userData.phone) {
                onScanSuccess(userData);
                stopCamera();
                onClose();
              } else {
                setError('QR Code invalide - données utilisateur manquantes');
              }
            } catch (parseError) {
              setError('QR Code invalide - format incorrect');
            }
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error('Erreur de scan:', error);
          }
        }
      );

    } catch (err) {
      console.error('Erreur camera:', err);
      setError(err instanceof Error ? err.message : 'Erreur d\'accès à la caméra arrière');
      setIsScanning(false);
    }
  }, [onScanSuccess, onClose]);

  const stopCamera = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
    setIsFlashlightOn(false);
  }, []);

  const toggleFlashlight = useCallback(async () => {
    if (!videoRef.current || !hasFlashlight) return;

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        await track.applyConstraints({
          advanced: [{
            torch: !isFlashlightOn
          } as any]
        });
        setIsFlashlightOn(!isFlashlightOn);
      }
    } catch (err) {
      console.error('Erreur flashlight:', err);
    }
  }, [hasFlashlight, isFlashlightOn]);

  // Fallback: décoder un QR depuis une photo (utile si l'accès caméra est bloqué)
  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = async () => {
        try {
          const localReader = new BrowserMultiFormatReader();
          const result: any = await (localReader as any).decodeFromImage(img as any);
          const qrData = result?.getText ? result.getText() : String(result?.text || '');
          try {
            const parsed = JSON.parse(qrData);
            const userData = {
              userId: parsed.userId,
              fullName: parsed.fullName || parsed.name || 'Utilisateur',
              phone: parsed.phone || ''
            };
            onScanSuccess(userData);
            stopCamera();
            onClose();
          } catch {
            onScanSuccess({ userId: 'scan-img-' + Date.now(), fullName: 'Utilisateur', phone: qrData });
            stopCamera();
            onClose();
          }
        } catch (err) {
          console.error('Erreur lecture image QR:', err);
          setError("Impossible de lire le QR depuis la photo");
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setError('Image invalide');
      };
      img.src = url;
    } catch (err) {
      console.error('Erreur chargement photo:', err);
      setError('Erreur lors du chargement de la photo');
    }
  };

  useEffect(() => {
    if (isOpen && !isScanning) {
      const timer = setTimeout(startCamera, 100);
      return () => clearTimeout(timer);
    } else if (!isOpen && isScanning) {
      stopCamera();
    }
  }, [isOpen, isScanning, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const containerClass = variant === 'compact' 
    ? "w-full max-w-xs mx-auto" 
    : "w-full max-w-md mx-auto";

  const videoClass = variant === 'compact'
    ? "w-full h-40 object-cover rounded-lg"
    : "w-full h-56 object-cover rounded-lg";

  const buttonClass = variant === 'compact'
    ? "text-xs px-3 py-1.5"
    : "text-sm px-4 py-2";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${containerClass} p-4`}>
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg font-semibold text-center">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <Card className="overflow-hidden">
          <CardContent className="p-3">
            {error ? (
              <div className="text-center py-6">
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <div className="flex items-center justify-center gap-2">
                  <Button 
                    onClick={startCamera} 
                    className={`${buttonClass} bg-blue-500 hover:bg-blue-600`}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Activer la caméra
                  </Button>
                  <Button 
                    onClick={handlePickImage} 
                    variant="outline"
                    className={`${buttonClass}`}
                  >
                    Importer une photo
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageSelected}
                />
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  className={videoClass}
                  playsInline
                  muted
                />
                
                {isScanning && (
                  <div className="absolute inset-0 border-2 border-green-400 rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>
                  </div>
                )}
                
                {hasFlashlight && isScanning && (
                  <Button
                    onClick={toggleFlashlight}
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70"
                    size="sm"
                  >
                    {isFlashlightOn ? (
                      <FlashlightOff className="h-4 w-4 text-white" />
                    ) : (
                      <Flashlight className="h-4 w-4 text-white" />
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {!error && (
              <div className="text-center mt-3">
                <p className="text-sm text-gray-600">
                  Positionnez le QR code dans le cadre (caméra arrière)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-center pt-3">
          <Button 
            onClick={handleClose} 
            variant="outline" 
            className={`${buttonClass} border-gray-300`}
          >
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FastQRScanner;
