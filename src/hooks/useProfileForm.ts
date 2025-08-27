
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileData {
  id: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  id_card_photo_url?: string;
}

export const useProfileForm = (profile: ProfileData) => {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);
  const [idCardPreviewUrl, setIdCardPreviewUrl] = useState<string | null>(profile?.id_card_photo_url || null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const ensureBucketsExist = async () => {
    try {
      // Vérifier et créer le bucket avatars si nécessaire
      const { data: avatarBucket, error: avatarBucketError } = await supabase.storage.getBucket('avatars');
      if (avatarBucketError && avatarBucketError.message.includes('not found')) {
        console.log('Création du bucket avatars...');
        const { error: createAvatarError } = await supabase.storage.createBucket('avatars', {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          fileSizeLimit: 2097152 // 2MB
        });
        if (createAvatarError) {
          console.log('Erreur création bucket avatars:', createAvatarError);
        }
      }

      // Vérifier et créer le bucket id-cards si nécessaire
      const { data: idCardBucket, error: idCardBucketError } = await supabase.storage.getBucket('id-cards');
      if (idCardBucketError && idCardBucketError.message.includes('not found')) {
        console.log('Création du bucket id-cards...');
        const { error: createIdCardError } = await supabase.storage.createBucket('id-cards', {
          public: false,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });
        if (createIdCardError) {
          console.log('Erreur création bucket id-cards:', createIdCardError);
        }
      }
    } catch (error) {
      console.log('Erreur lors de la vérification des buckets:', error);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    try {
      console.log(`Upload du fichier vers ${bucket}/${path}`);
      
      // Upload du fichier (avec upsert pour écraser s'il existe)
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Erreur upload:', error);
        throw error;
      }

      console.log('Upload réussi:', data);

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Erreur lors de l'upload vers ${bucket}:`, error);
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
      
      // S'assurer que les buckets existent
      await ensureBucketsExist();

      const updates: any = { 
        full_name: fullName.trim()
      };
      
      // Upload de l'avatar si un fichier est sélectionné
      if (avatarFile) {
        console.log('Upload de l\'avatar...');
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile.id}-avatar-${Date.now()}.${fileExt}`;
        
        try {
          const avatarUrl = await uploadFile(avatarFile, 'avatars', fileName);
          updates.avatar_url = avatarUrl;
          console.log('Avatar uploadé:', avatarUrl);
        } catch (error) {
          console.error('Erreur upload avatar:', error);
          toast({
            title: "Erreur",
            description: "Impossible d'uploader la photo de profil",
            variant: "destructive"
          });
          return;
        }
      }

      // Upload de la pièce d'identité si un fichier est sélectionné
      if (idCardFile) {
        console.log('Upload de la photo d\'identité...');
        const fileExt = idCardFile.name.split('.').pop();
        const fileName = `${profile.id}-idcard-${Date.now()}.${fileExt}`;
        
        try {
          const idCardUrl = await uploadFile(idCardFile, 'id-cards', fileName);
          updates.id_card_photo_url = idCardUrl;
          console.log('Photo d\'identité uploadée:', idCardUrl);
        } catch (error) {
          console.error('Erreur upload ID card:', error);
          toast({
            title: "Erreur",
            description: "Impossible d'uploader la photo d'identité",
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
        if (error.message.includes('storage')) {
          errorMessage = "Erreur lors de l'upload des fichiers";
        } else if (error.message.includes('profiles')) {
          errorMessage = "Erreur lors de la sauvegarde des informations";
        } else if (error.message.includes('permission')) {
          errorMessage = "Permissions insuffisantes";
        } else if (error.message.includes('RLS')) {
          errorMessage = "Problème d'autorisation d'accès";
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
