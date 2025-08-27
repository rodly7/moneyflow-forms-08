
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Check, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface KYCVerificationStepProps {
  onComplete: (kycData: {
    idCardUrl: string;
    selfieUrl: string;
    verificationScore: number;
  }) => void;
  onSkip?: () => void;
}

const KYCVerificationStep = ({ onComplete, onSkip }: KYCVerificationStepProps) => {
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const idCardInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La pièce d'identité ne doit pas dépasser 5 Mo",
        variant: "destructive"
      });
      return;
    }

    setIdCardFile(file);
    const objectUrl = URL.createObjectURL(file);
    setIdCardPreview(objectUrl);
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "Le selfie ne doit pas dépasser 2 Mo",
        variant: "destructive"
      });
      return;
    }

    setSelfieFile(file);
    const objectUrl = URL.createObjectURL(file);
    setSelfiePreview(objectUrl);
  };

  const uploadFile = async (file: File, bucket: string, fileName: string) => {
    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!idCardFile || !selfieFile) {
      toast({
        title: "Documents manquants",
        description: "Veuillez télécharger votre pièce d'identité et votre selfie",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      const timestamp = Date.now();
      const idCardFileName = `kyc-id-${timestamp}.${idCardFile.name.split('.').pop()}`;
      const selfieFileName = `kyc-selfie-${timestamp}.${selfieFile.name.split('.').pop()}`;
      
      // Upload des fichiers
      const idCardUrl = await uploadFile(idCardFile, 'kyc-documents', idCardFileName);
      const selfieUrl = await uploadFile(selfieFile, 'kyc-documents', selfieFileName);
      
      toast({
        title: "Documents sauvegardés",
        description: "Vos documents ont été téléchargés avec succès",
      });
      
      onComplete({
        idCardUrl,
        selfieUrl,
        verificationScore: 0 // Pas de vérification automatique
      });
      
    } catch (error) {
      console.error('Erreur KYC:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du téléchargement",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Camera className="w-5 h-5" />
          Documents d'identité (KYC)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Téléchargez votre pièce d'identité et prenez un selfie pour compléter votre profil
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Pièce d'identité */}
        <div className="space-y-2">
          <Label>Pièce d'identité (Carte d'identité ou Passeport)</Label>
          <div 
            className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors
              ${idCardPreview ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary'}`}
            onClick={() => idCardInputRef.current?.click()}
          >
            {idCardPreview ? (
              <div className="relative">
                <img 
                  src={idCardPreview} 
                  alt="Pièce d'identité" 
                  className="w-full h-32 object-cover rounded-md"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400 py-4">
                <Upload className="w-8 h-8 mb-2" />
                <p className="text-sm">Cliquez pour télécharger</p>
                <p className="text-xs">PNG, JPG jusqu'à 5MB</p>
              </div>
            )}
          </div>
          <Input 
            ref={idCardInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleIdCardChange}
          />
        </div>

        {/* Selfie */}
        <div className="space-y-2">
          <Label>Photo de profil (Selfie)</Label>
          <div className="flex justify-center">
            <Avatar 
              className="w-32 h-32 cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary" 
              onClick={() => selfieInputRef.current?.click()}
            >
              {selfiePreview ? (
                <AvatarImage src={selfiePreview} className="object-cover" />
              ) : (
                <AvatarFallback className="text-gray-400">
                  <Camera className="w-8 h-8" />
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          {selfiePreview && (
            <div className="flex justify-center">
              <div className="flex items-center text-xs text-green-600">
                <Check className="w-3 h-3 mr-1" />
                Selfie ajouté
              </div>
            </div>
          )}
          <Input 
            ref={selfieInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleSelfieChange}
          />
        </div>

        {/* Boutons d'action */}
        <div className="space-y-2">
          <Button 
            onClick={handleSubmit}
            className="w-full"
            disabled={!idCardFile || !selfieFile || isUploading}
          >
            {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isUploading ? "Téléchargement..." : "Sauvegarder les documents"}
          </Button>
          
          {onSkip && (
            <Button 
              variant="outline" 
              onClick={onSkip}
              className="w-full"
              disabled={isUploading}
            >
              Passer cette étape
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCVerificationStep;
