
import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface SelfieStepProps {
  selfieFile: File | null;
  onSelfieChange: (file: File | null) => void;
  onNext: () => void;
  onPrevious: () => void;
  canProceed: boolean;
}

const SelfieStep = ({
  selfieFile,
  onSelfieChange,
  onNext,
  onPrevious,
  canProceed
}: SelfieStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Erreur accès caméra:', error);
      toast.error('Impossible d\'accéder à la caméra');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        onSelfieChange(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  }, [onSelfieChange, stopCamera]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 10 Mo');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG ou WebP');
      return;
    }

    onSelfieChange(file);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Prenez un selfie</h3>
        <p className="text-gray-600 text-sm">
          Prenez une photo claire de votre visage pour vérifier votre identité.
        </p>
      </div>

      {!selfieFile && !showCamera && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={startCamera}
              className="h-24 flex-col space-y-2"
            >
              <Camera className="h-8 w-8" />
              <span>Prendre une photo</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-24 flex-col space-y-2"
            >
              <Upload className="h-8 w-8" />
              <span>Télécharger</span>
            </Button>
          </div>
        </div>
      )}

      {showCamera && (
        <Card className="p-4">
          <div className="space-y-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-w-md mx-auto rounded-lg bg-black"
            />
            <div className="flex justify-center space-x-4">
              <Button onClick={capturePhoto} className="flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Prendre la photo</span>
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                Annuler
              </Button>
            </div>
          </div>
        </Card>
      )}

      {selfieFile && (
        <Card className="border-green-200 bg-green-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Camera className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Selfie capturé</p>
                  <p className="text-sm text-green-600">
                    {(selfieFile.size / 1024 / 1024).toFixed(2)} Mo
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelfieChange(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-center">
              <img
                src={URL.createObjectURL(selfieFile)}
                alt="Selfie"
                className="max-w-64 max-h-64 mx-auto rounded-lg border"
              />
            </div>
          </div>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Conseils */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Conseils pour un bon selfie :</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Regardez directement vers la caméra</li>
          <li>• Visage bien éclairé et visible</li>
          <li>• Pas de lunettes de soleil</li>
          <li>• Expression neutre</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Précédent
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!canProceed}
          className="min-w-32"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
};

export default SelfieStep;
