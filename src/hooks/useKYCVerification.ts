
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface KYCData {
  idCardUrl: string;
  selfieUrl: string;
  verificationScore: number;
  isVerified?: boolean;
  verifiedAt?: string;
}

export const useKYCVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveKYCData = async (userId: string, kycData: KYCData) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_id_card_url: kycData.idCardUrl,
          kyc_selfie_url: kycData.selfieUrl,
          kyc_verification_score: kycData.verificationScore,
          kyc_verified: kycData.isVerified || false,
          kyc_verified_at: kycData.verifiedAt || null,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "KYC enregistré",
        description: "Vos documents de vérification ont été sauvegardés",
      });

      return true;
    } catch (error) {
      console.error('Erreur sauvegarde KYC:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les données KYC",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getKYCStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('kyc_verified, kyc_verification_score, kyc_verified_at, kyc_id_card_url, kyc_selfie_url')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        isVerified: data?.kyc_verified || false,
        verificationScore: data?.kyc_verification_score || 0,
        verifiedAt: data?.kyc_verified_at,
        hasDocuments: !!(data?.kyc_id_card_url && data?.kyc_selfie_url)
      };
    } catch (error) {
      console.error('Erreur récupération statut KYC:', error);
      return {
        isVerified: false,
        verificationScore: 0,
        verifiedAt: null,
        hasDocuments: false
      };
    }
  };

  const requiresKYC = async (userId: string) => {
    const status = await getKYCStatus(userId);
    return !status.isVerified && !status.hasDocuments;
  };

  return {
    isLoading,
    saveKYCData,
    getKYCStatus,
    requiresKYC
  };
};
