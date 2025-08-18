
import { useEffect, useState } from "react";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SecurityService } from "@/services/securityService";

interface SecurityStatus {
  level: 'secure' | 'warning' | 'critical';
  message: string;
}

export const SecurityStatusIndicator = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    level: 'secure',
    message: 'Système sécurisé'
  });

  useEffect(() => {
    const checkSecurityStatus = async () => {
      try {
        // Check session validity
        const isSessionValid = await SecurityService.validateSession();
        
        if (!isSessionValid) {
          setSecurityStatus({
            level: 'warning',
            message: 'Session proche de l\'expiration'
          });
          return;
        }

        // Additional security checks can be added here
        setSecurityStatus({
          level: 'secure',
          message: 'Connexion sécurisée'
        });

      } catch (error) {
        setSecurityStatus({
          level: 'critical',
          message: 'Problème de sécurité détecté'
        });
      }
    };

    checkSecurityStatus();
    
    // Check every 5 minutes
    const interval = setInterval(checkSecurityStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (securityStatus.level) {
      case 'secure':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <Shield className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusVariant = () => {
    switch (securityStatus.level) {
      case 'secure':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
    }
  };

  return (
    <Badge variant={getStatusVariant()} className="flex items-center gap-1">
      {getStatusIcon()}
      <span className="text-xs">{securityStatus.message}</span>
    </Badge>
  );
};
