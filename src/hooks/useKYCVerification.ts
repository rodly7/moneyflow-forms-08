
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { KYCVerificationRecord, KYCVerificationInsert } from '@/types/kyc';

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
        console.log('ID document uploaded:', id_document_url);
      }

      // Upload selfie if provided
      if (selfieFile) {
        console.log('Uploading selfie...');
        setUploadProgress(50);
        const fileName = `${userId}/selfie-${Date.now()}.${selfieFile.name.split('.').pop()}`;
        selfie_url = await uploadFile(selfieFile, 'kyc-selfies', fileName);
        console.log('Selfie uploaded:', selfie_url);
      }

      // Upload video if provided
      if (videoFile) {
        console.log('Uploading video...');
        setUploadProgress(75);
        const fileName = `${userId}/video-${Date.now()}.${videoFile.name.split('.').pop()}`;
        video_url = await uploadFile(videoFile, 'kyc-selfies', fileName);
        console.log('Video uploaded:', video_url);
      }

      setUploadProgress(90);
      console.log('Files uploaded successfully, inserting KYC record...');

      // Prepare KYC data for insertion - statut pending pour vérification manuelle
      const kycData: KYCVerificationInsert = {
        user_id: userId,
        id_document_type: verificationData.id_document_type,
        document_name: verificationData.document_name,
        document_number: verificationData.document_number,
        document_birth_date: verificationData.document_birth_date,
        document_expiry_date: verificationData.document_expiry_date || undefined,
        id_document_url,
        selfie_url,
        video_url,
        status: 'pending' // Toujours en attente pour vérification manuelle par admin
      };

      console.log('Inserting KYC data:', kycData);

      // Direct insert into kyc_verifications table
      const { data: kycRecord, error: kycError } = await (supabase as any)
        .from('kyc_verifications')
        .insert(kycData)
        .select('*')
        .single();

      if (kycError) {
        console.error('KYC insertion error:', kycError);
        throw new Error(`Erreur lors de l'insertion KYC: ${kycError.message}`);
      }

      console.log('KYC record inserted successfully:', kycRecord);

      // Update profile - mettre le statut KYC en pending pour attendre l'approbation
      console.log('Updating user profile...');
      const profileUpdateData = {
        kyc_status: 'pending', // En attente d'approbation par l'administrateur
        kyc_completed_at: new Date().toISOString(),
        is_verified: false, // Pas encore vérifié
        verified_at: null // Pas de vérification automatique
      };

      console.log('Profile update data:', profileUpdateData);

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId);

      if (profileError) {
        console.error('Erreur mise à jour profil:', profileError);
        throw new Error(`Erreur mise à jour profil: ${profileError.message}`);
      }

      // Verify profile update
      let profileUpdated = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Vérification profil - tentative ${attempt}/3`);
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        
        const { data: updatedProfile, error: checkError } = await supabase
          .from('profiles')
          .select('kyc_status, is_verified')
          .eq('id', userId)
          .single();

        if (checkError) {
          console.error(`Erreur vérification profil (tentative ${attempt}):`, checkError);
        } else {
          console.log(`Profil vérifié (tentative ${attempt}):`, updatedProfile);
          if (updatedProfile.kyc_status === 'pending') {
            profileUpdated = true;
            break;
          }
        }
      }

      if (!profileUpdated) {
        console.warn('Le profil n\'a pas été mis à jour correctement après 3 tentatives');
      }

      setUploadProgress(100);
      toast.success('Vérification d\'identité soumise avec succès ! En attente d\'approbation par un administrateur.');
      
      return kycRecord;
    } catch (error: any) {
      console.error('Error submitting KYC verification:', error);
      toast.error(`Erreur lors de la soumission de la vérification: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const getKYCStatus = async (): Promise<KYCVerificationRecord | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Direct query to kyc_verifications table
      const { data, error } = await (supabase as any)
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error getting KYC status:', error);
        return null;
      }

      return data as KYCVerificationRecord | null;
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
