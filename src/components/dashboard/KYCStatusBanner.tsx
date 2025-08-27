
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { useKYCVerification } from "@/hooks/useKYCVerification";

const KYCStatusBanner = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { checkKYCStatus } = useKYCVerification();
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadKYCStatus();
    }
  }, [user?.id]);

  const loadKYCStatus = async () => {
    if (!user?.id) return;
    
    try {
      const status = await checkKYCStatus(user.id);
      setKycStatus(status?.status || 'not_started');
    } catch (error) {
      console.error('Error loading KYC status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !kycStatus || kycStatus === 'approved') {
    return null;
  }

  const getAlertProps = () => {
    switch (kycStatus) {
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4" />,
          title: 'Vérification en cours',
          description: 'Vos documents sont en cours d\'examen. Vous recevrez une notification une fois la vérification terminée.',
          variant: 'default' as const,
          showButton: false
        };
      case 'rejected':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          title: 'Vérification rejetée',
          description: 'Votre vérification d\'identité a été rejetée. Veuillez soumettre de nouveaux documents.',
          variant: 'destructive' as const,
          showButton: true
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          title: 'Vérification d\'identité requise',
          description: 'Complétez votre vérification d\'identité pour accéder à toutes les fonctionnalités.',
          variant: 'default' as const,
          showButton: true
        };
    }
  };

  const alertProps = getAlertProps();

  return (
    <Alert variant={alertProps.variant} className="mb-6">
      {alertProps.icon}
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">{alertProps.title}</h4>
            <p className="text-sm mt-1">{alertProps.description}</p>
          </div>
          {alertProps.showButton && (
            <Button
              onClick={() => navigate('/kyc-verification')}
              size="sm"
              className="ml-4"
            >
              <FileText className="h-4 w-4 mr-2" />
              Vérifier maintenant
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default KYCStatusBanner;
