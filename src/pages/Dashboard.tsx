
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
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
    <Layout>
      <h1>Tableau de bord</h1>
      {profile && (
        <div>
          <p>Bienvenue, {profile.full_name} !</p>
          <p>Votre rôle: {profile.role}</p>
        </div>
      )}
      
      {/* Modal KYC pour les utilisateurs existants */}
      <KYCCompletionModal />
    </Layout>
  );
};

export default Dashboard;
