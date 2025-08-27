
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Camera, CheckCircle } from 'lucide-react';

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
        <h3 className="text-lg font-semibold mb-2">Vérifiez vos documents</h3>
        <p className="text-gray-600 text-sm">
          Vérifiez que tous les documents sont corrects avant de soumettre votre demande.
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

      {/* Informations importantes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Informations importantes :</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Vos documents seront vérifiés dans les 24-48h</li>
          <li>• Vous recevrez une notification du résultat</li>
          <li>• En cas de rejet, vous pourrez soumettre de nouveaux documents</li>
          <li>• Vos données sont sécurisées et conformes au RGPD</li>
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
          className="min-w-32"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Soumission...
            </span>
          ) : (
            'Soumettre ma demande'
          )}
        </Button>
      </div>
    </div>
  );
};

export default VerificationReviewStep;
