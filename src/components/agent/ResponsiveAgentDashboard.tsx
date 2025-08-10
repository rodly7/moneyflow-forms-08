
import React from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import MobileAgentDashboard from "./MobileAgentDashboard";
import EnhancedAgentDashboard from "./EnhancedAgentDashboard";

const ResponsiveAgentDashboard = () => {
  const isMobile = useIsMobile(768);

  return isMobile ? <MobileAgentDashboard /> : <EnhancedAgentDashboard />;
};

export default ResponsiveAgentDashboard;
