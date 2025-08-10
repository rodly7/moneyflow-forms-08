
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import MobileAgentDashboard from "@/components/agent/MobileAgentDashboard";

const MobileAgentDashboardPage = () => {
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

  return <MobileAgentDashboard />;
};

export default MobileAgentDashboardPage;
