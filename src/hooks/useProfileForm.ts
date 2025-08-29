
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/hooks/useAuthSession";

interface ProfileData {
  id: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  id_card_url?: string;
}

export const useProfileForm = (profile: ProfileData) => {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);
  const [idCardPreviewUrl, setIdCardPreviewUrl] = useState<string | null>(profile?.id_card_url || null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handlePermissionError } = useAuthSession();

  const uploadFile = async (file: File, bucket: string, fileName: string) => {
    try {
      console.log(`Upload du fichier vers ${bucket}/${fileName}`);
      
      // Créer le chemin avec l'ID utilisateur pour respecter les politiques RLS
      const filePath = `${profile.id}/${fileName}`;
      
      // Upload du fichier (avec upsert pour écraser s'il existe)
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Erreur upload:', error);
        
        // Gérer spécifiquement les erreurs de permissions
        if (error.message?.includes('row-level security') || 
            error.message?.includes('permission') ||
            error.message?.includes('policy')) {
          const canRetry = await handlePermissionError();
          if (canRetry) {
            throw new Error('Erreur de permissions corrigée. Veuillez réessayer.');
          } else {
            throw new Error('Session expirée. Vous allez être redirigé vers la connexion.');
          }
        }
        
        throw error;
      }

      console.log('Upload réussi:', data);

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Erreur lors de l'upload vers ${bucket}:`, error);
      
      // Gestion spécifique des erreurs de bucket
      if (error.message && error.message.includes('not found')) {
        throw new Error(`Le stockage ${bucket} n'est pas configuré. Contactez l'administrateur.`);
      }
      
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom complet est requis",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log('Début de la mise à jour du profil...');

      const updates: any = { 
        full_name: fullName.trim()
      };
      
      // Upload de l'avatar si un fichier est sélectionné
      if (avatarFile) {
        console.log('Upload de l\'avatar...');
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatar-${Date.now()}.${fileExt}`;
        
        try {
          const avatarUrl = await uploadFile(avatarFile, 'avatars', fileName);
          updates.avatar_url = avatarUrl;
          console.log('Avatar uploadé:', avatarUrl);
        } catch (error) {
          console.error('Erreur upload avatar:', error);
          toast({
            title: "Erreur",
            description: error.message || "Impossible d'uploader la photo de profil",
            variant: "destructive"
          });
          return;
        }
      }

      // Upload de la pièce d'identité si un fichier est sélectionné
      if (idCardFile) {
        console.log('Upload de la photo d\'identité...');
        const fileExt = idCardFile.name.split('.').pop();
        const fileName = `id-card-${Date.now()}.${fileExt}`;
        
        try {
          const idCardUrl = await uploadFile(idCardFile, 'id-cards', fileName);
          updates.id_card_url = idCardUrl;
          console.log('Photo d\'identité uploadée:', idCardUrl);
        } catch (error) {
          console.error('Erreur upload ID card:', error);
          toast({
            title: "Erreur",
            description: error.message || "Impossible d'uploader la photo d'identité",
            variant: "destructive"
          });
          return;
        }
      }

      console.log('Mise à jour des données du profil...', updates);

      // Mettre à jour le profil dans la base de données
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        
        // Gérer les erreurs de permissions RLS
        if (error.message?.includes('row-level security') || 
            error.message?.includes('permission') ||
            error.message?.includes('policy')) {
          const canRetry = await handlePermissionError();
          if (!canRetry) {
            return; // L'utilisateur sera redirigé
          }
          throw new Error('Erreur de permissions corrigée. Veuillez réessayer.');
        }
        
        throw error;
      }

      console.log('Profil mis à jour avec succès');

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès"
      });

      // Invalider le cache pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
    } catch (error) {
      console.error('Erreur complète:', error);
      
      let errorMessage = "Impossible de mettre à jour votre profil";
      
      if (error instanceof Error) {
        if (error.message.includes('Session expirée')) {
          errorMessage = error.message;
        } else if (error.message.includes('permissions corrigée')) {
          errorMessage = error.message;
        } else if (error.message.includes('storage')) {
          errorMessage = "Erreur lors de l'upload des fichiers";
        } else if (error.message.includes('profiles')) {
          errorMessage = "Erreur lors de la sauvegarde des informations";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage + ". Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    fullName,
    setFullName,
    avatarFile,
    setAvatarFile,
    idCardFile,
    setIdCardFile,
    isUploading,
    previewUrl,
    setPreviewUrl,
    idCardPreviewUrl,
    setIdCardPreviewUrl,
    handleSubmit,
    toast
  };
};
