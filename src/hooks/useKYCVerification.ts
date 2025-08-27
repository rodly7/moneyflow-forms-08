
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface KYCStatus {
  status: 'not_started' | 'pending' | 'approved' | 'rejected';
  selfie_url?: string;
  id_card_url?: string;
  verification_notes?: string;
  verified_at?: string;
}

export const useKYCVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const checkKYCStatus = async (userId: string): Promise<KYCStatus | null> => {
    try {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking KYC status:', error);
        return null;
      }
      
      if (data) {
        return {
          status: data.status as 'not_started' | 'pending' | 'approved' | 'rejected',
          selfie_url: data.selfie_url,
          id_card_url: data.id_card_url,
          verification_notes: data.verification_notes,
          verified_at: data.verified_at
        };
      }
      
      return { status: 'not_started' };
    } catch (error) {
      console.error('Error checking KYC status:', error);
      return null;
    }
  };

  const uploadKYCDocument = async (
    file: File, 
    documentType: 'selfie' | 'id_card',
    userId: string
  ): Promise<string | null> => {
    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${documentType}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      const { data: urlData } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading KYC document:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const submitKYCVerification = async (
    userId: string,
    selfieUrl: string,
    idCardUrl: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('identity_verifications')
        .upsert({
          user_id: userId,
          selfie_url: selfieUrl,
          id_card_url: idCardUrl,
          status: 'pending'
        });
      
      if (error) {
        console.error('Error submitting KYC:', error);
        throw error;
      }
      
      // Mettre à jour le profil
      await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('id', userId);
      
      toast({
        title: "Vérification soumise",
        description: "Vos documents ont été soumis pour vérification"
      });
      
      return true;
    } catch (error) {
      console.error('Error submitting KYC verification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre la vérification",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkKYCStatus,
    uploadKYCDocument,
    submitKYCVerification,
    isLoading,
    isUploading
  };
};
