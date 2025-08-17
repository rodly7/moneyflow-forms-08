
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import AgentAuth from '@/pages/AgentAuth';
import ResponsiveAgentDashboard from '@/pages/ResponsiveAgentDashboard';
import MobileAgentDashboard from '@/pages/MobileAgentDashboard';
import NewAgentDashboard from '@/pages/NewAgentDashboard';
import SubAdminDashboard from '@/pages/SubAdminDashboard';
import MainAdminDashboard from '@/pages/MainAdminDashboard';
import SimpleMainAdminDashboard from '@/pages/SimpleMainAdminDashboard';
import Transfer from '@/pages/Transfer';
import Withdraw from '@/pages/Withdraw';
import QRCode from '@/pages/QRCode';
import Transactions from '@/pages/Transactions';
import AgentDeposit from '@/pages/AgentDeposit';
import AgentWithdrawal from '@/pages/AgentWithdrawal';
import AgentWithdrawalAdvanced from '@/pages/AgentWithdrawalAdvanced';
import AgentWithdrawalSimple from '@/pages/AgentWithdrawalSimple';
import AgentCommissionWithdrawal from '@/pages/AgentCommissionWithdrawal';
import AgentPerformanceDashboard from '@/pages/AgentPerformanceDashboard';
import AgentSettings from '@/pages/AgentSettings';
import AdminUsers from '@/pages/AdminUsers';
import AdminTreasury from '@/pages/AdminTreasury';
import AdminTransactionMonitor from '@/pages/AdminTransactionMonitor';
import AdminNotifications from '@/pages/AdminNotifications';
import AdminSettings from '@/pages/AdminSettings';
import BillPayments from '@/pages/BillPayments';
import MobileRecharge from '@/pages/MobileRecharge';
import PrepaidCards from '@/pages/PrepaidCards';
import Savings from '@/pages/Savings';
import Receipts from '@/pages/Receipts';
import QRPayment from '@/pages/QRPayment';
import Receive from '@/pages/Receive';
import ChangePassword from '@/pages/ChangePassword';
import VerifyIdentity from '@/pages/VerifyIdentity';
import Notifications from '@/pages/Notifications';
import UnifiedDepositWithdrawal from '@/pages/UnifiedDepositWithdrawal';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="auth" element={<Auth />} />
                <Route path="agent-auth" element={<AgentAuth />} />
                <Route path="agent-dashboard" element={<ResponsiveAgentDashboard />} />
                <Route path="mobile-agent-dashboard" element={<MobileAgentDashboard />} />
                <Route path="new-agent-dashboard" element={<NewAgentDashboard />} />
                <Route path="sub-admin-dashboard" element={<SubAdminDashboard />} />
                <Route path="main-admin-dashboard" element={<MainAdminDashboard />} />
                <Route path="simple-main-admin-dashboard" element={<SimpleMainAdminDashboard />} />
                <Route path="transfer" element={<Transfer />} />
                <Route path="withdraw" element={<Withdraw />} />
                <Route path="qr-code" element={<QRCode />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="agent-deposit" element={<AgentDeposit />} />
                <Route path="agent-withdrawal" element={<AgentWithdrawal />} />
                <Route path="agent-withdrawal-advanced" element={<AgentWithdrawalAdvanced />} />
                <Route path="agent-withdrawal-simple" element={<AgentWithdrawalSimple />} />
                <Route path="agent-commission-withdrawal" element={<AgentCommissionWithdrawal />} />
                <Route path="agent-performance-dashboard" element={<AgentPerformanceDashboard />} />
                <Route path="agent-settings" element={<AgentSettings />} />
                <Route path="admin-users" element={<AdminUsers />} />
                <Route path="admin-treasury" element={<AdminTreasury />} />
                <Route path="admin-transaction-monitor" element={<AdminTransactionMonitor />} />
                <Route path="admin-notifications" element={<AdminNotifications />} />
                <Route path="admin-settings" element={<AdminSettings />} />
                <Route path="bills" element={<BillPayments />} />
                <Route path="mobile-recharge" element={<MobileRecharge />} />
                <Route path="prepaid-cards" element={<PrepaidCards />} />
                <Route path="savings" element={<Savings />} />
                <Route path="receipts" element={<Receipts />} />
                <Route path="qr-payment" element={<QRPayment />} />
                <Route path="receive" element={<Receive />} />
                <Route path="change-password" element={<ChangePassword />} />
                <Route path="verify-identity" element={<VerifyIdentity />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="unified-deposit-withdrawal" element={<UnifiedDepositWithdrawal />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
