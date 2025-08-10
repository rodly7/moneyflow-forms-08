
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import MobileDashboard from "@/components/mobile/MobileDashboard";

const AgentDashboardPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && profile.role !== 'agent') {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  if (!profile || profile.role !== 'agent') {
    return null;
  }

  // Utiliser directement le MobileDashboard pour les agents
  return <MobileDashboard />;
};

export default AgentDashboardPage;
