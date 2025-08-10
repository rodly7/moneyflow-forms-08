
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BarcodeFormat, BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, X, Flashlight, FlashlightOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';

interface FastQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
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

      // Use the first available camera (usually back camera on mobile)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      // Check for flashlight capability
      const capabilities = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedDeviceId }
      }).then(stream => {
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities();
        stream.getTracks().forEach(track => track.stop());
        return caps;
      });

      setHasFlashlight(!!capabilities.torch);

      // Start decoding with specific constraints for mobile optimization
      await readerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            try {
              const qrData = result.getText();
              const userData = JSON.parse(qrData);
              
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
      setError(err instanceof Error ? err.message : 'Erreur d\'accès à la caméra');
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
    ? "max-w-sm mx-auto" 
    : "max-w-md mx-auto";

  const videoClass = variant === 'compact'
    ? "w-full h-48 object-cover rounded-lg"
    : "w-full h-64 object-cover rounded-lg";

  const buttonClass = variant === 'compact'
    ? "text-xs px-2 py-1"
    : "text-sm px-4 py-2";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${containerClass} p-3`}>
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-semibold text-center">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <Card className="overflow-hidden">
          <CardContent className="p-2">
            {error ? (
              <div className="text-center py-6">
                <p className="text-red-500 text-xs mb-3">{error}</p>
                <Button 
                  onClick={startCamera} 
                  className={`${buttonClass} bg-blue-500 hover:bg-blue-600`}
                >
                  <Camera className="h-3 w-3 mr-1" />
                  Réessayer
                </Button>
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
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70"
                    size="sm"
                  >
                    {isFlashlightOn ? (
                      <FlashlightOff className="h-3 w-3 text-white" />
                    ) : (
                      <Flashlight className="h-3 w-3 text-white" />
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {!error && (
              <div className="text-center mt-2">
                <p className="text-xs text-gray-600">
                  Positionnez le QR code dans le cadre
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-center pt-2">
          <Button 
            onClick={handleClose} 
            variant="outline" 
            className={`${buttonClass} border-gray-300`}
          >
            <X className="h-3 w-3 mr-1" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FastQRScanner;
