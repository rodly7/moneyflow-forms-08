import { useState, useEffect, useCallback } from 'react';
import { Camera, X, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode.react';

interface OptimizedQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
}

const OptimizedQRScanner = ({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  title = "Scanner QR Code" 
}: OptimizedQRScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [showTestQR, setShowTestQR] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualData, setManualData] = useState({ userId: '', fullName: '', phone: '' });

  const { isMobile, isIOS, isAndroid } = useDeviceDetection();
  const qrCodeRegionId = "optimized-qr-reader-region";

  // Configuration PWA optimisée selon l'appareil
  const getPWAOptimizedConfig = useCallback(() => {
    const baseConfig = {
      fps: isMobile ? 30 : 60,
      qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
        const percentage = isMobile ? 0.7 : 0.5;
        const size = Math.min(viewfinderWidth, viewfinderHeight) * percentage;
        return { width: size, height: size };
      },
      aspectRatio: 1.0,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      },
      rememberLastUsedCamera: true,
      supportedScanTypes: [0], // QR_CODE uniquement
    };

    // Configuration spécifique PWA mobile
    if (isMobile) {
      return {
        ...baseConfig,
        videoConstraints: {
          facingMode: { ideal: "environment" },
          width: { ideal: isIOS ? 1920 : 1280 },
          height: { ideal: isIOS ? 1080 : 720 },
          frameRate: { ideal: 30 }
        }
      };
    }

    // Configuration desktop
    return {
      ...baseConfig,
      videoConstraints: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 60 }
      }
    };
  }, [isMobile, isIOS]);

  const initializeCameras = useCallback(async () => {
    try {
      console.log('🎥 Initialisation des caméras (PWA)...');
      
      // Demander les permissions d'abord
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          console.log('✅ Permissions caméra accordées');
        } catch (permError) {
          console.error('❌ Permissions caméra refusées:', permError);
          setError('Permissions caméra requises. Veuillez autoriser l\'accès à la caméra.');
          return;
        }
      }

      const devices = await Html5Qrcode.getCameras();
      console.log('📷 Caméras disponibles:', devices);
      
      setCameras(devices);
      
      // Sélection intelligente de la caméra pour PWA
      let selectedDevice = devices[0];
      
      if (isMobile) {
        // Prioriser la caméra arrière sur mobile
        const backCamera = devices.find(camera => 
          camera.label?.toLowerCase().includes('back') || 
          camera.label?.toLowerCase().includes('rear') ||
          camera.label?.toLowerCase().includes('environment') ||
          camera.id.includes('1')
        );
        selectedDevice = backCamera || devices[devices.length - 1] || devices[0];
      }
      
      if (selectedDevice) {
        console.log('📱 Caméra sélectionnée:', selectedDevice.label || selectedDevice.id);
        setSelectedCamera(selectedDevice.id);
        await startScanning(selectedDevice.id);
      } else {
        setError('Aucune caméra disponible');
      }
    } catch (err: any) {
      console.error('❌ Erreur initialisation caméras:', err);
      setError(`Erreur: ${err.message}`);
    }
  }, [isMobile]);

  const startScanning = useCallback(async (cameraId: string) => {
    if (html5QrCode) {
      await stopScanning();
    }

    try {
      console.log('🚀 Démarrage scan PWA:', cameraId);
      setError(null);
      setIsScanning(true);

      const qrCodeInstance = new Html5Qrcode(qrCodeRegionId);
      setHtml5QrCode(qrCodeInstance);

      const config = getPWAOptimizedConfig();

      await qrCodeInstance.start(
        cameraId,
        config,
        (decodedText) => {
          console.log('🎉 QR détecté:', decodedText);
          handleQRCodeScan(decodedText);
        },
        (errorMessage) => {
          // Ignorer les erreurs normales de scan
          if (errorMessage && !errorMessage.includes('NotFoundException')) {
            console.log('ℹ️ Info scan:', errorMessage);
          }
        }
      );

      console.log('✅ Scanner PWA actif');
    } catch (err: any) {
      console.error('❌ Erreur démarrage scanner:', err);
      setError(`Erreur: ${err.message}`);
      setIsScanning(false);
    }
  }, [html5QrCode, getPWAOptimizedConfig]);

  const stopScanning = useCallback(async () => {
    if (html5QrCode) {
      try {
        console.log('🛑 Arrêt scanner PWA...');
        if (html5QrCode.getState() === 2) {
          await html5QrCode.stop();
        }
        html5QrCode.clear();
        console.log('✅ Scanner arrêté');
      } catch (err: any) {
        console.log('⚠️ Erreur arrêt:', err.message);
      }
      setHtml5QrCode(null);
    }
    setIsScanning(false);
  }, [html5QrCode]);

  const handleQRCodeScan = useCallback((decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    console.log('📄 QR scanné:', decodedText);
    
    try {
      const userData = JSON.parse(decodedText);
      if (userData.userId && userData.fullName && userData.phone) {
        console.log('✅ QR valide:', userData);
        onScanSuccess(userData);
        handleClose();
        return;
      }
    } catch (e) {
      console.log('❌ Pas JSON, traitement texte...');
    }

    // Traitement formats alternatifs
    if (decodedText.includes('userId') || decodedText.includes('user')) {
      onScanSuccess({
        userId: decodedText,
        fullName: 'Utilisateur QR',
        phone: 'Détecté QR'
      });
    } else if (decodedText.startsWith('+') || /^\d+$/.test(decodedText)) {
      onScanSuccess({
        userId: 'qr-' + Date.now(),
        fullName: 'Utilisateur QR',
        phone: decodedText
      });
    } else {
      onScanSuccess({
        userId: 'qr-' + Date.now(),
        fullName: decodedText.substring(0, 30),
        phone: 'QR: ' + decodedText.substring(0, 15)
      });
    }
    
    handleClose();
  }, [isProcessing, onScanSuccess]);

  const handleClose = useCallback(async () => {
    await stopScanning();
    setError(null);
    setIsProcessing(false);
    setShowManualInput(false);
    setShowTestQR(false);
    onClose();
  }, [stopScanning, onClose]);

  const handleManualSubmit = () => {
    if (manualData.fullName && manualData.phone) {
      onScanSuccess({
        userId: manualData.userId || 'manual-' + Date.now(),
        fullName: manualData.fullName,
        phone: manualData.phone
      });
      handleClose();
    }
  };

  const simulateQRScan = () => {
    const testData = {
      userId: 'dda64997-5dbd-4a5f-b049-cd68ed31fe40',
      fullName: 'Laureat NGANGOUE',
      phone: '+242065224790'
    };
    onScanSuccess(testData);
    handleClose();
  };

  // Initialisation lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      // Délai pour laisser le temps au dialog de s'ouvrir
      const timer = setTimeout(() => {
        initializeCameras();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopScanning();
    }
  }, [isOpen, initializeCameras, stopScanning]);

  const testQRData = JSON.stringify({
    userId: 'dda64997-5dbd-4a5f-b049-cd68ed31fe40',
    fullName: 'Laureat NGANGOUE',
    phone: '+242065224790'
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {title}
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
            <p className="text-sm">{error}</p>
            <Button 
              onClick={initializeCameras}
              size="sm"
              variant="destructive"
              className="mt-2"
            >
              Réessayer
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {/* Sélecteur de caméra */}
          {cameras.length > 1 && (
            <div>
              <label className="block text-sm font-medium mb-2">Caméra:</label>
              <select 
                value={selectedCamera} 
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Caméra ${camera.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Zone de scan */}
          <div className="relative">
            <div 
              id={qrCodeRegionId} 
              className="w-full min-h-[300px] border rounded-lg overflow-hidden bg-background"
            />
            
            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                <div className="text-center">
                  <Camera size={48} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Initialisation...</p>
                </div>
              </div>
            )}
          </div>

          {isScanning && (
            <div className="text-center">
              <p className="text-green-600 font-medium text-sm">
                📷 Scanner actif - Pointez vers un QR Code
              </p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => setShowManualInput(!showManualInput)}
              variant="outline"
              className="w-full"
            >
              📝 Saisie manuelle
            </Button>

            {showManualInput && (
              <div className="space-y-3 p-4 border rounded-lg">
                <input
                  type="text"
                  placeholder="Nom complet *"
                  value={manualData.fullName}
                  onChange={(e) => setManualData({...manualData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Téléphone *"
                  value={manualData.phone}
                  onChange={(e) => setManualData({...manualData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <Button 
                  onClick={handleManualSubmit}
                  disabled={!manualData.fullName || !manualData.phone}
                  className="w-full"
                >
                  Confirmer
                </Button>
              </div>
            )}

            <Button
              onClick={() => setShowTestQR(!showTestQR)}
              variant="outline"
              className="w-full"
            >
              <QrCode className="w-4 h-4 mr-2" />
              {showTestQR ? 'Masquer' : 'Afficher'} QR test
            </Button>

            {showTestQR && (
              <div className="bg-muted p-4 rounded-lg border">
                <div className="text-center mb-2">
                  <p className="text-sm font-medium">QR Code de test</p>
                </div>
                <div className="flex justify-center">
                  <QRCode 
                    value={testQRData} 
                    size={150}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>
            )}
            
            <Button
              onClick={simulateQRScan}
              variant="secondary"
              className="w-full"
            >
              🧪 Données test
            </Button>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>PWA optimisé :</strong> Scanner ultra-rapide pour mobile et desktop.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OptimizedQRScanner;