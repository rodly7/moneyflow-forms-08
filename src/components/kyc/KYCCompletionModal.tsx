
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
import { AlertCircle, FileText } from 'lucide-react';
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
      if (!status.hasDocuments) {
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
      isVerified: false, // Les documents sont juste sauvegardés
      verifiedAt: undefined,
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
                <FileText className="w-5 h-5 text-blue-500" />
                Documents d'identité requis
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700">
                    Complétez votre profil avec vos documents
                  </p>
                  <p className="text-blue-600 mt-1">
                    Pour finaliser votre inscription, veuillez télécharger 
                    votre pièce d'identité et une photo de profil.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => setShowKYCForm(true)}
                  className="w-full"
                >
                  Ajouter mes documents
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
