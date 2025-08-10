
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, Zap, RotateCcw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface FastQRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
}

export const FastQRScanner: React.FC<FastQRScannerProps> = ({ 
  onScan, 
  onClose, 
  title = "Scanner QR Code" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialiser le scanner
  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    startScanning();
    
    return () => {
      stopScanning();
    };
  }, []);

  const stopScanning = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    if (!readerRef.current || !videoRef.current) return;

    try {
      setError(null);
      setIsScanning(true);

      // Obtenir les appareils vidéo disponibles
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = videoDevices.filter(device => device.kind === 'videoinput');
      setDevices(cameras);

      // Utiliser la caméra arrière si disponible
      const backCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('back') || 
        camera.label.toLowerCase().includes('rear')
      );
      const selectedDeviceId = deviceId || backCamera?.deviceId || cameras[0]?.deviceId;

      if (selectedDeviceId) {
        setDeviceId(selectedDeviceId);
        
        // Démarrer le scan avec la caméra sélectionnée
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            deviceId: selectedDeviceId,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: deviceId ? undefined : 'environment'
          }
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Démarrer la détection
          const result = await readerRef.current.decodeOnceFromVideoDevice(selectedDeviceId);
          if (result) {
            handleScanResult(result);
          }
        }
      }
    } catch (err) {
      console.error('Erreur scan QR:', err);
      setError(err instanceof Error ? err.message : 'Erreur de scan');
      setIsScanning(false);
    }
  }, [deviceId]);

  const handleScanResult = useCallback((result: Result) => {
    const scannedData = result.getText();
    console.log('QR Code scanné:', scannedData);
    onScan(scannedData);
    stopScanning();
  }, [onScan, stopScanning]);

  const switchCamera = useCallback(async () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(device => device.deviceId === deviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      const nextDevice = devices[nextIndex];
      
      stopScanning();
      setDeviceId(nextDevice.deviceId);
      
      // Redémarrer avec la nouvelle caméra
      setTimeout(() => startScanning(), 100);
    }
  }, [devices, deviceId, stopScanning, startScanning]);

  const retryScanning = useCallback(() => {
    stopScanning();
    setTimeout(() => startScanning(), 100);
  }, [stopScanning, startScanning]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-3">
          {/* Header mobile optimisé */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              {title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Zone de scan mobile optimisée */}
          <div className="relative bg-black rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '1/1' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Overlay de scan */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white rounded-lg border-dashed opacity-60">
                <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-400"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-400"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-400"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-400"></div>
              </div>
            </div>

            {/* Status indicator */}
            {isScanning && (
              <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Scan actif
              </div>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Instructions mobile */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <p className="text-blue-700 text-xs leading-relaxed">
              📱 Placez le QR code dans le cadre blanc
              <br />
              🔍 Assurez-vous que l'éclairage est suffisant
              <br />
              📐 Tenez votre téléphone à environ 20cm
            </p>
          </div>

          {/* Contrôles mobiles */}
          <div className="flex gap-2">
            <Button
              onClick={retryScanning}
              disabled={isScanning}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
            
            {devices.length > 1 && (
              <Button
                onClick={switchCamera}
                disabled={isScanning}
                variant="outline"
                className="px-3 h-10"
              >
                <Camera className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              onClick={onClose}
              variant="outline"
              className="px-3 h-10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
