
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PWAInstallBanner } from "./components/pwa/PWAInstallBanner";
import { PWAUpdateBanner } from "./components/pwa/PWAUpdateBanner";
import { OfflineIndicator } from "./components/pwa/OfflineIndicator";

// Force ALL imports to be static - NO lazy loading whatsoever
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

// Preload all components immediately to prevent any lazy loading
const preloadComponents = () => {
  console.log('Preloading all components...');
  // Force evaluation of all imported components
  [
    Layout, Index, Auth, Dashboard, ResponsiveAgentDashboard, MainAdminDashboard,
    SubAdminDashboard, Transfer, Transactions, UnifiedDepositWithdrawal,
    AgentPerformanceDashboard, Savings, Receipts, QRCode, QRPayment, AgentAuth,
    AgentServices, AdminTreasury, AdminUsers, AdminAgentReports, AdminSettings,
    AdminNotifications, AdminTransactionMonitor, Notifications, ChangePassword,
    BillPayments, AgentWithdrawalAdvanced, AgentWithdrawalSimple, AgentDeposit,
    AgentReports, PrepaidCards, AgentCommissionWithdrawal, AgentSettingsPage,
    DepositWithdrawalForm
  ].forEach(Component => {
    if (Component) {
      console.log('Component loaded:', Component.name || 'Anonymous');
    }
  });
  console.log('All components preloaded successfully');
};

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
    console.log('App component mounting with aggressive anti-cache strategy...');
    
    // Preload all components immediately
    preloadComponents();
    
    // Ultra-aggressive cache and service worker cleanup
    const ultraClearEverything = async () => {
      try {
        console.log('Starting ultra-aggressive cleanup...');
        
        // 1. Clear all possible caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          console.log('Found caches to clear:', cacheNames);
          await Promise.all(cacheNames.map(async (cacheName) => {
            const deleted = await caches.delete(cacheName);
            console.log(`Cache ${cacheName} deleted:`, deleted);
          }));
        }

        // 2. Unregister ALL service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log('Found SW registrations:', registrations.length);
          await Promise.all(registrations.map(async (registration) => {
            const unregistered = await registration.unregister();
            console.log('SW unregistered:', unregistered);
          }));
        }

        // 3. Clear all storage
        if ('localStorage' in window) {
          localStorage.clear();
          console.log('localStorage cleared');
        }
        
        if ('sessionStorage' in window) {
          sessionStorage.clear();
          console.log('sessionStorage cleared');
        }

        // 4. Clear IndexedDB if possible
        if ('indexedDB' in window) {
          try {
            const databases = await indexedDB.databases();
            await Promise.all(databases.map(db => {
              if (db.name) {
                indexedDB.deleteDatabase(db.name);
                console.log('IndexedDB cleared:', db.name);
              }
            }));
          } catch (e) {
            console.log('IndexedDB clearing skipped:', e.message);
          }
        }

        console.log('Ultra-aggressive cleanup completed');
      } catch (error) {
        console.error('Ultra cleanup failed:', error);
      }
    };

    ultraClearEverything();

    // Force viewport configuration
    const setViewport = () => {
      let viewport = document.querySelector('meta[name=viewport]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
    };

    setViewport();
    console.log('App component mounted with all static imports');
  }, []);

  console.log('App rendering with preloaded components...');

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
