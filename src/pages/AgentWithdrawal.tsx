
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import MobileAgentWithdrawalForm from "@/components/agent/MobileAgentWithdrawalForm";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

const AgentWithdrawal = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();

  useEffect(() => {
    if (profile && profile.role !== 'agent') {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  if (!profile || profile.role !== 'agent') {
    return null;
  }

  // Utiliser toujours la version mobile optimisée
  return <MobileAgentWithdrawalForm />;
};

export default AgentWithdrawal;
