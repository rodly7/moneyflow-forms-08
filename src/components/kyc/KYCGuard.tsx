
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useKYCVerification } from "@/hooks/useKYCVerification";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText } from "lucide-react";

interface KYCGuardProps {
  children: React.ReactNode;
  requireKYC?: boolean;
}

const KYCGuard = ({ children, requireKYC = true }: KYCGuardProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { checkKYCStatus } = useKYCVerification();
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkUserKYCStatus();
  }, [user?.id]);

  const checkUserKYCStatus = async () => {
    if (!user?.id || !requireKYC) {
      setIsChecking(false);
      return;
    }

    try {
      const status = await checkKYCStatus(user.id);
      setKycStatus(status?.status || 'not_started');
    } catch (error) {
      console.error('Error checking KYC status:', error);
      setKycStatus('not_started');
    } finally {
      setIsChecking(false);
    }
  };

  const navigateToKYC = () => {
    navigate('/kyc-verification');
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Si KYC n'est pas requis ou si l'utilisateur est déjà vérifié, afficher le contenu
  if (!requireKYC || !user || kycStatus === 'approved') {
    return <>{children}</>;
  }

  // Si on est déjà sur la page KYC, afficher le contenu
  if (location.pathname === '/kyc-verification') {
    return <>{children}</>;
  }

  // Sinon, afficher l'alerte KYC
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
      <div className="max-w-md mx-auto mt-20">
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Vérification d'identité requise</h3>
                <p className="text-sm">
                  Pour des raisons de sécurité et de conformité, vous devez compléter votre vérification d'identité avant d'accéder à cette fonctionnalité.
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Vous devrez fournir :</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Une photo de votre pièce d'identité (carte ou passeport)</li>
                  <li>• Un selfie pour vérifier votre identité</li>
                </ul>
              </div>
              
              <Button onClick={navigateToKYC} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Compléter la vérification
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default KYCGuard;
