
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
          id_card_url: kycData.idCardUrl,
          selfie_url: kycData.selfieUrl,
          is_verified: kycData.isVerified || false,
          verified_at: kycData.verifiedAt || null,
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
        .select('is_verified, verified_at, id_card_url, selfie_url')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        isVerified: data?.is_verified || false,
        verificationScore: data?.is_verified ? 85 : 0, // Score simulé basé sur le statut
        verifiedAt: data?.verified_at,
        hasDocuments: !!(data?.id_card_url && data?.selfie_url)
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
