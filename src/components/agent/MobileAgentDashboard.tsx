
import React, { memo } from "react";
import AgentDashboard from "./AgentDashboard";

const MobileAgentDashboard = memo(() => {
  return (
    <div className="agent-mobile-interface">
      <AgentDashboard />
    </div>
  );
});

MobileAgentDashboard.displayName = 'MobileAgentDashboard';

export default MobileAgentDashboard;
