
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Check, AlertCircle, Loader2 } from "lucide-react";
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    score: number;
    isMatch: boolean;
  } | null>(null);

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

  const compareFaces = async (idCardUrl: string, selfieUrl: string): Promise<{ score: number; isMatch: boolean }> => {
    try {
      // Simuler la comparaison de visages - à remplacer par un vrai service
      // En production, utilisez AWS Rekognition, Azure Face API, ou Google Vision API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Score simulé entre 0 et 100
      const score = Math.random() * 40 + 60; // Score entre 60 et 100 pour simulation
      const isMatch = score > 75; // Seuil de confiance à 75%
      
      return { score, isMatch };
    } catch (error) {
      console.error('Erreur lors de la comparaison:', error);
      throw new Error('Échec de la vérification automatique');
    }
  };

  const handleVerification = async () => {
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
      
      setIsUploading(false);
      setIsVerifying(true);
      
      // Comparaison des visages
      const comparisonResult = await compareFaces(idCardUrl, selfieUrl);
      setVerificationResult(comparisonResult);
      setIsVerifying(false);
      
      if (comparisonResult.isMatch) {
        toast({
          title: "Vérification réussie",
          description: `Documents vérifiés avec succès (Score: ${comparisonResult.score.toFixed(1)}%)`,
        });
        
        onComplete({
          idCardUrl,
          selfieUrl,
          verificationScore: comparisonResult.score
        });
      } else {
        toast({
          title: "Vérification échouée",
          description: `Les documents ne correspondent pas (Score: ${comparisonResult.score.toFixed(1)}%)`,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Erreur KYC:', error);
      setIsUploading(false);
      setIsVerifying(false);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification",
        variant: "destructive"
      });
    }
  };

  const isProcessing = isUploading || isVerifying;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Camera className="w-5 h-5" />
          Vérification d'identité (KYC)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Téléchargez votre pièce d'identité et prenez un selfie pour vérifier votre compte
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

        {/* Résultat de vérification */}
        {verificationResult && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            verificationResult.isMatch 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {verificationResult.isMatch ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <div>
              <p className="font-medium">
                {verificationResult.isMatch ? 'Vérification réussie' : 'Vérification échouée'}
              </p>
              <p className="text-sm">
                Score de correspondance: {verificationResult.score.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="space-y-2">
          <Button 
            onClick={handleVerification}
            className="w-full"
            disabled={!idCardFile || !selfieFile || isProcessing}
          >
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isUploading ? "Téléchargement..." : 
             isVerifying ? "Vérification en cours..." : 
             "Vérifier les documents"}
          </Button>
          
          {onSkip && (
            <Button 
              variant="outline" 
              onClick={onSkip}
              className="w-full"
              disabled={isProcessing}
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
