
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, RotateCcw, Check } from "lucide-react";

interface SelfieCaptureProps {
  onSelfieCapture: (file: File) => void;
  isUploading?: boolean;
}

const SelfieCapture = ({ onSelfieCapture, isUploading }: SelfieCaptureProps) => {
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setSelfieImage(imageData);
        
        // Convertir en file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            onSelfieCapture(file);
          }
        }, 'image/jpeg', 0.8);
        
        // Arrêter la caméra
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setIsCapturing(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelfieImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      onSelfieCapture(file);
    }
  };

  const retake = () => {
    setSelfieImage(null);
    startCamera();
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Photo de profil (Selfie)</h3>
          <p className="text-sm text-muted-foreground">
            Prenez une photo claire de votre visage ou téléchargez une photo existante
          </p>
          
          <div className="relative mx-auto w-64 h-64 border-2 border-dashed border-border rounded-lg overflow-hidden">
            {selfieImage ? (
              <img
                src={selfieImage}
                alt="Selfie"
                className="w-full h-full object-cover"
              />
            ) : isCapturing ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Camera className="h-12 w-12 mb-2" />
                <p className="text-sm">Aucune photo</p>
              </div>
            )}
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {!selfieImage && !isCapturing && (
              <>
                <Button onClick={startCamera} disabled={isUploading}>
                  <Camera className="h-4 w-4 mr-2" />
                  Prendre photo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Télécharger photo
                </Button>
              </>
            )}
            
            {isCapturing && (
              <Button onClick={capturePhoto} disabled={isUploading}>
                <Check className="h-4 w-4 mr-2" />
                Capturer
              </Button>
            )}
            
            {selfieImage && (
              <Button onClick={retake} variant="outline" disabled={isUploading}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reprendre
              </Button>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SelfieCapture;
