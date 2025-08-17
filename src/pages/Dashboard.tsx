
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import MobileDashboard from '@/components/mobile/MobileDashboard';

const Dashboard = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      // Redirection automatique selon le rôle
      switch (profile.role) {
        case 'agent':
          navigate('/agent-dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/main-admin-dashboard', { replace: true });
          break;
        case 'sub_admin':
          navigate('/sub-admin-dashboard', { replace: true });
          break;
        default:
          // Rester sur le dashboard utilisateur
          break;
      }
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si c'est un utilisateur normal, afficher le dashboard mobile
  if (profile?.role === 'user' || !profile?.role) {
    return <MobileDashboard />;
  }

  // Sinon, afficher un loader pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Redirection en cours...</p>
      </div>
    </div>
  );
};

export default Dashboard;
