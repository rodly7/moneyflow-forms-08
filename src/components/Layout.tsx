
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/AuthContext";
import { useRequiredInfo } from "@/hooks/useRequiredInfo";
import RequiredInfoModal from "@/components/profile/RequiredInfoModal";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, profile } = useAuth();
  const { showRequiredInfoModal, handleComplete } = useRequiredInfo();

  return (
    <>
      {children}
      <Toaster />
      
      {user && profile && (
        <RequiredInfoModal
          isOpen={showRequiredInfoModal}
          onClose={() => {}} // Empêche la fermeture
          userId={user.id}
          onComplete={handleComplete}
        />
      )}
    </>
  );
};

export default Layout;
