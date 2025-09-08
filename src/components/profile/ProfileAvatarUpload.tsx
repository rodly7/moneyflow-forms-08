import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Upload, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileAvatarUploadProps {
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
}

const ProfileAvatarUpload: React.FC<ProfileAvatarUploadProps> = ({ 
  size = 'md',
  showUploadButton = true 
}) => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-32 w-32'
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const uploadAvatar = async (file: File) => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour uploader une photo",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    console.log('🚀 Début de l\'upload d\'avatar...');

    try {
      // Vérification de la taille du fichier
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("L'image ne doit pas dépasser 2 Mo");
      }

      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('📁 Upload vers:', filePath);

      // Upload du fichier
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('❌ Erreur upload:', error);
        throw error;
      }

      console.log('✅ Upload réussi:', data);

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;
      console.log('🖼️ URL de l\'avatar:', avatarUrl);

      // Mettre à jour le profil avec la nouvelle URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Erreur mise à jour profil:', updateError);
        throw updateError;
      }

      console.log('✅ Profil mis à jour avec succès');

      // Mettre à jour l'état local
      setPreviewUrl(avatarUrl);

      // Invalider les requêtes pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast({
        title: "Photo de profil mise à jour",
        description: "Votre photo de profil a été mise à jour avec succès"
      });

    } catch (error) {
      console.error('💥 Erreur complète:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour votre photo de profil",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📁 Fichier sélectionné:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    uploadAvatar(file);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40`}>
          <AvatarImage 
            src={previewUrl || undefined} 
            alt={profile?.full_name || 'Avatar'} 
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold">
            {profile?.full_name ? getInitials(profile.full_name) : <User className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>
        
        {showUploadButton && (
          <label 
            htmlFor="avatar-upload" 
            className="absolute -bottom-1 -right-1 bg-primary rounded-full p-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg hover:scale-110"
          >
            <Camera className="h-3 w-3 text-primary-foreground" />
          </label>
        )}
      </div>

      {showUploadButton && (
        <>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('avatar-upload')?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {previewUrl ? 'Changer la photo' : 'Ajouter une photo'}
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
};

export default ProfileAvatarUpload;