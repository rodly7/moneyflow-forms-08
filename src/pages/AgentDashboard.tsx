
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ResponsiveAgentDashboard from "@/components/agent/ResponsiveAgentDashboard";

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

  return <ResponsiveAgentDashboard />;
};

export default AgentDashboardPage;
