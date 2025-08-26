
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RechargeAccountButtonProps {
  children?: React.ReactNode;
}

const RechargeAccountButton: React.FC<RechargeAccountButtonProps> = ({ children }) => {
  const navigate = useNavigate();

  const handleRecharge = () => {
    navigate('/unified-deposit-withdrawal');
  };

  return (
    <Button 
      onClick={handleRecharge}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2"
    >
      <Plus className="w-5 h-5" />
      {children || 'Recharger le compte'}
    </Button>
  );
};

export default RechargeAccountButton;
