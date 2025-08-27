
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";
import SelfieCapture from "./SelfieCapture";
import IDDocumentUpload from "./IDDocumentUpload";
import { useKYCVerification, KYCStatus } from "@/hooks/useKYCVerification";

const KYCVerificationForm = () => {
  const { user, profile } = useAuth();
  const { checkKYCStatus, uploadKYCDocument, submitKYCVerification, isLoading, isUploading } = useKYCVerification();
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadKYCStatus();
    }
  }, [user?.id]);

  const loadKYCStatus = async () => {
    if (!user?.id) return;
    
    const status = await checkKYCStatus(user.id);
    setKycStatus(status);
    
    if (status?.selfie_url) setSelfieUrl(status.selfie_url);
    if (status?.id_card_url) setIdCardUrl(status.id_card_url);
  };

  const handleSelfieCapture = (file: File) => {
    setSelfieFile(file);
  };

  const handleDocumentUpload = (file: File) => {
    setIdCardFile(file);
  };

  const handleSubmit = async () => {
    if (!user?.id || !selfieFile || !idCardFile) return;

    try {
      // Upload selfie
      const uploadedSelfieUrl = await uploadKYCDocument(selfieFile, 'selfie', user.id);
      if (!uploadedSelfieUrl) return;

      // Upload ID card
      const uploadedIdCardUrl = await uploadKYCDocument(idCardFile, 'id_card', user.id);
      if (!uploadedIdCardUrl) return;

      // Submit verification
      const success = await submitKYCVerification(user.id, uploadedSelfieUrl, uploadedIdCardUrl);
      if (success) {
        await loadKYCStatus();
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Votre identité a été vérifiée avec succès';
      case 'pending':
        return 'Vos documents sont en cours de vérification';
      case 'rejected':
        return 'Votre vérification a été rejetée. Veuillez soumettre de nouveaux documents.';
      default:
        return 'Veuillez compléter votre vérification d\'identité';
    }
  };

  if (!kycStatus) {
    return <div>Chargement...</div>;
  }

  if (kycStatus.status === 'approved') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">Identité vérifiée</h3>
            <p className="text-muted-foreground">
              Votre identité a été vérifiée avec succès le{' '}
              {kycStatus.verified_at && new Date(kycStatus.verified_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(kycStatus.status)}
            Vérification d'identité (KYC)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getStatusMessage(kycStatus.status)}
            </AlertDescription>
          </Alert>

          {kycStatus.status === 'rejected' && kycStatus.verification_notes && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Raison du rejet:</strong> {kycStatus.verification_notes}
              </AlertDescription>
            </Alert>
          )}

          {(kycStatus.status === 'not_started' || kycStatus.status === 'rejected') && (
            <div className="space-y-6">
              <SelfieCapture 
                onSelfieCapture={handleSelfieCapture}
                isUploading={isUploading}
              />
              
              <IDDocumentUpload 
                onDocumentUpload={handleDocumentUpload}
                isUploading={isUploading}
              />
              
              <Button
                onClick={handleSubmit}
                disabled={!selfieFile || !idCardFile || isLoading || isUploading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Soumission en cours...' : 'Soumettre pour vérification'}
              </Button>
            </div>
          )}

          {kycStatus.status === 'pending' && (
            <div className="text-center py-8">
              <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Vérification en cours</h3>
              <p className="text-muted-foreground">
                Vos documents sont en cours d'examen. Vous recevrez une notification une fois la vérification terminée.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KYCVerificationForm;
