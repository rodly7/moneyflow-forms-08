
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PWAInstallBanner } from "./components/pwa/PWAInstallBanner";
import { PWAUpdateBanner } from "./components/pwa/PWAUpdateBanner";
import { OfflineIndicator } from "./components/pwa/OfflineIndicator";

// Force direct imports - NO lazy loading at all
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ResponsiveAgentDashboard from "./pages/ResponsiveAgentDashboard";
import MainAdminDashboard from "./pages/MainAdminDashboard";
import SubAdminDashboard from "./pages/SubAdminDashboard";
import Transfer from "./pages/Transfer";
import Transactions from "./pages/Transactions";
import UnifiedDepositWithdrawal from "./pages/UnifiedDepositWithdrawal";
import AgentPerformanceDashboard from "./pages/AgentPerformanceDashboard";
import Savings from "./pages/Savings";
import Receipts from "./pages/Receipts";
import QRCode from "./pages/QRCode";
import QRPayment from "./pages/QRPayment";
import AgentAuth from "./pages/AgentAuth";
import AgentServices from "./pages/AgentServices";
import AdminTreasury from "./pages/AdminTreasury";
import AdminUsers from "./pages/AdminUsers";
import AdminAgentReports from "./pages/AdminAgentReports";
import AdminSettings from "./pages/AdminSettings";
import AdminNotifications from "./pages/AdminNotifications";
import AdminTransactionMonitor from "./pages/AdminTransactionMonitor";
import Notifications from "./pages/Notifications";
import ChangePassword from "./pages/ChangePassword";
import BillPayments from "./pages/BillPayments";
import AgentWithdrawalAdvanced from "./pages/AgentWithdrawalAdvanced";
import AgentWithdrawalSimple from "./pages/AgentWithdrawalSimple";
import AgentDeposit from "./pages/AgentDeposit";
import AgentReports from "./pages/AgentReports";
import PrepaidCards from "./pages/PrepaidCards";
import AgentCommissionWithdrawal from "./pages/AgentCommissionWithdrawal";
import AgentSettingsPage from "./pages/AgentSettings";
import DepositWithdrawalForm from "./components/deposit-withdrawal/DepositWithdrawalForm";

// Simple loading component
const SimpleLoader = () => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-background">
    <Card className="w-full max-w-sm">
      <CardContent className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </CardContent>
    </Card>
  </div>
);

function App() {
  useEffect(() => {
    console.log('App component mounting...');
    
    // Force complete cache and service worker cleanup
    const clearEverything = async () => {
      try {
        // Clear all caches aggressively
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          console.log('Clearing caches:', cacheNames);
          await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        }

        // Unregister all service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(registration => registration.unregister()));
          console.log('All service workers unregistered');
        }

        // Force reload if we're dealing with cached content
        if (window.performance && window.performance.navigation.type === 1) {
          console.log('Page was refreshed, clearing everything');
        }

      } catch (error) {
        console.error('Cache/SW clearing failed:', error);
      }
    };

    clearEverything();

    // Set viewport
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
    }

    console.log('App component mounted successfully');
  }, []);

  console.log('App rendering...');

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineIndicator />
      <PWAInstallBanner />
      <PWAUpdateBanner />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Index />} />
          <Route path="auth" element={<Auth />} />
          <Route path="agent-auth" element={<AgentAuth />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="agent-dashboard" element={<ResponsiveAgentDashboard />} />
          <Route path="admin-dashboard" element={<MainAdminDashboard />} />
          <Route path="main-admin" element={<MainAdminDashboard />} />
          <Route path="admin/treasury" element={<AdminTreasury />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/agent-reports" element={<AdminAgentReports />} />
          <Route path="admin/settings" element={<AdminSettings />} />
          <Route path="admin/notifications" element={<AdminNotifications />} />
          <Route path="admin/transaction-monitor" element={<AdminTransactionMonitor />} />
          <Route path="sub-admin-dashboard" element={<SubAdminDashboard />} />
          <Route path="transfer" element={<Transfer />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="deposit" element={<UnifiedDepositWithdrawal />} />
          <Route path="deposit-withdrawal" element={<DepositWithdrawalForm />} />
          <Route path="agent-services" element={<AgentServices />} />
          
          {/* Agent routes */}
          <Route path="agent-deposit" element={<AgentDeposit />} />
          <Route path="agent-withdrawal-advanced" element={<AgentWithdrawalAdvanced />} />
          <Route path="agent-reports" element={<AgentReports />} />
          <Route path="agent-performance-dashboard" element={<AgentPerformanceDashboard />} />
          <Route path="mobile-recharge" element={<PrepaidCards />} />
          <Route path="agent-commission-withdrawal" element={<AgentCommissionWithdrawal />} />
          <Route path="agent-settings" element={<AgentSettingsPage />} />
          
          <Route path="agent-performance" element={<AgentPerformanceDashboard />} />
          <Route path="savings" element={<Savings />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="qr-code" element={<QRCode />} />
          <Route path="qr-payment" element={<QRPayment />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="bill-payments" element={<BillPayments />} />
        </Route>
      </Routes>
    </TooltipProvider>
  );
}

export default App;
