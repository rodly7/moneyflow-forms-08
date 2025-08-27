
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Camera, CheckCircle, Zap } from 'lucide-react';

interface VerificationReviewStepProps {
  documentFile: File | null;
  documentType: string;
  selfieFile: File | null;
  onPrevious: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

const VerificationReviewStep = ({
  documentFile,
  documentType,
  selfieFile,
  onPrevious,
  onSubmit,
  isSubmitting
}: VerificationReviewStepProps) => {
  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'carte_identite': return 'Carte d\'identité';
      case 'passeport': return 'Passeport';
      case 'permis_conduire': return 'Permis de conduire';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Vérification Instantanée</h3>
          <Zap className="h-5 w-5 text-yellow-500" />
        </div>
        <p className="text-gray-600 text-sm">
          Vos documents seront vérifiés et approuvés automatiquement !
        </p>
      </div>

      {/* Résumé des documents */}
      <div className="space-y-4">
        {/* Document d'identité */}
        <Card className="p-4">
          <div className="flex items-start space-x-4">
            <FileText className="h-8 w-8 text-blue-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-medium mb-1">Document d'identité</h4>
              <p className="text-sm text-gray-600 mb-2">
                {getDocumentTypeLabel(documentType)}
              </p>
              {documentFile && (
                <div className="grid grid-cols-1 gap-2">
                  <img
                    src={URL.createObjectURL(documentFile)}
                    alt="Document d'identité"
                    className="max-w-48 rounded border"
                  />
                  <p className="text-xs text-gray-500">
                    {documentFile.name} - {(documentFile.size / 1024 / 1024).toFixed(2)} Mo
                  </p>
                </div>
              )}
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        </Card>

        {/* Selfie */}
        <Card className="p-4">
          <div className="flex items-start space-x-4">
            <Camera className="h-8 w-8 text-green-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-medium mb-1">Photo selfie</h4>
              <p className="text-sm text-gray-600 mb-2">
                Photo de vérification d'identité
              </p>
              {selfieFile && (
                <div className="grid grid-cols-1 gap-2">
                  <img
                    src={URL.createObjectURL(selfieFile)}
                    alt="Selfie"
                    className="max-w-32 rounded border"
                  />
                  <p className="text-xs text-gray-500">
                    {(selfieFile.size / 1024 / 1024).toFixed(2)} Mo
                  </p>
                </div>
              )}
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Informations sur la vérification rapide */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-green-600" />
          <h4 className="font-medium text-green-800">Vérification Automatique :</h4>
        </div>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• ✅ Approbation instantanée de votre dossier</li>
          <li>• ✅ Accès immédiat à toutes les fonctionnalités</li>
          <li>• ✅ Aucune attente nécessaire</li>
          <li>• ✅ Données sécurisées et conformes au RGPD</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          Précédent
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting}
          className="min-w-32 bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Approbation...
            </span>
          ) : (
            <span className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Approuver Instantanément
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VerificationReviewStep;
