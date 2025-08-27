import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import Transactions from "./pages/Transactions";
import Transfer from "./pages/Transfer";
import AgentAuth from "./pages/AgentAuth";
import Admin from "./pages/Admin";
import PasswordReset from "./pages/PasswordReset";
import { AuthProvider } from "./contexts/AuthContext";
import KYCVerification from "@/pages/KYCVerification";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/agent-auth" element={<AgentAuth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/kyc-verification" element={<KYCVerification />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
