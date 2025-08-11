
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AgentDashboard from "@/components/agent/AgentDashboard";

const ResponsiveAgentDashboardPage = () => {
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

  return <AgentDashboard />;
};

export default ResponsiveAgentDashboardPage;
