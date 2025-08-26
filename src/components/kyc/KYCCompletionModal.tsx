
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useKYCVerification } from '@/hooks/useKYCVerification';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Shield } from 'lucide-react';
import KYCVerificationStep from './KYCVerificationStep';

const KYCCompletionModal = () => {
  const { user } = useAuth();
  const { getKYCStatus, saveKYCData } = useKYCVerification();
  const [showModal, setShowModal] = useState(false);
  const [showKYCForm, setShowKYCForm] = useState(false);

  useEffect(() => {
    const checkKYCStatus = async () => {
      if (!user?.id) return;
      
      const status = await getKYCStatus(user.id);
      if (!status.isVerified && !status.hasDocuments) {
        setShowModal(true);
      }
    };

    checkKYCStatus();
  }, [user?.id, getKYCStatus]);

  const handleKYCComplete = async (kycData: {
    idCardUrl: string;
    selfieUrl: string;
    verificationScore: number;
  }) => {
    if (!user?.id) return;

    const success = await saveKYCData(user.id, {
      ...kycData,
      isVerified: kycData.verificationScore > 75,
      verifiedAt: kycData.verificationScore > 75 ? new Date().toISOString() : undefined,
    });

    if (success) {
      setShowModal(false);
    }
  };

  const handleSkip = () => {
    setShowModal(false);
    // Programmer un rappel dans 24h
    localStorage.setItem('kyc_reminder', (Date.now() + 24 * 60 * 60 * 1000).toString());
  };

  if (!showModal) return null;

  return (
    <Dialog open={showModal} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="max-w-md">
        {!showKYCForm ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                Vérification d'identité requise
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-700">
                    Votre compte nécessite une vérification d'identité
                  </p>
                  <p className="text-amber-600 mt-1">
                    Pour des raisons de sécurité et de conformité, veuillez compléter 
                    votre vérification KYC en téléchargeant votre pièce d'identité et un selfie.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => setShowKYCForm(true)}
                  className="w-full"
                >
                  Commencer la vérification
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSkip}
                  className="w-full"
                >
                  Rappeler plus tard
                </Button>
              </div>
            </div>
          </>
        ) : (
          <KYCVerificationStep 
            onComplete={handleKYCComplete}
            onSkip={handleSkip}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default KYCCompletionModal;
