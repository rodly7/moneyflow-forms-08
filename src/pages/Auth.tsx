
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
    setIsSubmitting(true);

    try {
      await signIn(phone, password);
      
      // Stocker le numéro de téléphone après connexion réussie
      authStorageService.storePhoneNumber(phone);
      
      toast.success('Connexion réussie !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
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
                  placeholder="+221 XX XXX XX XX"
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
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
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
