
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Transfer from "./pages/Transfer";
import Receive from "./pages/Receive";
import QRCode from "./pages/QRCode";
import Transactions from "./pages/Transactions";
import Withdraw from "./pages/Withdraw";
import Notifications from "./pages/Notifications";
import VerifyIdentity from "./pages/VerifyIdentity";
import ChangePassword from "./pages/ChangePassword";
import Receipts from "./pages/Receipts";
import BillPayments from "./pages/BillPayments";
import PrepaidCards from "./pages/PrepaidCards";
import Savings from "./pages/Savings";
import Commission from "./pages/Commission";
import AgentAuth from "./pages/AgentAuth";
import AgentDashboard from "./pages/AgentDashboard";
import AgentDeposit from "./pages/AgentDeposit";
import AgentWithdrawal from "./pages/AgentWithdrawal";
import AgentServices from "./pages/AgentServices";
import AgentSettings from "./pages/AgentSettings";
import AgentCommissionWithdrawal from "./pages/AgentCommissionWithdrawal";
import AgentReports from "./pages/AgentReports";
import AgentWithdrawalSimple from "./pages/AgentWithdrawalSimple";
import AgentWithdrawalAdvanced from "./pages/AgentWithdrawalAdvanced";
import AgentPerformanceDashboard from "./pages/AgentPerformanceDashboard";
import MobileAgentDashboard from "./pages/MobileAgentDashboard";
import NewAgentDashboard from "./pages/NewAgentDashboard";
import ResponsiveAgentDashboard from "./pages/ResponsiveAgentDashboard";
import MainAdminDashboard from "./pages/MainAdminDashboard";
import SimpleMainAdminDashboard from "./pages/SimpleMainAdminDashboard";
import SubAdminDashboard from "./pages/SubAdminDashboard";
import CompactSubAdminDashboard from "./pages/CompactSubAdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import AdminNotifications from "./pages/AdminNotifications";
import AdminTransactionMonitor from "./pages/AdminTransactionMonitor";
import AdminTreasury from "./pages/AdminTreasury";
import AdminBalanceUpdate from "./pages/AdminBalanceUpdate";
import AdminAgentReports from "./pages/AdminAgentReports";
import PWADashboard from "./pages/PWADashboard";
import QRPayment from "./pages/QRPayment";
import UnifiedDepositWithdrawal from "./pages/UnifiedDepositWithdrawal";
import MobileRecharge from "./pages/MobileRecharge";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/receive" element={<Receive />} />
            <Route path="/qr-code" element={<QRCode />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/verify-identity" element={<VerifyIdentity />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/bill-payments" element={<BillPayments />} />
            <Route path="/prepaid-cards" element={<PrepaidCards />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/commission" element={<Commission />} />
            <Route path="/agent-auth" element={<AgentAuth />} />
            <Route path="/agent-dashboard" element={<AgentDashboard />} />
            <Route path="/agent-deposit" element={<AgentDeposit />} />
            <Route path="/agent-withdrawal" element={<AgentWithdrawal />} />
            <Route path="/agent-services" element={<AgentServices />} />
            <Route path="/agent-settings" element={<AgentSettings />} />
            <Route path="/agent-commission-withdrawal" element={<AgentCommissionWithdrawal />} />
            <Route path="/agent-reports" element={<AgentReports />} />
            <Route path="/agent-withdrawal-simple" element={<AgentWithdrawalSimple />} />
            <Route path="/agent-withdrawal-advanced" element={<AgentWithdrawalAdvanced />} />
            <Route path="/agent-performance" element={<AgentPerformanceDashboard />} />
            <Route path="/mobile-agent" element={<MobileAgentDashboard />} />
            <Route path="/new-agent" element={<NewAgentDashboard />} />
            <Route path="/responsive-agent" element={<ResponsiveAgentDashboard />} />
            <Route path="/main-admin" element={<MainAdminDashboard />} />
            <Route path="/simple-admin" element={<SimpleMainAdminDashboard />} />
            <Route path="/sub-admin" element={<SubAdminDashboard />} />
            <Route path="/compact-sub-admin" element={<CompactSubAdminDashboard />} />
            <Route path="/admin-users" element={<AdminUsers />} />
            <Route path="/admin-settings" element={<AdminSettings />} />
            <Route path="/admin-notifications" element={<AdminNotifications />} />
            <Route path="/admin-transactions" element={<AdminTransactionMonitor />} />
            <Route path="/admin-treasury" element={<AdminTreasury />} />
            <Route path="/admin-balance" element={<AdminBalanceUpdate />} />
            <Route path="/admin-agent-reports" element={<AdminAgentReports />} />
            <Route path="/pwa" element={<PWADashboard />} />
            <Route path="/qr-payment" element={<QRPayment />} />
            <Route path="/deposit-withdrawal" element={<UnifiedDepositWithdrawal />} />
            <Route path="/mobile-recharge" element={<MobileRecharge />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
