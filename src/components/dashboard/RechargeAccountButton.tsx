
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import UserRechargeRequestModal from '@/components/user/UserRechargeRequestModal';

const RechargeAccountButton = () => {
  return (
    <UserRechargeRequestModal>
      <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
        <Wallet className="mr-2 h-4 w-4" />
        Recharger mon compte
      </Button>
    </UserRechargeRequestModal>
  );
};

export default RechargeAccountButton;
