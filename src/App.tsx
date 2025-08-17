
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { Toaster as Toaster2 } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";

// Import all components directly to avoid dynamic import issues
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

// Simple Index component to avoid import issues
const Index = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 relative overflow-hidden">
      {/* Enhanced background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-200/30 via-blue-300/20 to-blue-400/10"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-300/30 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
          SendFlow
        </h1>
        <p className="text-xl md:text-2xl text-blue-800 mb-10 max-w-3xl mx-auto">
          🚀 La plateforme de transfert d'argent la plus rapide et sécurisée d'Afrique.
        </p>
        <a 
          href="/auth"
          className="inline-flex items-center bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold px-8 py-4 rounded-lg shadow-xl hover:shadow-blue-500/25 transition-all duration-300"
        >
          Commencer maintenant
        </a>
      </div>
    </div>
  );
};

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
        <Toaster />
        <Toaster2 />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
