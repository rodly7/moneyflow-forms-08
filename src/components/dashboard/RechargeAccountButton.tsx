
import React, { useState } from 'react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        className={`${fullWidth ? 'w-full' : ''} ${className}`}
        onClick={handleOpenModal}
      >
        {showIcon && <Wallet className="w-4 h-4 mr-2" />}
        Recharger mon compte
      </Button>
      
      <AccountRechargeModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </>
  );
};

export default RechargeAccountButton;
