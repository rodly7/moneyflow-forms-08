
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import SignUpForm from '@/components/auth/SignUpForm';
import { Smartphone } from 'lucide-react';
import ForcedPWAInstall from '@/components/auth/ForcedPWAInstall';
import { authStorageService } from '@/services/authStorageService';
import { authService } from '@/services/authService';
import { usePWA } from '@/hooks/usePWA';
import { useIsMobile } from '@/hooks/useIsMobile';

const Auth = () => {
  const { user, signIn, loading } = useAuth();
  const { isInstalled } = usePWA();
  const isMobile = useIsMobile();
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [pwaInstallComplete, setPWAInstallComplete] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // Vérifier si l'application doit être installée sur mobile
    if (isMobile && !isInstalled && !pwaInstallComplete) {
      setShowPWAInstall(true);
      return;
    }

    
    setPWAInstallComplete(true);
  }, [isMobile, isInstalled, pwaInstallComplete]);

  // Rediriger si l'utilisateur est déjà connecté
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  // Afficher l'écran d'installation PWA obligatoire sur mobile
  if (showPWAInstall && isMobile && !pwaInstallComplete) {
    return (
      <ForcedPWAInstall 
        onInstallComplete={() => {
          setShowPWAInstall(false);
          setPWAInstallComplete(true);
        }} 
      />
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      toast.error('Trop de tentatives échouées. Veuillez vous rendre en agence avec votre pièce d\'identité pour réinitialiser votre mot de passe.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      await signIn(phone, password);
      
      // Réinitialiser les tentatives échouées en cas de succès
      setFailedAttempts(0);
      setIsBlocked(false);
      
      // Stocker le numéro de téléphone après connexion réussie
      authStorageService.storePhoneNumber(phone);
      
      toast.success('Connexion réussie !');
    } catch (error: any) {
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      
      if (newFailedAttempts >= 3) {
        setIsBlocked(true);
        toast.error('Trop de tentatives échouées. Veuillez vous rendre en agence avec votre pièce d\'identité pour réinitialiser votre mot de passe.');
      } else {
        toast.error(`${error.message || 'Erreur de connexion'} (Tentative ${newFailedAttempts}/3)`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          {isLogin && (
            <div className="flex justify-center mb-6">
              <img 
                src="/icons/icon-192x192.png" 
                alt="SendFlow Logo" 
                className="h-20 w-20 rounded-2xl shadow-lg"
              />
            </div>
          )}
          <CardTitle className="text-2xl text-center">
            {isLogin ? 'Connexion' : 'Inscription'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin 
              ? 'Connectez-vous à votre compte SendFlow'
              : 'Créez votre compte SendFlow'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="XX XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {isBlocked && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-800 text-sm font-medium">
                    Accès temporairement bloqué
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    Veuillez vous rendre en agence avec votre pièce d'identité pour réinitialiser votre mot de passe.
                  </p>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || isBlocked}
              >
                {isSubmitting ? 'Connexion...' : isBlocked ? 'Compte bloqué' : 'Se connecter'}
              </Button>
            </form>
          ) : (
            <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
          
          {isLogin && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-sm text-primary hover:underline"
              >
                Pas de compte ? S'inscrire
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
