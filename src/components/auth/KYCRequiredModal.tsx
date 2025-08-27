
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Zap } from 'lucide-react';
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

  const handleKYCComplete = () => {
    setShowKYCModal(false);
    // Fermer également le modal parent et actualiser
    onStartKYC();
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
              <div className="relative">
                <Shield className="mx-auto h-16 w-16 text-orange-500 mb-4" />
                <Zap className="absolute top-0 right-1/3 h-6 w-6 text-yellow-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Vérification Instantanée
              </h3>
              <p className="text-gray-600 text-sm">
                Vérifiez votre identité en moins de 2 minutes et obtenez 
                une approbation automatique immédiate !
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-green-800">Processus rapide :</h4>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Une pièce d'identité valide (carte, passeport)</li>
                <li>• Un selfie pour vérification</li>
                <li>• Approbation automatique instantanée</li>
                <li>• Accès immédiat à toutes les fonctionnalités</li>
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
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Commencer la vérification rapide
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <KYCVerificationModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        onComplete={handleKYCComplete}
        mandatory={true}
      />
    </>
  );
};

export default KYCRequiredModal;
