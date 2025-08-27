
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useKYCVerification } from '@/hooks/useKYCVerification';
import { CheckCircle, Upload, Camera, AlertCircle, Clock, Shield } from 'lucide-react';
import DocumentUploadStep from './DocumentUploadStep';
import SelfieStep from './SelfieStep';
import VerificationReviewStep from './VerificationReviewStep';

interface KYCVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  mandatory?: boolean;
}

type KYCStep = 'document' | 'selfie' | 'review' | 'completed';

const KYCVerificationModal = ({ 
  isOpen, 
  onClose, 
  onComplete,
  mandatory = false 
}: KYCVerificationModalProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const { submitKYCVerification } = useKYCVerification();
  const [currentStep, setCurrentStep] = useState<KYCStep>('document');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vérifier si l'utilisateur a déjà un KYC en cours ou approuvé
  const hasKYCInProgress = profile?.kyc_status && 
    ['pending', 'requires_review', 'approved'].includes(profile.kyc_status);

  const steps = [
    { id: 'document', title: 'Pièce d\'identité', icon: Upload },
    { id: 'selfie', title: 'Selfie', icon: Camera },
    { id: 'review', title: 'Vérification', icon: CheckCircle }
  ];

  const getStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const progress = ((getStepIndex() + 1) / steps.length) * 100;

  const handleNextStep = () => {
    if (currentStep === 'document' && documentFile) {
      setCurrentStep('selfie');
    } else if (currentStep === 'selfie' && selfieFile) {
      setCurrentStep('review');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'selfie') {
      setCurrentStep('document');
    } else if (currentStep === 'review') {
      setCurrentStep('selfie');
    }
  };

  const handleClose = () => {
    // Permettre la fermeture si KYC n'est pas obligatoire ou déjà en cours
    if (!mandatory || hasKYCInProgress) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!documentFile || !selfieFile || !documentType) return;

    setIsSubmitting(true);
    try {
      const verificationData = {
        id_document_type: documentType,
        document_name: `${profile?.full_name || 'User'} ID`,
        document_number: `ID-${Date.now()}`,
        document_birth_date: profile?.birth_date || '1990-01-01',
        document_expiry_date: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 10 ans
      };

      await submitKYCVerification(
        verificationData,
        documentFile,
        selfieFile
      );

      // Attendre un peu et rafraîchir le profil
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshProfile();
      
      // Fermer le modal après soumission
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de la soumission KYC:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si l'utilisateur a déjà un KYC en cours, afficher le statut
  if (hasKYCInProgress) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {profile?.kyc_status === 'approved' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : profile?.kyc_status === 'pending' ? (
                <Clock className="h-5 w-5 text-blue-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              )}
              Vérification d'identité
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-8">
            <div className="mb-4">
              {profile?.kyc_status === 'pending' && (
                <>
                  <div className="relative">
                    <Clock className="mx-auto h-16 w-16 text-blue-500 mb-4" />
                    <Shield className="absolute top-0 right-1/3 h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Vérification en cours</h3>
                  <p className="text-gray-600 mb-4">
                    Votre dossier de vérification d'identité est en cours d'examen par un administrateur Sendflow. 
                    Vous pouvez continuer à utiliser l'application normalement.
                  </p>
                </>
              )}
              {profile?.kyc_status === 'requires_review' && (
                <>
                  <AlertCircle className="mx-auto h-16 w-16 text-orange-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Révision nécessaire</h3>
                  <p className="text-gray-600 mb-4">
                    Votre dossier nécessite une révision supplémentaire par un administrateur. 
                    Vous pouvez continuer à utiliser l'application en attendant.
                  </p>
                </>
              )}
              {profile?.kyc_status === 'approved' && (
                <>
                  <div className="relative">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <Shield className="absolute top-0 right-1/3 h-6 w-6 text-blue-500 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-green-600">Vérification approuvée !</h3>
                  <p className="text-gray-600 mb-4">
                    Votre identité a été vérifiée et approuvée par un administrateur Sendflow ! 
                    Vous avez maintenant accès à toutes les fonctionnalités.
                  </p>
                </>
              )}
            </div>
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              Continuer vers l'application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'document':
        return (
          <DocumentUploadStep
            documentFile={documentFile}
            documentType={documentType}
            onDocumentChange={setDocumentFile}
            onDocumentTypeChange={setDocumentType}
            onNext={handleNextStep}
            canProceed={!!documentFile && !!documentType}
          />
        );
      case 'selfie':
        return (
          <SelfieStep
            selfieFile={selfieFile}
            onSelfieChange={setSelfieFile}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
            canProceed={!!selfieFile}
          />
        );
      case 'review':
        return (
          <VerificationReviewStep
            documentFile={documentFile}
            documentType={documentType}
            selfieFile={selfieFile}
            onPrevious={handlePreviousStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Empêcher la fermeture uniquement si KYC est obligatoire ET pas encore soumis
          if (mandatory && !hasKYCInProgress) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Vérification d'identité KYC
          </DialogTitle>
          {mandatory && !hasKYCInProgress && (
            <p className="text-sm text-orange-600">
              Cette vérification est obligatoire pour continuer à utiliser l'application.
            </p>
          )}
          <p className="text-sm text-blue-600">
            Votre dossier sera examiné par un administrateur Sendflow avant approbation.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Étape {getStepIndex() + 1} sur {steps.length}</span>
              <span>{Math.round(progress)}% complété</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps indicator */}
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = getStepIndex() > index;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    rounded-full p-2 border-2 transition-colors
                    ${isActive ? 'border-primary bg-primary text-white' : ''}
                    ${isCompleted ? 'border-green-500 bg-green-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'border-gray-300 text-gray-400' : ''}
                  `}>
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <span className={`mt-1 text-xs ${isActive ? 'font-medium' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <Card>
            <CardContent className="p-6">
              {renderStep()}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KYCVerificationModal;
