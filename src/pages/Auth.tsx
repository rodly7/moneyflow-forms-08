
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import SignUpForm from '@/components/auth/SignUpForm';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Lock } from 'lucide-react';
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
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'pin'>('password');
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [pwaInstallComplete, setPWAInstallComplete] = useState(false);
  const [storedPhone, setStoredPhone] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier si l'application doit être installée sur mobile
    if (isMobile && !isInstalled && !pwaInstallComplete) {
      setShowPWAInstall(true);
      return;
    }

    // Vérifier s'il y a un numéro stocké
    const savedPhone = authStorageService.getStoredPhoneNumber();
    if (savedPhone) {
      setStoredPhone(savedPhone);
      setPhone(savedPhone);
      setLoginMethod('pin');
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

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error('Le PIN doit contenir 4 chiffres');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.signInWithPin(phone, pin);
      toast.success('Connexion par PIN réussie !');
      
      // Rediriger manuellement car nous n'utilisons pas le contexte auth ici
      window.location.href = '/';
    } catch (error: any) {
      toast.error(error.message || 'PIN incorrect');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPin = () => {
    // Supprimer le numéro stocké pour forcer la connexion complète
    authStorageService.clearStoredPhoneNumber();
    setStoredPhone(null);
    setLoginMethod('password');
    setPin('');
    setPhone('');
    toast.info('Vous devez maintenant vous connecter avec vos identifiants complets');
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
            <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'password' | 'pin')} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Téléphone
                </TabsTrigger>
                <TabsTrigger value="pin" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  PIN
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password" className="space-y-4">
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
              </TabsContent>

              <TabsContent value="pin" className="space-y-4">
                <form onSubmit={handlePinLogin} className="space-y-4">
                  {storedPhone ? (
                    <div className="space-y-2">
                      <Label>Numéro de téléphone</Label>
                      <div className="bg-secondary/50 rounded-lg p-3 text-center">
                        <p className="text-sm text-muted-foreground">Connecté en tant que</p>
                        <p className="font-medium">{authStorageService.formatPhoneForDisplay(storedPhone)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="phone-pin">Numéro de téléphone</Label>
                      <Input
                        id="phone-pin"
                        type="tel"
                        placeholder="+221 XX XXX XX XX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Code PIN (4 chiffres)</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={4}
                        value={pin}
                        onChange={setPin}
                        pattern="^[0-9]*$"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || pin.length !== 4}
                  >
                    {isSubmitting ? 'Connexion...' : 'Se connecter avec PIN'}
                  </Button>
                  
                  {storedPhone && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleForgotPin}
                        className="text-sm text-muted-foreground hover:text-primary hover:underline"
                      >
                        PIN oublié ? Se connecter avec le mot de passe
                      </button>
                    </div>
                  )}
                </form>
              </TabsContent>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Pas de compte ? S'inscrire
                </button>
              </div>
            </Tabs>
          ) : (
            <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
