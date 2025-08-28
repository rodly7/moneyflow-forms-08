
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import IdCardUploadSection from '@/components/profile/IdCardUploadSection';
import SelfieUploadSection from '@/components/profile/SelfieUploadSection';
import { useAuthSession } from '@/hooks/useAuthSession';

interface RequiredFieldsModalProps {
  isOpen: boolean;
  profile: any;
  onComplete: () => void;
}

const RequiredFieldsModal = ({ isOpen, profile, onComplete }: RequiredFieldsModalProps) => {
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreviewUrl, setIdCardPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { handlePermissionError } = useAuthSession();

  const handleSelfieFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La photo selfie ne doit pas dépasser 5 Mo');
      return;
    }

    setSelfieFile(file);
    const objectUrl = URL.createObjectURL(file);
    setSelfiePreviewUrl(objectUrl);
  };

  const handleIdCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La photo de la pièce d\'identité ne doit pas dépasser 5 Mo');
      return;
    }

    setIdCardFile(file);
    const objectUrl = URL.createObjectURL(file);
    setIdCardPreviewUrl(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selfieFile || !idCardFile) {
      toast.error('Veuillez ajouter les deux photos obligatoires');
      return;
    }

    setIsLoading(true);

    try {
      let selfieUrl = null;
      let idCardUrl = null;

      // Upload de la photo selfie
      if (selfieFile) {
        const fileExt = selfieFile.name.split('.').pop();
        const fileName = `selfie-${Date.now()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;
        
        console.log('Tentative d\'upload du selfie:', filePath);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('selfies')
          .upload(filePath, selfieFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Erreur upload selfie:', uploadError);
          
          // Gérer spécifiquement les erreurs de permissions
          if (uploadError.message?.includes('row-level security') || 
              uploadError.message?.includes('permission') ||
              uploadError.message?.includes('policy')) {
            const canRetry = await handlePermissionError();
            if (canRetry) {
              toast.error('Erreur de permissions corrigée. Veuillez réessayer.');
              return;
            } else {
              return; // L'utilisateur sera redirigé
            }
          }
          
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('selfies')
          .getPublicUrl(uploadData.path);

        selfieUrl = publicUrl;
        console.log('Upload selfie réussi, URL:', selfieUrl);
      }

      // Upload de la pièce d'identité
      if (idCardFile) {
        const fileExt = idCardFile.name.split('.').pop();
        const fileName = `id-card-${Date.now()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;
        
        console.log('Tentative d\'upload du fichier:', filePath);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('id-cards')
          .upload(filePath, idCardFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Erreur upload:', uploadError);
          
          // Gérer spécifiquement les erreurs de permissions
          if (uploadError.message?.includes('row-level security') || 
              uploadError.message?.includes('permission') ||
              uploadError.message?.includes('policy')) {
            const canRetry = await handlePermissionError();
            if (canRetry) {
              toast.error('Erreur de permissions corrigée. Veuillez réessayer.');
              return;
            } else {
              return; // L'utilisateur sera redirigé
            }
          }
          
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('id-cards')
          .getPublicUrl(uploadData.path);

        idCardUrl = publicUrl;
        console.log('Upload réussi, URL:', idCardUrl);
      }

      // Mise à jour du profil
      console.log('Mise à jour du profil avec:', {
        selfie_url: selfieUrl,
        id_card_url: idCardUrl,
      });

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          selfie_url: selfieUrl,
          id_card_url: idCardUrl,
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Erreur mise à jour profil:', updateError);
        
        // Gérer les erreurs de permissions RLS
        if (updateError.message?.includes('row-level security') || 
            updateError.message?.includes('permission') ||
            updateError.message?.includes('policy')) {
          const canRetry = await handlePermissionError();
          if (canRetry) {
            toast.error('Erreur de permissions corrigée. Veuillez réessayer.');
            return;
          } else {
            return; // L'utilisateur sera redirigé
          }
        }
        
        throw updateError;
      }

      toast.success('Informations mises à jour avec succès');
      onComplete();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      let errorMessage = 'Erreur lors de la mise à jour des informations';
      
      if (error.message) {
        if (error.message.includes('not found')) {
          errorMessage = 'Erreur de configuration du stockage. Contactez l\'administrateur.';
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Informations obligatoires</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelfieUploadSection 
            selfiePreviewUrl={selfiePreviewUrl}
            onFileChange={handleSelfieFileChange}
          />

          <IdCardUploadSection 
            idCardPreviewUrl={idCardPreviewUrl}
            onFileChange={handleIdCardFileChange}
          />

          <div className="text-sm text-muted-foreground">
            <p>Ces photos sont obligatoires pour continuer à utiliser l'application.</p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !selfieFile || !idCardFile}
          >
            {isLoading ? 'Mise à jour...' : 'Valider'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequiredFieldsModal;
