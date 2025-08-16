
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { Toaster as Toaster2 } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Transfer from "./pages/Transfer";
import Transactions from "./pages/Transactions";
import QRCode from "./pages/QRCode";
import QRPayment from "./pages/QRPayment";
import BillPayments from "./pages/BillPayments";
import Withdraw from "./pages/Withdraw";
import UnifiedDepositWithdrawal from "./pages/UnifiedDepositWithdrawal";
import Savings from "./pages/Savings";
import MobileRecharge from "./pages/MobileRecharge";
import AgentDashboard from "./pages/AgentDashboard";
import ResponsiveAgentDashboard from "./pages/ResponsiveAgentDashboard";
import NewAgentDashboard from "./pages/NewAgentDashboard";
import MobileAgentDashboard from "./pages/MobileAgentDashboard";
import PWADashboard from "./pages/PWADashboard";
import MainAdminDashboard from "./pages/MainAdminDashboard";
import SimpleMainAdminDashboard from "./pages/SimpleMainAdminDashboard";
import SubAdminDashboard from "./pages/SubAdminDashboard";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background font-sans antialiased">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transfer" element={<Transfer />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/qr-code" element={<QRCode />} />
                <Route path="/qr-payment" element={<QRPayment />} />
                <Route path="/bill-payments" element={<BillPayments />} />
                <Route path="/withdraw" element={<Withdraw />} />
                <Route path="/unified-deposit-withdrawal" element={<UnifiedDepositWithdrawal />} />
                <Route path="/savings" element={<Savings />} />
                <Route path="/mobile-recharge" element={<MobileRecharge />} />
                <Route path="/agent-dashboard" element={<AgentDashboard />} />
                <Route path="/responsive-agent-dashboard" element={<ResponsiveAgentDashboard />} />
                <Route path="/new-agent-dashboard" element={<NewAgentDashboard />} />
                <Route path="/mobile-agent-dashboard" element={<MobileAgentDashboard />} />
                <Route path="/pwa-dashboard" element={<PWADashboard />} />
                <Route path="/admin-dashboard" element={<MainAdminDashboard />} />
                <Route path="/simple-admin-dashboard" element={<SimpleMainAdminDashboard />} />
                <Route path="/sub-admin-dashboard" element={<SubAdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </BrowserRouter>
          <Toaster />
          <Toaster2 />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
