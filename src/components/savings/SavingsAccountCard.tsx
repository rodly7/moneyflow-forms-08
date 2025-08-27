import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, Plus, Minus, Edit, Trash2, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface SavingsAccountCardProps {
  account: {
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
  };
  onDeposit: (accountId: any) => void;
  onWithdraw: (accountId: any) => void;
  onEdit: (accountId: any) => void;
  onDelete: (accountId: any) => void;
}

const SavingsAccountCard: React.FC<SavingsAccountCardProps> = ({
  account,
  onDeposit,
  onWithdraw,
  onEdit,
  onDelete,
}) => {
  const progress =
    account.target_amount > 0 ? (account.balance / account.target_amount) * 100 : 0;

  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <PiggyBank className="w-4 h-4" />
          {account.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">Solde actuel</span>
            <span className="font-bold text-sm">{formatCurrency(account.balance, "XAF")}</span>
          </div>
          {account.target_amount > 0 && (
            <>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">Objectif</span>
                <span className="font-medium text-xs">{formatCurrency(account.target_amount, "XAF")}</span>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button size="sm" variant="outline" onClick={() => onDeposit(account)}>
            <Plus className="w-4 h-4 mr-2" />
            Déposer
          </Button>
          <Button size="sm" variant="outline" onClick={() => onWithdraw(account)}>
            <Minus className="w-4 h-4 mr-2" />
            Retirer
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(account)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(account)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsAccountCard;
