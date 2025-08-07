import { useState, useRef, useEffect } from "react";
import { QrCode, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BillData {
  serviceType: string;
  provider: string;
  accountNumber: string;
  amount?: string;
  country: string;
  dueDate?: string;
}

interface BillQRScannerProps {
  onScanSuccess: (billData: BillData) => void;
  onClose: () => void;
}

export const BillQRScanner = ({ onScanSuccess, onClose }: BillQRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Demander l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Caméra arrière de préférence
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Démarrer la détection automatique
        startQRDetection();
      }
    } catch (err) {
      console.error('Erreur d\'accès à la caméra:', err);
      setError('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startQRDetection = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const detectQR = () => {
      if (!isScanning || !video.videoWidth || !video.videoHeight) {
        if (isScanning) {
          requestAnimationFrame(detectQR);
        }
        return;
      }

      // Ajuster la taille du canvas à la vidéo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dessiner l'image de la vidéo sur le canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Obtenir les données d'image
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      try {
        // Utiliser la bibliothèque qr-scanner ou jsQR si disponible
        // Pour cette démo, nous simulerons la détection
        // En production, vous devriez utiliser une vraie bibliothèque de détection QR
        
        // Simulation de détection QR - remplacer par une vraie bibliothèque
        // const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        // Pour les tests, nous utiliserons un délai simulé
        setTimeout(() => {
          // Simuler un QR code détecté avec des données de facture
          const simulatedQRData = "BILL:SENELEC:12345678:5000:electricity:Sénégal:2024-01-15";
          processQRData(simulatedQRData);
        }, 3000);

      } catch (err) {
        console.error('Erreur de détection QR:', err);
      }

      if (isScanning) {
        requestAnimationFrame(detectQR);
      }
    };

    detectQR();
  };

  const processQRData = (qrData: string) => {
    try {
      setScannedData(qrData);
      
      // Parser les données du QR code
      // Format attendu: "BILL:PROVIDER:ACCOUNT:AMOUNT:SERVICE:COUNTRY:DUEDATE"
      const parts = qrData.split(':');
      
      if (parts.length >= 6 && parts[0] === 'BILL') {
        const billData: BillData = {
          provider: parts[1],
          accountNumber: parts[2],
          amount: parts[3],
          serviceType: parts[4],
          country: parts[5],
          dueDate: parts[6] || undefined
        };

        // Valider les données
        if (billData.provider && billData.accountNumber && billData.serviceType) {
          stopScanning();
          onScanSuccess(billData);
        } else {
          setError('QR code invalide: données manquantes');
        }
      } else {
        setError('Format de QR code non reconnu pour les factures');
      }
    } catch (err) {
      console.error('Erreur de traitement du QR code:', err);
      setError('Erreur lors du traitement du QR code');
    }
  };

  // Nettoyer lors du démontage du composant
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scanner QR Facture
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isScanning ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Scannez le QR code de votre facture pour remplir automatiquement les informations
              </p>
              <Button onClick={startScanning} className="w-full">
                <QrCode className="h-4 w-4 mr-2" />
                Démarrer le scan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Overlay de visée */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg opacity-75">
                    <div className="w-full h-full border-4 border-transparent rounded-lg animate-pulse">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-white absolute top-2 left-2"></div>
                      <div className="w-6 h-6 border-t-2 border-r-2 border-white absolute top-2 right-2"></div>
                      <div className="w-6 h-6 border-b-2 border-l-2 border-white absolute bottom-2 left-2"></div>
                      <div className="w-6 h-6 border-b-2 border-r-2 border-white absolute bottom-2 right-2"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-sm text-gray-600">
                Pointez la caméra vers le QR code de votre facture
              </p>
              
              {scannedData && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                  <Check className="h-4 w-4" />
                  QR code détecté, traitement en cours...
                </div>
              )}
              
              <Button 
                variant="outline" 
                onClick={stopScanning}
                className="w-full"
              >
                Arrêter le scan
              </Button>
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>Format QR supporté:</p>
            <p className="font-mono bg-gray-100 p-1 rounded text-xs">
              BILL:PROVIDER:ACCOUNT:AMOUNT:SERVICE:COUNTRY
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};