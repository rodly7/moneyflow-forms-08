
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, Check } from "lucide-react";

// Define Profile type to ensure we have the right properties
interface Profile {
  id: string;
  full_name: string | null;
  phone: string;
  country: string | null;
  address: string | null;
  balance: number;
  is_verified: boolean | null;
  selfie_url: string | null;
  id_card_url: string | null;
  verified_at: string | null;
  avatar_url: string | null;
}

const VerifyIdentity = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [idCardImage, setIdCardImage] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('is_verified, selfie_url, id_card_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (data) {
          // Handle potential missing fields if the columns don't exist yet
          const is_verified = data.is_verified === undefined ? false : data.is_verified;
          
          // If user is already verified, redirect to home
          if (is_verified) {
            navigate('/');
            return;
          }

          // If user has uploaded images before, show them
          if (data.selfie_url) {
            setSelfieImage(data.selfie_url);
          }
          if (data.id_card_url) {
            setIdCardImage(data.id_card_url);
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkVerificationStatus();
  }, [user, navigate]);

  const handleSelfieCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Fichier trop volumineux",
          description: "Le selfie ne doit pas dépasser 5 Mo",
          variant: "destructive"
        });
        return;
      }
      
      const objectUrl = URL.createObjectURL(file);
      setSelfieImage(objectUrl);
      setSelfieFile(file);
    }
  };

  const handleIdCardCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Fichier trop volumineux",
          description: "La pièce d'identité ne doit pas dépasser 5 Mo",
          variant: "destructive"
        });
        return;
      }
      
      const objectUrl = URL.createObjectURL(file);
      setIdCardImage(objectUrl);
      setIdCardFile(file);
    }
  };

  const uploadFile = async (file: File, bucket: string, fileName: string) => {
    try {
      // Create bucket if it doesn't exist
      const { data: existingBucket, error: bucketError } = await supabase
        .storage
        .getBucket(bucket);
        
      if (bucketError && bucketError.message.includes('not found')) {
        await supabase.storage.createBucket(bucket, {
          public: false,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5 * 1024 * 1024 // 5MB
        });
      }
      
      // Upload file
      const { error: uploadError, data } = await supabase
        .storage
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
    } catch (error) {
      console.error(`Error uploading ${bucket}:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selfieFile || !idCardFile) {
      toast({
        title: "Documents manquants",
        description: "Veuillez télécharger à la fois votre selfie et votre pièce d'identité",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Non connecté",
        description: "Vous devez être connecté pour vérifier votre identité",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      // Generate unique filenames
      const timestamp = Date.now();
      const selfieFileName = `${user.id}-selfie-${timestamp}.${selfieFile.name.split('.').pop()}`;
      const idCardFileName = `${user.id}-id-card-${timestamp}.${idCardFile.name.split('.').pop()}`;
      
      // Upload both files
      const selfieUrl = await uploadFile(selfieFile, 'identity-verification', selfieFileName);
      const idCardUrl = await uploadFile(idCardFile, 'identity-verification', idCardFileName);
      
      // Update user profile with the new fields
      const updateData: any = {
        is_verified: true, // Auto-approve for demo, in production this would be reviewed
        verified_at: new Date().toISOString()
      };
      
      // Only add these fields if they're not undefined
      if (selfieUrl) updateData.selfie_url = selfieUrl;
      if (idCardUrl) updateData.id_card_url = idCardUrl;
      
      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      toast({
        title: "Vérification réussie",
        description: "Votre identité a été vérifiée avec succès",
      });
      
      // Redirect to home page
      navigate('/');
      
    } catch (error) {
      console.error('Error uploading verification documents:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification de votre identité",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-4">
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-center">
              Vérification d'identité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center text-sm text-gray-500 mb-4">
                <p>Pour assurer la sécurité de votre compte et permettre les transactions, veuillez télécharger une photo de profil et une pièce d'identité.</p>
              </div>
              
              {/* Selfie Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="selfie" className="block text-center">
                  Photo de profil (format rond)
                </Label>
                <div className="flex flex-col items-center">
                  <Avatar className="h-32 w-32 cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary" 
                    onClick={() => selfieInputRef.current?.click()}>
                    {selfieImage ? (
                      <AvatarImage src={selfieImage} className="object-cover" alt="Selfie" />
                    ) : (
                      <AvatarFallback className="text-gray-400 flex flex-col items-center justify-center">
                        <Camera className="h-8 w-8 mb-1" />
                        <span className="text-xs">Cliquez</span>
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Input 
                    id="selfie" 
                    ref={selfieInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleSelfieCapture}
                  />
                  {selfieImage && (
                    <div className="mt-2 flex items-center text-xs text-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Photo sélectionnée
                    </div>
                  )}
                </div>
              </div>
              
              {/* ID Card Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="id-card" className="block text-center">
                  Pièce d'identité
                </Label>
                <div 
                  className={`border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center h-48 cursor-pointer
                  ${idCardImage ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary'}`}
                  onClick={() => idCardInputRef.current?.click()}
                >
                  {idCardImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={idCardImage} 
                        alt="ID Card" 
                        className="object-contain w-full h-full"
                      />
                      <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-tl-md">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Upload className="h-8 w-8 mb-2" />
                      <p className="text-sm">Cliquez pour télécharger votre pièce d'identité</p>
                      <p className="text-xs mt-1">(Carte d'identité, passeport, etc.)</p>
                    </div>
                  )}
                  <Input 
                    id="id-card" 
                    ref={idCardInputRef}
                    type="file"
                    className="hidden" 
                    accept="image/*"
                    onChange={handleIdCardCapture}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={!selfieFile || !idCardFile || uploading}
              >
                {uploading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Traitement...
                  </span>
                ) : "Vérifier mon identité"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyIdentity;
