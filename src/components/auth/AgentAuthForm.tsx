
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { countries } from "@/data/countries";
import IdCardUpload from "./IdCardUpload";

const AgentAuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [idCardPhotoUrl, setIdCardPhotoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(phone, password);
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur votre espace agent",
        });
      } else {
        // Validation pour l'inscription
        if (!fullName || !country || !address || !birthDate) {
          toast({
            title: "Champs obligatoires manquants",
            description: "Veuillez remplir tous les champs obligatoires",
            variant: "destructive"
          });
          return;
        }

        if (!idCardPhotoUrl) {
          toast({
            title: "Photo de carte d'identité requise",
            description: "Veuillez uploader votre photo de carte d'identité",
            variant: "destructive"
          });
          return;
        }

        await signUp(phone, password, {
          full_name: fullName,
          country,
          address,
          phone,
          role: 'agent',
          birth_date: birthDate,
          id_card_photo_url: idCardPhotoUrl
        });
        
        toast({
          title: "Inscription réussie",
          description: "Votre demande d'agent a été soumise pour approbation",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Connexion Agent" : "Inscription Agent"}</CardTitle>
          <CardDescription>
            {isLogin 
              ? "Connectez-vous à votre espace agent" 
              : "Créez votre compte agent SendFlow"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Votre nom complet"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Date de naissance *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Pays *</Label>
                  <Select value={country} onValueChange={setCountry} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.code} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse *</Label>
                  <Textarea
                    id="address"
                    placeholder="Votre adresse complète"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <IdCardUpload 
                  onFileUploaded={setIdCardPhotoUrl}
                  disabled={isLoading}
                />
              </>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading 
                ? (isLogin ? "Connexion..." : "Inscription...")
                : (isLogin ? "Se connecter" : "S'inscrire")
              }
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin 
                  ? "Pas encore de compte ? S'inscrire" 
                  : "Déjà un compte ? Se connecter"
                }
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentAuthForm;
