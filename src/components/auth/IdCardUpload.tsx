
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IdCardUploadProps {
  onFileUploaded: (url: string) => void;
  disabled?: boolean;
}

const IdCardUpload = ({ onFileUploaded, disabled = false }: IdCardUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille du fichier (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La photo de la carte d'identité ne doit pas dépasser 5 Mo",
        variant: "destructive"
      });
      return;
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Type de fichier invalide",
        description: "Veuillez sélectionner une image (PNG, JPG, JPEG)",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `id_cards/${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      setPreviewUrl(publicUrl);
      onFileUploaded(publicUrl);

      toast({
        title: "Photo uploadée",
        description: "La photo de votre carte d'identité a été uploadée avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'uploader la photo. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="idCardPhoto">Photo de la pièce d'identité *</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        {previewUrl ? (
          <div className="space-y-2">
            <img 
              src={previewUrl} 
              alt="Pièce d'identité" 
              className="w-full h-32 object-cover rounded-md"
            />
            <div className="flex items-center justify-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={disabled || isUploading}
                onClick={() => document.getElementById('idCardPhoto')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Changer la photo
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <FileText className="h-8 w-8 text-gray-400 mb-2" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled || isUploading}
              onClick={() => document.getElementById('idCardPhoto')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Upload en cours..." : "Ajouter une photo"}
            </Button>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 5MB</p>
          </div>
        )}
        <Input 
          id="idCardPhoto" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />
      </div>
    </div>
  );
};

export default IdCardUpload;
