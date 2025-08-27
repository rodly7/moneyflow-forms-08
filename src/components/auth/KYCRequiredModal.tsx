
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield } from 'lucide-react';
import KYCVerificationModal from '@/components/kyc/KYCVerificationModal';

interface KYCRequiredModalProps {
  isOpen: boolean;
  onStartKYC: () => void;
}

const KYCRequiredModal = ({ isOpen, onStartKYC }: KYCRequiredModalProps) => {
  const [showKYCModal, setShowKYCModal] = React.useState(false);

  const handleStartKYC = () => {
    setShowKYCModal(true);
  };

  return (
    <>
      <Dialog open={isOpen && !showKYCModal} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Vérification d'identité requise
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <Shield className="mx-auto h-16 w-16 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Sécurisez votre compte
              </h3>
              <p className="text-gray-600 text-sm">
                Pour continuer à utiliser SendFlow en toute sécurité, 
                nous devons vérifier votre identité.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Ce dont vous aurez besoin :</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Une pièce d'identité valide (carte, passeport)</li>
                <li>• Votre smartphone ou caméra pour un selfie</li>
                <li>• 2-3 minutes de votre temps</li>
              </ul>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>
                Vos données sont sécurisées et conformes au RGPD. 
                La vérification est obligatoire pour tous les utilisateurs.
              </p>
            </div>

            <Button 
              onClick={handleStartKYC}
              className="w-full"
              size="lg"
            >
              Commencer la vérification
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <KYCVerificationModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        onComplete={onStartKYC}
        mandatory={true}
      />
    </>
  );
};

export default KYCRequiredModal;
