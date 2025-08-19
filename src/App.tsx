
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PWAInstallBanner } from "./components/pwa/PWAInstallBanner";
import { PWAUpdateBanner } from "./components/pwa/PWAUpdateBanner";
import { OfflineIndicator } from "./components/pwa/OfflineIndicator";

// CRITICAL: All imports must be static - NO dynamic imports whatsoever
// Every single component is imported statically to prevent code splitting
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

// Enhanced loading component with error boundary
const EnhancedLoader = () => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-background">
    <Card className="w-full max-w-sm">
      <CardContent className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Chargement de SendFlow...</p>
        <p className="text-xs text-muted-foreground mt-2">Initialisation en cours</p>
      </CardContent>
    </Card>
  </div>
);

function App() {
  useEffect(() => {
    console.log('App component mounting with ZERO dynamic imports - all static');
    
    // Ultra-aggressive cache and service worker cleanup to prevent cached dynamic imports
    const nukeCacheAndSW = async () => {
      try {
        console.log('Starting complete cleanup to eliminate dynamic import issues...');
        
        // 1. Clear ALL storage that might cache dynamic imports
        if ('localStorage' in window) {
          localStorage.clear();
          console.log('localStorage cleared');
        }
        if ('sessionStorage' in window) {
          sessionStorage.clear();
          console.log('sessionStorage cleared');
        }

        // 2. Delete ALL caches that might contain split chunks
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          console.log('Found caches to delete:', cacheNames);
          await Promise.all(cacheNames.map(cacheName => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          }));
          console.log('All caches nuked - no more cached dynamic imports');
        }

        // 3. Unregister ALL service workers that might interfere
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log('Found SW registrations:', registrations.length);
          await Promise.all(registrations.map(registration => {
            console.log('Unregistering SW:', registration.scope);
            return registration.unregister();
          }));
          console.log('All service workers eliminated');
        }

        // 4. Clear IndexedDB
        if ('indexedDB' in window) {
          try {
            const databases = await indexedDB.databases();
            await Promise.all(databases.map(db => {
              if (db.name) {
                console.log('Deleting IndexedDB:', db.name);
                indexedDB.deleteDatabase(db.name);
              }
            }));
          } catch (e) {
            console.log('IndexedDB cleanup completed');
          }
        }

        console.log('Complete cleanup finished - static imports only');
      } catch (error) {
        console.error('Cleanup failed but continuing with static imports:', error);
      }
    };

    nukeCacheAndSW();

    // Enhanced viewport setup for PWA
    const setupViewport = () => {
      let viewport = document.querySelector('meta[name=viewport]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
    };

    setupViewport();
    console.log('App mounted successfully - ALL COMPONENTS STATICALLY IMPORTED');
  }, []);

  console.log('App rendering with 100% static imports - zero code splitting');

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
          <Route path="unified-deposit-withdrawal" element={<UnifiedDepositWithdrawal />} />
          <Route path="deposit-withdrawal" element={<DepositWithdrawalForm />} />
          <Route path="withdraw" element={<UnifiedDepositWithdrawal />} />
          <Route path="agent-services" element={<AgentServices />} />
          
          {/* Agent routes - all statically imported */}
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
