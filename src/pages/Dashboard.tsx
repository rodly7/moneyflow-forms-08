
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import KYCCompletionModal from "@/components/kyc/KYCCompletionModal";

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
        {profile && (
          <div className="mb-6">
            <p className="text-lg">Bienvenue, {profile.full_name} !</p>
            <p className="text-muted-foreground">Votre rôle: {profile.role}</p>
          </div>
        )}
        
        {/* Modal KYC pour les utilisateurs existants */}
        <KYCCompletionModal />
      </div>
    </div>
  );
};

export default Dashboard;
