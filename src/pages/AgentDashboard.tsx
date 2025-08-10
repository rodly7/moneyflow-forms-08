
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AgentMobileDashboard from "@/components/agent/AgentMobileDashboard";

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

  // Interface spécialement conçue pour les agents
  return <AgentMobileDashboard />;
};

export default AgentDashboardPage;
