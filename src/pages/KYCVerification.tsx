
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import KYCVerificationForm from "@/components/kyc/KYCVerificationForm";

const KYCVerification = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Vérification d'identité</h1>
            <p className="text-muted-foreground">
              Complétez votre vérification d'identité pour accéder à toutes les fonctionnalités
            </p>
          </div>
        </div>

        <KYCVerificationForm />
      </div>
    </div>
  );
};

export default KYCVerification;
