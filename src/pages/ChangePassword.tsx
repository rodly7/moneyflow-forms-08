import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import CompactHeader from '@/components/dashboard/CompactHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';

const ChangePassword = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <CompactHeader 
        title="Sécurité"
        subtitle="Changement de mot de passe"
        icon={<Lock className="w-5 h-5 text-primary-foreground" />}
        onSignOut={signOut}
        showNotifications={false}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;