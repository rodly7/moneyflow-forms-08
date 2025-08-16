import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { countries } from "@/data/countries";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Zap, Shield, User, Phone, MapPin, Lock, ArrowLeft, Sparkles, Crown, Eye, EyeOff, CheckCircle2, Mail, Calendar } from "lucide-react";
import { PasswordChangeAppointmentForm } from "@/components/auth/PasswordChangeAppointmentForm";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isAgentMode = searchParams.get('role') === 'agent';
  
  const [isSignUp, setIsSignUp] = useState(isAgentMode);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  
  // Login fields
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Additional signup fields
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  // Appointment state
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  // Rediriger si l'utilisateur est déjà connecté
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleCountryChange = (value: string) => {
    const selectedCountry = countries.find(c => c.name === value);
    if (selectedCountry) {
      setCountry(value);
      setSelectedCountryCode(selectedCountry.code);
      setAvailableCities(selectedCountry.cities.map(city => city.name));
      setAddress("");
      setPhone(selectedCountry.code);
      setPhoneNumber("");
    }
  };

  const formatPhoneWithCountryCode = (countryCode: string, number: string) => {
    return `${countryCode}${number.replace(/\D/g, '')}`;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
    setPhone(formatPhoneWithCountryCode(selectedCountryCode, value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!country || !address || !phone || !password || !fullName) {
          throw new Error("Veuillez remplir tous les champs");
        }
        
        if (fullName.length < 2) {
          throw new Error("Le nom complet doit contenir au moins 2 caractères");
        }
        
        const userRole = isAgentMode ? "agent" : "user";
        
        console.log('📝 Tentative d\'inscription avec:', { phone, role: userRole });
        
        await signUp(phone, password, {
          full_name: fullName,
          country: country,
          address: address,
          phone: phone,
          role: userRole,
        });
        
        const successMessage = isAgentMode ? "Compte agent créé avec succès!" : "Compte créé avec succès!";
        toast.success(successMessage);
        
        // Après inscription réussie, rediriger vers le dashboard
        console.log('✅ Inscription réussie, redirection vers dashboard...');
        navigate('/dashboard', { replace: true });
        
      } else {
        if (!loginPhone || !loginPassword) {
          throw new Error("Veuillez remplir tous les champs");
        }

        console.log('🔐 Tentative de connexion avec:', loginPhone);
        
        await signIn(loginPhone, loginPassword);
        toast.success("Connexion réussie!");
        
        // Après connexion réussie, rediriger vers le dashboard
        console.log('✅ Connexion réussie, redirection vers dashboard...');
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      console.error("❌ Erreur d'authentification:", error);
      
      let errorMessage = "Une erreur est survenue";
      
      if (error.message.includes("Numéro de téléphone ou mot de passe incorrect")) {
        errorMessage = "Numéro de téléphone ou mot de passe incorrect. Vérifiez que vous utilisez exactement le même numéro qu'à l'inscription.";
      } else if (error.message.includes("Un compte existe déjà") || error.message.includes("User already registered")) {
        errorMessage = "Un compte existe déjà avec ce numéro. Basculement vers la connexion...";
        setTimeout(() => {
          setIsSignUp(false);
          setLoginPhone(phone || loginPhone);
          toast.info("Veuillez saisir votre mot de passe pour vous connecter");
        }, 1500);
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

  if (showAppointmentForm) {
    return (
      <PasswordChangeAppointmentForm onBack={() => setShowAppointmentForm(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4 transition-all duration-500">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 text-muted-foreground hover:text-foreground z-20 transition-all duration-200"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Accueil
      </Button>

      <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center mb-2 transition-transform duration-200 hover:scale-110">
            {isAgentMode ? (
              <Crown className="w-6 h-6 text-primary-foreground" />
            ) : (
              <Zap className="w-6 h-6 text-primary-foreground" />
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold transition-colors duration-200">
            {isSignUp ? (
              <>
                {isAgentMode ? "Devenir Agent" : "Créer un compte"}
              </>
            ) : (
              "Connexion"
            )}
          </CardTitle>
          
          <CardDescription className="transition-colors duration-200">
            {isSignUp ? (
              <>
                {isAgentMode ? "Rejoignez notre réseau d'agents" : "Rejoignez SendFlow"}
              </>
            ) : (
              "Connectez-vous à votre compte"
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp ? (
              <>
                {/* Full Name */}
                <div className="space-y-2 transition-all duration-200">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nom complet
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Entrez votre nom complet"
                    className="h-12 transition-all duration-200 focus:shadow-md"
                  />
                </div>

                {/* Country */}
                <div className="space-y-2 transition-all duration-200">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Pays
                  </Label>
                  <select 
                    id="country"
                    value={country} 
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="h-12 w-full px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200"
                  >
                    <option value="">Sélectionnez votre pays</option>
                    {countries.map((country) => (
                      <option key={country.name} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div className="space-y-2 transition-all duration-200">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Ville
                  </Label>
                  <select 
                    id="address"
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!country}
                    className="h-12 w-full px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  >
                    <option value="">Sélectionnez votre ville</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone Number */}
                <div className="space-y-2 transition-all duration-200">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Numéro de téléphone
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      value={selectedCountryCode || "+XXX"} 
                      readOnly 
                      className="w-20 h-12 text-center font-mono text-sm bg-muted" 
                    />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="XX XXX XXXX"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      required
                      disabled={loading || !selectedCountryCode}
                      className="h-12 flex-1 transition-all duration-200 focus:shadow-md"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2 transition-all duration-200">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      placeholder="Au moins 6 caractères"
                      className="h-12 pr-10 transition-all duration-200 focus:shadow-md"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 transition-all duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Login Phone */}
                <div className="space-y-2 transition-all duration-200">
                  <Label htmlFor="loginPhone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Numéro de téléphone
                  </Label>
                  <Input
                    id="loginPhone"
                    type="text"
                    placeholder="Ex: +242XXXXXXXX"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 transition-all duration-200 focus:shadow-md"
                  />
                </div>

                {/* Login Password */}
                <div className="space-y-2 transition-all duration-200">
                  <Label htmlFor="loginPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="loginPassword"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      placeholder="Votre mot de passe"
                      className="h-12 pr-10 transition-all duration-200 focus:shadow-md"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 transition-all duration-200"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full mt-6 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-200 transform hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? (
                "Chargement..."
              ) : isSignUp ? (
                isAgentMode ? "Créer compte agent" : "Créer un compte"
              ) : (
                "Se connecter"
              )}
            </Button>

            {/* Toggle Sign Up/Login */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full h-12 transition-all duration-200 hover:shadow-md"
              disabled={loading}
            >
              {isSignUp ? "Déjà un compte? Se connecter" : "Pas de compte? S'inscrire"}
            </Button>

            {/* Password Change Appointment Link */}
            {!isSignUp && (
              <div className="text-center mt-4">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowAppointmentForm(true)}
                  className="text-sm text-muted-foreground flex items-center justify-center gap-2 hover:text-primary transition-all duration-200"
                  disabled={loading}
                >
                  <Calendar className="w-4 h-4" />
                  Prendre rendez-vous pour changer le mot de passe
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
