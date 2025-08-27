
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import IdCardUploadSection from '@/components/profile/IdCardUploadSection';

interface RequiredFieldsModalProps {
  isOpen: boolean;
  profile: any;
  onComplete: () => void;
}

const RequiredFieldsModal = ({ isOpen, profile, onComplete }: RequiredFieldsModalProps) => {
  const [birthDate, setBirthDate] = useState('');
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreviewUrl, setIdCardPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ensureBucketExists = async () => {
    try {
      const { data: bucket, error } = await supabase.storage.getBucket('id-cards');
      if (error && error.message.includes('not found')) {
        console.log('Création du bucket id-cards...');
        const { error: createError } = await supabase.storage.createBucket('id-cards', {
          public: false,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });
        if (createError) {
          console.log('Erreur création bucket:', createError);
        }
      }
    } catch (error) {
      console.log('Erreur lors de la vérification du bucket:', error);
    }
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
    
    if (!birthDate || !idCardFile) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);

    try {
      // S'assurer que le bucket existe
      await ensureBucketExists();

      let idCardUrl = null;

      // Upload de la pièce d'identité
      if (idCardFile) {
        const fileExt = idCardFile.name.split('.').pop();
        const fileName = `${profile.id}-id-card-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('id-cards')
          .upload(fileName, idCardFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Erreur upload:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('id-cards')
          .getPublicUrl(uploadData.path);

        idCardUrl = publicUrl;
      }

      // Mise à jour du profil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          birth_date: birthDate,
          id_card_url: idCardUrl,
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Erreur mise à jour profil:', updateError);
        throw updateError;
      }

      toast.success('Informations mises à jour avec succès');
      onComplete();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour des informations: ' + (error.message || 'Erreur inconnue'));
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
          <div className="space-y-2">
            <Label htmlFor="birthDate">Date de naissance *</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
          </div>

          <IdCardUploadSection 
            idCardPreviewUrl={idCardPreviewUrl}
            onFileChange={handleIdCardFileChange}
          />

          <div className="text-sm text-gray-600">
            <p>Ces informations sont obligatoires pour continuer à utiliser l'application.</p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !birthDate || !idCardFile}
          >
            {isLoading ? 'Mise à jour...' : 'Valider'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequiredFieldsModal;
