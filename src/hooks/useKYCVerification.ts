
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KYCVerificationData {
  id_document_type: string;
  document_name: string;
  document_number: string;
  document_birth_date: string;
  document_expiry_date?: string;
  id_document_url?: string;
  selfie_url?: string;
  video_url?: string;
}

export const useKYCVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File, bucket: string, fileName: string) => {
    try {
      console.log(`Uploading file to bucket: ${bucket}, fileName: ${fileName}`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      console.log('File uploaded successfully, URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const submitKYCVerification = async (
    verificationData: KYCVerificationData,
    idDocumentFile?: File,
    selfieFile?: File,
    videoFile?: File
  ) => {
    setIsLoading(true);
    setUploadProgress(0);

    try {
      console.log('Starting KYC verification submission...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userId = user.id;
      console.log('User ID:', userId);
      
      let id_document_url = verificationData.id_document_url;
      let selfie_url = verificationData.selfie_url;
      let video_url = verificationData.video_url;

      // Upload ID document if provided
      if (idDocumentFile) {
        console.log('Uploading ID document...');
        setUploadProgress(25);
        const fileName = `${userId}/id-document-${Date.now()}.${idDocumentFile.name.split('.').pop()}`;
        id_document_url = await uploadFile(idDocumentFile, 'kyc-documents', fileName);
      }

      // Upload selfie if provided
      if (selfieFile) {
        console.log('Uploading selfie...');
        setUploadProgress(50);
        const fileName = `${userId}/selfie-${Date.now()}.${selfieFile.name.split('.').pop()}`;
        selfie_url = await uploadFile(selfieFile, 'kyc-selfies', fileName);
      }

      // Upload video if provided
      if (videoFile) {
        console.log('Uploading video...');
        setUploadProgress(75);
        const fileName = `${userId}/video-${Date.now()}.${videoFile.name.split('.').pop()}`;
        video_url = await uploadFile(videoFile, 'kyc-selfies', fileName);
      }

      setUploadProgress(90);
      console.log('Files uploaded successfully, inserting KYC record...');

      // Insert KYC verification record avec approbation automatique
      const kycData = {
        user_id: userId,
        id_document_type: verificationData.id_document_type,
        document_name: verificationData.document_name,
        document_number: verificationData.document_number,
        document_birth_date: verificationData.document_birth_date,
        document_expiry_date: verificationData.document_expiry_date || null,
        id_document_url,
        selfie_url,
        video_url,
        status: 'approved', // Approbation automatique pour une vérification rapide
        verified_at: new Date().toISOString()
      };

      console.log('Inserting KYC data:', kycData);

      const { data, error } = await supabase
        .from('kyc_verifications')
        .insert(kycData)
        .select()
        .single();

      if (error) {
        console.error('KYC insertion error:', error);
        throw error;
      }

      console.log('KYC record inserted successfully:', data);

      // Mettre à jour immédiatement le profil utilisateur avec un délai pour s'assurer que la transaction est terminée
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Updating user profile...');
      const profileUpdateData = {
        kyc_status: 'approved',
        kyc_completed_at: new Date().toISOString(),
        is_verified: true,
        verified_at: new Date().toISOString()
      };

      console.log('Profile update data:', profileUpdateData);

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId);

      if (profileError) {
        console.error('Erreur mise à jour profil:', profileError);
        throw profileError;
      }

      // Vérifier que la mise à jour a bien été effectuée
      const { data: updatedProfile, error: checkError } = await supabase
        .from('profiles')
        .select('kyc_status, is_verified')
        .eq('id', userId)
        .single();

      if (checkError) {
        console.error('Erreur vérification profil:', checkError);
      } else {
        console.log('Profil mis à jour:', updatedProfile);
      }

      setUploadProgress(100);
      toast.success('Vérification d\'identité approuvée instantanément !');
      
      return data;
    } catch (error) {
      console.error('Error submitting KYC verification:', error);
      toast.error(`Erreur lors de la soumission de la vérification: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const getKYCStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await (supabase as any)
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting KYC status:', error);
      return null;
    }
  };

  const updateKYCVerification = async (
    verificationId: string,
    updates: Partial<KYCVerificationData>
  ) => {
    try {
      const { data, error } = await (supabase as any)
        .from('kyc_verifications')
        .update(updates)
        .eq('id', verificationId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Vérification mise à jour avec succès');
      return data;
    } catch (error) {
      console.error('Error updating KYC verification:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  return {
    submitKYCVerification,
    getKYCStatus,
    updateKYCVerification,
    isLoading,
    uploadProgress
  };
};
