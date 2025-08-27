
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Wallet, TrendingUp, Target, Edit, Trash2, Download } from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';

interface SavingsAccount {
  id: string;
  name: string;
  balance: number;
  target_amount: number;
  target_date: string | null;
  auto_deposit_amount: number | null;
  auto_deposit_frequency: string | null;
  interest_rate: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface SavingsAccountCardProps {
  account: SavingsAccount;
  onDeposit: (account: SavingsAccount) => void;
  onWithdraw: (account: SavingsAccount) => void;
  onEdit: (account: SavingsAccount) => void;
  onDelete: (account: SavingsAccount) => void;
}

const SavingsAccountCard = ({ account, onDeposit, onWithdraw, onEdit, onDelete }: SavingsAccountCardProps) => {
  const progressPercentage = account.target_amount ? (account.balance / account.target_amount) * 100 : 0;
  const canWithdraw = !account.target_amount || account.balance >= account.target_amount;
  const canDelete = !account.target_amount || account.balance < account.target_amount || account.balance === 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-800">{account.name}</span>
          <div className="flex items-center text-green-600 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            {account.interest_rate}%
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Solde actuel</span>
            <span className="font-medium">{formatCurrency(account.balance, 'XAF')}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Objectif</span>
            <span className="font-medium">{formatCurrency(account.target_amount, 'XAF')}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progression</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button 
              onClick={() => onDeposit(account)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Déposer
            </Button>
            
            <Button 
              onClick={() => onWithdraw(account)}
              variant="outline" 
              size="sm"
              className="flex-1"
              disabled={!canWithdraw}
              title={!canWithdraw ? "Atteignez votre objectif pour retirer" : ""}
            >
              <Download className="w-4 h-4 mr-2" />
              Retirer
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => onEdit(account)}
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            
            <Button 
              onClick={() => onDelete(account)}
              variant="outline" 
              size="sm"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={!canDelete}
              title={!canDelete ? "Atteignez votre objectif ou videz le compte pour supprimer" : ""}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsAccountCard;
