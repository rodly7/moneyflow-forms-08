
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import AccountRechargeModal from '@/components/user/AccountRechargeModal';

interface RechargeAccountButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  fullWidth?: boolean;
}

const RechargeAccountButton = ({ 
  variant = 'default', 
  size = 'default', 
  className = '',
  showIcon = true,
  fullWidth = false
}: RechargeAccountButtonProps) => {
  return (
    <AccountRechargeModal>
      <Button 
        variant={variant} 
        size={size} 
        className={`${fullWidth ? 'w-full' : ''} ${className}`}
      >
        {showIcon && <Wallet className="w-4 h-4 mr-2" />}
        Recharger mon compte
      </Button>
    </AccountRechargeModal>
  );
};

export default RechargeAccountButton;
