
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface KYCSubmissionData {
  documentFile: File;
  documentType: string;
  selfieFile: File;
}

export const useKYCVerification = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadFile = async (file: File, bucket: string, fileName: string) => {
    try {
      const filePath = `${user?.id}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Erreur upload vers ${bucket}:`, error);
      throw error;
    }
  };

  const submitKYCVerification = async ({ 
    documentFile, 
    documentType, 
    selfieFile 
  }: KYCSubmissionData) => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      setIsSubmitting(true);

      // Upload des fichiers
      const documentFileName = `document-${Date.now()}.${documentFile.name.split('.').pop()}`;
      const selfieFileName = `selfie-${Date.now()}.${selfieFile.name.split('.').pop()}`;

      const [documentUrl, selfieUrl] = await Promise.all([
        uploadFile(documentFile, 'kyc-documents', documentFileName),
        uploadFile(selfieFile, 'kyc-selfies', selfieFileName)
      ]);

      // Créer l'enregistrement de vérification KYC
      const { data, error } = await supabase
        .from('kyc_verifications')
        .insert({
          user_id: user.id,
          status: 'pending',
          id_document_url: documentUrl,
          id_document_type: documentType,
          selfie_url: selfieUrl,
          verification_provider: 'manual'
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour le statut KYC dans le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'pending',
          requires_kyc: true 
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('Demande de vérification soumise avec succès');
      return data;

    } catch (error: any) {
      console.error('Erreur soumission KYC:', error);
      toast.error(error.message || 'Erreur lors de la soumission');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkKYCStatus = async () => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erreur vérification statut KYC:', error);
      return null;
    }
  };

  return {
    submitKYCVerification,
    checkKYCStatus,
    isSubmitting
  };
};
