import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/lib/utils/currency";
import { 
  ArrowUpRight, 
  ArrowDownLeft,
  Plus,
  Send,
  Wallet,
  Eye,
  EyeOff,
  Bell,
  Settings,
  History,
  CreditCard,
  PiggyBank,
  Receipt
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CompactMobileDashboardProps {
  // Define any props here
}

const CompactMobileDashboard: React.FC<CompactMobileDashboardProps> = ({ /* props */ }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const formatBalanceDisplay = (balance: number) => {
    if (!isBalanceVisible) {
      return "••••••••";
    }
    return formatCurrency(balance, 'XAF');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {profile?.full_name || 'User'}
                </h1>
                <p className="text-sm text-gray-500">SendFlow</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Balance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Solde Principal
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleBalanceVisibility}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatBalanceDisplay(125000)}
            </div>
            <p className="text-sm text-gray-500">XAF</p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-blue-50 border-blue-200"
                onClick={() => navigate('/transfer')}
              >
                <ArrowUpRight className="w-6 h-6 text-blue-600" />
                <span className="text-sm">Transfert</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-green-50 border-green-200"
                onClick={() => navigate('/deposit')}
              >
                <ArrowDownLeft className="w-6 h-6 text-green-600" />
                <span className="text-sm">Dépôt</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-purple-50 border-purple-200"
                onClick={() => navigate('/withdrawal')}
              >
                <Send className="w-6 h-6 text-purple-600" />
                <span className="text-sm">Retrait</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-orange-50 border-orange-200"
                onClick={() => navigate('/savings')}
              >
                <Plus className="w-6 h-6 text-orange-600" />
                <span className="text-sm">Épargne</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-gray-50 border-gray-200"
                onClick={() => navigate('/transactions')}
              >
                <History className="w-5 h-5 text-gray-600" />
                <span className="text-sm">Transactions</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-gray-50 border-gray-200"
                onClick={() => navigate('/cards')}
              >
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="text-sm">Cartes</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-gray-50 border-gray-200"
                onClick={() => navigate('/savings')}
              >
                <PiggyBank className="w-5 h-5 text-gray-600" />
                <span className="text-sm">Épargnes</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-gray-50 border-gray-200"
                onClick={() => navigate('/receipts')}
              >
                <Receipt className="w-5 h-5 text-gray-600" />
                <span className="text-sm">Reçus</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-xs text-gray-500">Aujourd'hui</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-xs text-gray-500">Cette semaine</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-xs text-gray-500">Ce mois</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompactMobileDashboard;
