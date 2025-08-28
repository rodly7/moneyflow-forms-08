import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { storageService } from "@/services/storageService";

interface QuickAvatarUploadProps {
  profile: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  onAvatarUpdated?: () => void;
}

const QuickAvatarUpload = ({ profile, onAvatarUpdated }: QuickAvatarUploadProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérification de la taille (2 Mo max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "L'image ne doit pas dépasser 2 Mo",
        variant: "destructive"
      });
      return;
    }

    // Vérification du type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Format non supporté",
        description: "Veuillez sélectionner une image (JPG, PNG, GIF)",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Aucun fichier sélectionné",
        description: "Veuillez d'abord sélectionner une image",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload du fichier vers Supabase Storage
      const avatarUrl = await storageService.uploadFile(selectedFile, 'avatars', profile.id, 'avatar');
      
      // Mise à jour du profil dans la base de données
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été mise à jour avec succès"
      });

      setIsOpen(false);
      onAvatarUpdated?.();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour votre photo de profil",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploading(true);

    try {
      // Supprimer la photo de profil
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      setPreviewUrl(null);
      setSelectedFile(null);
      
      toast({
        title: "Photo supprimée",
        description: "Votre photo de profil a été supprimée"
      });

      setIsOpen(false);
      onAvatarUpdated?.();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer votre photo de profil",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative group p-0 rounded-full"
          size="sm"
        >
          <Avatar className="h-28 w-28 ring-4 ring-white/30 group-hover:ring-white/50 transition-all duration-500 shadow-2xl group-hover:scale-105">
            <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
            <AvatarFallback className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-2xl font-bold">
              {profile.avatar_url ? getInitials(profile.full_name) : <User className="h-12 w-12" />}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-primary to-primary/80 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-xl">
            <Camera className="h-5 w-5 text-white" />
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier votre photo de profil</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Prévisualisation */}
          <div className="flex justify-center">
            <Avatar className="h-32 w-32 ring-4 ring-muted">
              <AvatarImage src={previewUrl || ""} alt={profile.full_name} />
              <AvatarFallback className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-2xl font-bold">
                {previewUrl ? getInitials(profile.full_name) : <User className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Sélection de fichier */}
          <div className="space-y-2">
            <Label htmlFor="avatar-file">Choisir une nouvelle photo</Label>
            <div className="flex items-center gap-2">
              <Input
                id="avatar-file"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('avatar-file')?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Formats acceptés : JPG, PNG, GIF (max 2 Mo)
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col gap-2">
            {selectedFile && (
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? "Mise à jour..." : "Sauvegarder"}
              </Button>
            )}
            
            {profile.avatar_url && (
              <Button 
                variant="outline" 
                onClick={handleRemovePhoto}
                disabled={isUploading}
                className="w-full"
              >
                Supprimer la photo actuelle
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
              className="w-full"
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAvatarUpload;