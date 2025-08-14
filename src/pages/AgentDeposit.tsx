
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { MobileAgentDepositForm } from "@/components/agent/MobileAgentDepositForm";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

const AgentDeposit = () => {
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
  return <MobileAgentDepositForm />;
};

export default AgentDeposit;
