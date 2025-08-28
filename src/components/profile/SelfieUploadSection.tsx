import React, { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X } from "lucide-react";

interface SelfieUploadSectionProps {
  selfiePreviewUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect?: (file: File) => void;
}

const SelfieUploadSection = ({ selfiePreviewUrl, onFileChange, onFileSelect }: SelfieUploadSectionProps) => {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Erreur lors de l\'accès à la caméra:', error);
      alert('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Create a proper FileList
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        const fakeEvent = {
          target: { files: dataTransfer.files },
          currentTarget: { files: dataTransfer.files }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onFileChange(fakeEvent);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (showCamera) {
    return (
      <div className="space-y-2">
        <Label>Photo selfie</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-64 object-cover rounded-md"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2 mt-4 justify-center">
              <Button onClick={capturePhoto} className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Prendre la photo
              </Button>
              <Button variant="outline" onClick={stopCamera} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Annuler
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="selfiePhoto">Photo selfie</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        {selfiePreviewUrl ? (
          <div className="space-y-2">
            <img 
              src={selfiePreviewUrl} 
              alt="Photo selfie" 
              className="w-full h-32 object-cover rounded-md"
            />
            <div className="flex items-center justify-center gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={startCamera}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Reprendre
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleFileSelect}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choisir fichier
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Camera className="h-8 w-8 text-gray-400 mb-2" />
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={startCamera}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Prendre selfie
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleFileSelect}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choisir fichier
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Prenez un selfie ou choisissez un fichier</p>
          </div>
        )}
        <Input 
          ref={fileInputRef}
          id="selfiePhoto" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={onFileChange}
        />
      </div>
    </div>
  );
};

export default SelfieUploadSection;