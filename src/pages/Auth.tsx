
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import SignInForm from "@/components/auth/SignInForm";
import SignUpForm from "@/components/auth/SignUpForm";

const Auth = () => {
  const [activeTab, setActiveTab] = useState("signin");
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Rediriger si l'utilisateur est déjà connecté
  useEffect(() => {
    if (!authLoading && user) {
      console.log('👤 User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Afficher un loader pendant que l'auth se charge
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Ne pas afficher le composant si l'utilisateur est connecté
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="signin">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <SignInForm />
          </TabsContent>

          <TabsContent value="signup">
            <SignUpForm />
            
            {/* Bouton "Déjà un compte" */}
            <div className="mt-6">
              <Button
                variant="ghost"
                className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg"
                onClick={() => setActiveTab("signin")}
              >
                Déjà un compte? Se connecter
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
