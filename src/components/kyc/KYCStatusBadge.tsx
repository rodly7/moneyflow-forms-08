
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface KYCStatusBadgeProps {
  status: string;
  className?: string;
}

const KYCStatusBadge = ({ status, className = '' }: KYCStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Vérifié',
          variant: 'default' as const,
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'pending':
        return {
          label: 'En attente',
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'rejected':
        return {
          label: 'Rejeté',
          variant: 'destructive' as const,
          icon: XCircle,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'requires_review':
        return {
          label: 'À réviser',
          variant: 'secondary' as const,
          icon: AlertTriangle,
          className: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      default:
        return {
          label: 'Non démarré',
          variant: 'outline' as const,
          icon: AlertTriangle,
          className: 'bg-gray-100 text-gray-600 border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className} flex items-center gap-1`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default KYCStatusBadge;
