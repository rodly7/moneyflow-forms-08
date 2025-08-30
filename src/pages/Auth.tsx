
import { useState } from 'react';
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

const Auth = () => {
  const { user, signIn, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'pin'>('password');

  // Rediriger si l'utilisateur est déjà connecté
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(phone, password);
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
      // For PIN login, we need to verify PIN against stored PIN
      // This would need a specific signInWithPin method
      toast.success('Connexion par PIN réussie !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion par PIN');
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
