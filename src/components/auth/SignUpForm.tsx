
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, MapPin, Phone, Lock, ChevronDown } from "lucide-react";
import { countries } from "@/data/countries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SignUpForm = () => {
  const [fullName, setFullName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const { toast } = useToast();

  const selectedCountryData = countries.find(c => c.name === selectedCountry);
  const cities = selectedCountryData?.cities || [];

  const handleCountryChange = (countryName: string) => {
    setSelectedCountry(countryName);
    const country = countries.find(c => c.name === countryName);
    if (country) {
      setPhoneCode(country.code);
    }
    setSelectedCity(""); // Reset city when country changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !selectedCountry || !selectedCity || !phoneNumber || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${phoneCode}${phoneNumber}`;
      
      await signUp(fullPhone, password, {
        full_name: fullName,
        phone: fullPhone,
        country: selectedCountry,
        address: selectedCity,
        role: 'user'
      });
      
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès !",
      });
      
    } catch (error: any) {
      console.error('❌ Erreur d\'inscription:', error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription",
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
          Créer un compte
        </CardTitle>
        <CardDescription className="text-gray-600">
          Rejoignez SendFlow
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom complet */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2 text-gray-700 font-medium">
              <User className="w-4 h-4" />
              Nom complet
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Entrez votre nom complet"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-12 bg-gray-50 border-gray-200 rounded-lg"
            />
          </div>

          {/* Pays */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700 font-medium">
              <MapPin className="w-4 h-4" />
              Pays
            </Label>
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className="h-12 bg-gray-50 border-gray-200 rounded-lg">
                <SelectValue placeholder="Sélectionnez votre pays" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.name} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ville */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700 font-medium">
              <MapPin className="w-4 h-4" />
              Ville
            </Label>
            <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedCountry}>
              <SelectTrigger className="h-12 bg-gray-50 border-gray-200 rounded-lg">
                <SelectValue placeholder="Sélectionnez votre ville" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Numéro de téléphone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700 font-medium">
              <Phone className="w-4 h-4" />
              Numéro de téléphone
            </Label>
            <div className="flex gap-2">
              <div className="w-20 h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-medium">
                {phoneCode || "+XXX"}
              </div>
              <Input
                type="tel"
                placeholder="XX XXX XXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="flex-1 h-12 bg-gray-50 border-gray-200 rounded-lg"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 text-gray-700 font-medium">
              <Lock className="w-4 h-4" />
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Au moins 6 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12 bg-gray-50 border-gray-200 rounded-lg"
            />
          </div>

          {/* Bouton Créer un compte */}
          <Button
            type="submit"
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg mt-8"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer un compte
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignUpForm;
