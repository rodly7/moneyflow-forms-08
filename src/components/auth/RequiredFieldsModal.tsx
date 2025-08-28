
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import IdCardUploadSection from '@/components/profile/IdCardUploadSection';
import { useAuthSession } from '@/hooks/useAuthSession';
import { storageService } from '@/services/storageService';

interface RequiredFieldsModalProps {
  isOpen: boolean;
  profile: any;
  onComplete: () => void;
}

const RequiredFieldsModal = ({ isOpen, profile, onComplete }: RequiredFieldsModalProps) => {
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreviewUrl, setIdCardPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { handlePermissionError } = useAuthSession();

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
    
    if (!idCardFile) {
      toast.error('Veuillez ajouter la photo de votre pièce d\'identité');
      return;
    }

    setIsLoading(true);

    try {
      let idCardUrl = null;

      // Upload de la pièce d'identité
      if (idCardFile) {
        try {
          idCardUrl = await storageService.uploadFile(idCardFile, 'id-cards', profile.id, 'id-card');
          console.log('Upload carte identité réussi, URL:', idCardUrl);
        } catch (error) {
          console.error('Erreur upload carte identité:', error);
          
          // Gérer spécifiquement les erreurs de permissions
          if (error.message?.includes('permissions') || error.message?.includes('reconnecter')) {
            const canRetry = await handlePermissionError();
            if (canRetry) {
              toast.error('Erreur de permissions corrigée. Veuillez réessayer.');
              return;
            } else {
              return; // L'utilisateur sera redirigé
            }
          }
          
          toast.error(error.message || 'Erreur lors de l\'upload de la carte d\'identité');
          return;
        }
      }

      // Mise à jour du profil
      console.log('Mise à jour du profil avec:', {
        id_card_url: idCardUrl,
      });

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
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
          <IdCardUploadSection 
            idCardPreviewUrl={idCardPreviewUrl}
            onFileChange={handleIdCardFileChange}
          />

          <div className="text-sm text-muted-foreground">
            <p>Cette photo est obligatoire pour continuer à utiliser l'application.</p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !idCardFile}
          >
            {isLoading ? 'Mise à jour...' : 'Valider'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequiredFieldsModal;
