
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Phone, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SignInForm = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await signIn(phone, password);
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });
      
      navigate('/dashboard', { replace: true });
      
    } catch (error: any) {
      console.error('❌ Erreur de connexion:', error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Vérifiez vos informations de connexion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-8">
        <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
          <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-500 rounded-sm transform rotate-45"></div>
          </div>
        </div>
        
        <CardTitle className="text-2xl font-bold text-purple-600 mb-2">
          Se connecter
        </CardTitle>
        <CardDescription className="text-gray-600">
          Connectez-vous à votre compte SendFlow
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-gray-700 font-medium">
              <Phone className="w-4 h-4" />
              Numéro de téléphone
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+237 6XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="h-12 bg-gray-50 border-gray-200 rounded-lg"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 text-gray-700 font-medium">
              <Lock className="w-4 h-4" />
              Mot de passe
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-gray-50 border-gray-200 rounded-lg pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg mt-8"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignInForm;
