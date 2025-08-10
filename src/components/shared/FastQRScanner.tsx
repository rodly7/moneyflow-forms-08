import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library';
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Flashlight, FlashlightOff, CreditCard } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { v4 as uuidv4 } from 'uuid';

interface FastQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
  variant?: 'default' | 'payment';
  onMyCard?: () => void;
}

const FastQRScanner = ({ isOpen, onClose, onScanSuccess, title = "Scanner QR Code", variant = "default", onMyCard }: FastQRScannerProps) => {
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerId = useRef(uuidv4()).current;
  const isMobile = useIsMobile();

  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  const initializeScanner = useCallback(async () => {
    if (!isOpen) return;

    codeReader.current = new BrowserMultiFormatReader();

    try {
      await codeReader.current.getVideoInputDevices();
      codeReader.current.decodeFromInputVideoDevice(undefined, `qr-reader-${scannerId}`).then((result) => {
        if (result) {
          try {
            const parsedData = JSON.parse(result.getText());
            if (parsedData && parsedData.userId && parsedData.fullName && parsedData.phone) {
              onScanSuccess(parsedData);
              onClose();
            } else {
              setError("QR Code invalide");
            }
          } catch (e) {
            setError("Format QR Code incorrect");
          }
        }
      }).catch((err: any) => {
        if (err instanceof NotFoundException) {
          setError("Aucun QR code détecté");
        } else if (err instanceof ChecksumException) {
          setError("Erreur de checksum");
        } else if (err instanceof FormatException) {
          setError("Format incorrect du QR code");
        } else {
          setError("Erreur inconnue lors de la lecture du QR code");
        }
      });
    } catch (e: any) {
      setError("Impossible d'accéder à la caméra.");
    }

    return () => {
      codeReader.current?.reset();
    };
  }, [isOpen, onClose, onScanSuccess, scannerId]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      initializeScanner();
    } else {
      codeReader.current?.reset();
      setError(null);
    }
  }, [isOpen, initializeScanner]);

  useEffect(() => {
    if (codeReader.current) {
      if (torchEnabled) {
        codeReader.current.setTorch(true).catch(e => {
          setError("Impossible d'activer la torche");
          setTorchEnabled(false);
        });
      } else {
        codeReader.current.setTorch(false);
      }
    }
  }, [torchEnabled]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md mx-auto p-2 ${useIsMobile() ? 'w-[95vw] h-[90vh]' : 'w-full h-full'} bg-black/95 border-none`}>
        <div className="flex flex-col h-full">
          {/* Header adapté mobile */}
          <div className={`flex items-center justify-between ${useIsMobile() ? 'p-2 mb-2' : 'p-4 mb-4'} text-white`}>
            <h2 className={`${useIsMobile() ? 'text-lg' : 'text-xl'} font-bold`}>{title}</h2>
            <Button
              variant="ghost"
              size={useIsMobile() ? "sm" : "default"}
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className={`${useIsMobile() ? 'w-5 h-5' : 'w-6 h-6'}`} />
            </Button>
          </div>

          {/* Zone de scan adaptée */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className={`relative ${useIsMobile() ? 'w-64 h-64' : 'w-80 h-80'} mb-4`}>
              <div 
                id={`qr-reader-${scannerId}`}
                className="w-full h-full rounded-lg overflow-hidden"
              />
              
              {/* Overlay avec coins */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full border-2 border-white/30 rounded-lg relative">
                  {/* Coins */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                </div>
              </div>
            </div>

            {/* Instructions adaptées mobile */}
            <div className={`text-center ${useIsMobile() ? 'px-2' : 'px-4'} text-white`}>
              <p className={`${useIsMobile() ? 'text-sm' : 'text-base'} mb-2`}>
                {variant === 'payment' ? 'Scannez le QR code pour payer' : 'Placez le QR code dans le cadre'}
              </p>
              {useIsMobile() && (
                <p className="text-xs text-white/70">
                  Tenez votre appareil stable
                </p>
              )}
            </div>

            {/* Boutons adaptés mobile */}
            <div className={`flex gap-2 mt-4 ${useIsMobile() ? 'px-2' : ''}`}>
              {variant === 'payment' && onMyCard && (
                <Button
                  onClick={onMyCard}
                  variant="outline"
                  size={useIsMobile() ? "sm" : "default"}
                  className={`bg-white/10 text-white border-white/30 hover:bg-white/20 ${useIsMobile() ? 'text-xs px-3' : ''}`}
                >
                  <CreditCard className={`${useIsMobile() ? 'w-4 h-4 mr-1' : 'w-5 h-5 mr-2'}`} />
                  Ma carte
                </Button>
              )}
              
              <Button
                onClick={() => setTorchEnabled(!torchEnabled)}
                variant="outline"
                size={useIsMobile() ? "sm" : "default"}
                className={`bg-white/10 text-white border-white/30 hover:bg-white/20 ${useIsMobile() ? 'text-xs px-3' : ''}`}
              >
                {torchEnabled ? (
                  <FlashlightOff className={`${useIsMobile() ? 'w-4 h-4' : 'w-5 h-5'}`} />
                ) : (
                  <Flashlight className={`${useIsMobile() ? 'w-4 h-4' : 'w-5 h-5'}`} />
                )}
              </Button>
            </div>

            {/* Statut d'erreur adapté mobile */}
            {error && (
              <div className={`mt-4 ${useIsMobile() ? 'mx-2' : 'mx-4'} p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-center`}>
                <p className={`text-red-200 ${useIsMobile() ? 'text-sm' : ''}`}>{error}</p>
                <Button
                  onClick={initializeScanner}
                  variant="outline"
                  size="sm"
                  className={`mt-2 bg-red-500/20 text-red-200 border-red-500/30 hover:bg-red-500/30 ${useIsMobile() ? 'text-xs' : ''}`}
                >
                  Réessayer
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FastQRScanner;
