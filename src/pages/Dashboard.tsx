
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { PWAOptimizedLayout } from "@/components/pwa/PWAOptimizedLayout";
import MobileDashboard from "@/components/mobile/MobileDashboard";

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center p-8 animate-fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-blue-800">SendFlow</p>
            <p className="text-sm text-blue-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PWAOptimizedLayout>
      <MobileDashboard />
    </PWAOptimizedLayout>
  );
};

export default Dashboard;
