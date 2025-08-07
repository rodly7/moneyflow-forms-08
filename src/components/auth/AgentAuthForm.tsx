
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { Shield, Users, Phone, Lock, Eye, EyeOff, CheckCircle2, Crown, Sparkles, Star, KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

const AgentAuthForm = () => {
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn } = useAuth();
  
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Fonction pour normaliser les numéros de téléphone
  const normalizePhoneNumber = (phoneInput: string) => {
    // Supprimer tous les espaces et caractères non numériques sauf le +
    let cleanPhone = phoneInput.replace(/[^\d+]/g, '');
    
    console.log('📱 Numéro normalisé:', cleanPhone, 'depuis:', phoneInput);
    return cleanPhone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Connexion - normaliser le numéro de téléphone
      if (!loginPhone || !loginPassword) {
        throw new Error("Veuillez remplir tous les champs");
      }

      // Normaliser le numéro pour la connexion
      const normalizedLoginPhone = normalizePhoneNumber(loginPhone);

      console.log('🏢 Tentative de connexion AGENT:', {
        original: loginPhone,
        normalized: normalizedLoginPhone
      });

      await signIn(normalizedLoginPhone, loginPassword);
      toast.success("Connexion agent réussie! Redirection en cours...");
      console.log('✅ Connexion agent réussie avec numéro:', normalizedLoginPhone);
    } catch (error: any) {
      console.error("Erreur d'authentification agent:", error);
      
      let errorMessage = "Une erreur est survenue";
      
      if (error.message.includes("Numéro de téléphone ou mot de passe incorrect") || 
          error.message.includes("Invalid login credentials")) {
        errorMessage = "Numéro de téléphone ou mot de passe incorrect. Assurez-vous d'utiliser le même format de numéro qu'à l'inscription (avec le code pays).";
      } else if (error.message.includes("Password should be at least 6 characters")) {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
      } else {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <Card className="w-full max-w-xl backdrop-blur-2xl bg-white/10 shadow-2xl border border-white/20 relative overflow-hidden rounded-3xl layout-stable">
      {/* Card glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-green-500/5 opacity-60"></div>
      
      <CardHeader className="space-y-6 text-center pb-8 relative z-10">
        <div className="mx-auto w-24 h-24 bg-gradient-to-r from-emerald-400 via-teal-500 to-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl">
          <Crown className="w-12 h-12 text-white" />
        </div>
        
        <div className="space-y-3">
          <CardTitle className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent">
            👑 Espace Agent Elite
          </CardTitle>
          
          <CardDescription className="text-white/90 text-lg font-medium flex items-center justify-center gap-2">
            <Users className="w-6 h-6 text-emerald-300" />
            Accès professionnel sécurisé et privilégié
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8 relative z-10 px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="loginPhone" className="text-white font-semibold flex items-center gap-3 text-base">
              <Phone className="w-5 h-5 text-emerald-300" />
              Numéro de téléphone professionnel
            </Label>
            <Input
              id="loginPhone"
              type="text"
              placeholder="Exemple: +242061043340 ou +221773637752"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              required
              className="h-14 bg-white/15 border-white/30 text-white placeholder:text-white/70 focus:border-emerald-400 focus:ring-emerald-400/30 backdrop-blur-md rounded-xl text-base form-field-stable"
              disabled={loading}
            />
            <div className="flex items-center gap-2 text-sm text-emerald-200 font-medium bg-emerald-500/20 p-4 rounded-xl backdrop-blur-sm border border-emerald-400/30">
              <CheckCircle2 className="w-5 h-5" />
              <span>💡 Utilisez le format complet avec le code pays (ex: +242...)</span>
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="loginPassword" className="text-white font-semibold flex items-center gap-3 text-base">
              <Lock className="w-5 h-5 text-emerald-300" />
              Mot de passe sécurisé
            </Label>
            <div className="relative">
              <Input
                id="loginPassword"
                type={showPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="h-14 bg-white/15 border-white/30 text-white placeholder:text-white/70 focus:border-emerald-400 focus:ring-emerald-400/30 backdrop-blur-md rounded-xl text-base pr-12 form-field-stable"
                disabled={loading}
                minLength={6}
                placeholder="Votre mot de passe professionnel"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 text-white font-bold shadow-2xl text-lg rounded-xl form-field-stable"
            disabled={loading}
          >
            {loading && (
              <Icons.spinner className="mr-3 h-6 w-6 animate-spin" />
            )}
            {loading ? (
              "⏳ Connexion en cours..."
            ) : (
              <>
                <Shield className="mr-3 h-6 w-6" />
                🔐 Accéder à l'espace agent
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-emerald-200 hover:text-white hover:bg-emerald-500/20 mt-3 rounded-xl"
            onClick={() => setShowForgotPassword(true)}
            disabled={loading}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Mot de passe oublié ?
          </Button>

          <div className="bg-gradient-to-r from-emerald-50/10 to-teal-50/10 backdrop-blur-md p-6 rounded-2xl border border-emerald-400/30 mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-full">
                <Star className="w-5 h-5 text-emerald-300" />
              </div>
              <h3 className="text-white font-bold text-lg">👑 Privilèges Agent Elite</h3>
            </div>
            <div className="space-y-3 text-sm text-emerald-100">
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Accès exclusif aux outils de gestion avancés</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Commissions privilégiées sur toutes vos opérations</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Interface professionnelle dédiée aux agents</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Support prioritaire et assistance technique</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-emerald-200 font-medium bg-emerald-500/10 p-3 rounded-xl backdrop-blur-sm border border-emerald-400/20">
              <Shield className="w-4 h-4 inline mr-2" />
              Accès réservé aux agents autorisés uniquement
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AgentAuthForm;
