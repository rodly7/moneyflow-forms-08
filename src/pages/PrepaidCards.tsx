
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Copy, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const PrepaidCards = () => {
  const [showVirtualCard, setShowVirtualCard] = useState(false);
  const [hideCardDetails, setHideCardDetails] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user profile for card details
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Check if user already has a virtual card stored
  useEffect(() => {
    const storedCard = getStoredCardDetails();
    if (storedCard) {
      setShowVirtualCard(true);
    }
  }, [user?.id]);

  // Store virtual card details in local storage for persistence
  const getStoredCardDetails = () => {
    const storedCard = localStorage.getItem(`virtual_card_${user?.id}`);
    return storedCard ? JSON.parse(storedCard) : null;
  };

  // Generate virtual card details or load from storage
  const getCardDetails = () => {
    const storedCard = getStoredCardDetails();
    
    if (storedCard) {
      return storedCard;
    }
    
    // Generate new card details if none exist
    const newCardDetails = generateCardDetails();
    
    // Store the card details
    localStorage.setItem(`virtual_card_${user?.id}`, JSON.stringify(newCardDetails));
    
    return newCardDetails;
  };

  // Generate virtual card details
  const generateCardDetails = () => {
    // Random card number that starts with 4 (Visa-like)
    const cardNumber = `4${Math.floor(Math.random() * 1000).toString().padStart(3, '0')} ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')} ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')} ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Random expiry date (between 1-3 years from now)
    const today = new Date();
    const expiryYear = (today.getFullYear() + 1 + Math.floor(Math.random() * 3)) % 100;
    const expiryMonth = Math.floor(1 + Math.random() * 12).toString().padStart(2, '0');
    const expiryDate = `${expiryMonth}/${expiryYear.toString().padStart(2, '0')}`;
    
    // Random CVV
    const cvv = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return { cardNumber, expiryDate, cvv };
  };

  // Get or generate card details
  const cardDetails = getCardDetails();

  const handleRequestVirtualCard = () => {
    setShowVirtualCard(true);
    toast({
      title: "Carte virtuelle créée avec succès",
      description: "Vous pouvez maintenant utiliser votre carte virtuelle pour les achats en ligne.",
    });
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${field} copié`,
      description: "Information copiée dans le presse-papier",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-lg mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        
        <h1 className="text-2xl font-bold mb-6">Cartes prépayées Money Flow</h1>
        
        {showVirtualCard ? (
          <Card className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Carte Virtuelle</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/10 h-8 w-8"
                  onClick={() => setHideCardDetails(!hideCardDetails)}
                >
                  {hideCardDetails ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
              <CardDescription className="text-blue-100">
                Utilisable pour les achats en ligne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-14 h-8 rounded bg-white/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">VISA</span>
                </div>
                <div className="text-sm uppercase">{profile?.full_name}</div>
              </div>
              
              <div>
                <div className="text-xs text-blue-200">Numéro de carte</div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-lg">
                    {hideCardDetails ? "●●●● ●●●● ●●●● ●●●●" : cardDetails.cardNumber}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-white hover:bg-white/10 p-1"
                    onClick={() => copyToClipboard(cardDetails.cardNumber.replace(/\s/g, ''), "Numéro de carte")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex space-x-6">
                <div>
                  <div className="text-xs text-blue-200">Date d'expiration</div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono">
                      {hideCardDetails ? "●●/●●" : cardDetails.expiryDate}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-white hover:bg-white/10 p-1"
                      onClick={() => copyToClipboard(cardDetails.expiryDate, "Date d'expiration")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-blue-200">CVV</div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono">
                      {hideCardDetails ? "●●●" : cardDetails.cvv}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-white hover:bg-white/10 p-1"
                      onClick={() => copyToClipboard(cardDetails.cvv, "CVV")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-blue-200 mt-4">
                Cette carte est liée à votre compte Money Flow et utilise votre solde disponible.
              </div>
            </CardContent>
          </Card>
        ) : null}
        
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Carte Virtuelle</CardTitle>
              <CardDescription>
                Utilisez votre solde pour des achats en ligne en toute sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Créez instantanément une carte virtuelle liée à votre compte Money Flow.
                Idéale pour les achats en ligne, les abonnements et les services numériques.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={handleRequestVirtualCard}
                disabled={showVirtualCard}
              >
                {showVirtualCard ? "Carte virtuelle créée" : "Demander une carte virtuelle"}
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="opacity-70">
            <CardHeader>
              <CardTitle>Carte Physique</CardTitle>
              <CardDescription>
                Accédez à votre argent partout dans le monde
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Recevez une carte physique à votre adresse pour accéder à votre 
                solde Money Flow dans les commerces et aux distributeurs automatiques.
              </p>
              <p className="text-xs text-amber-600 mt-2">
                Ce service sera bientôt disponible.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled>
                Service indisponible
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avantages des cartes Money Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start">
                <div className="bg-emerald-100 p-1 rounded-full mr-2">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm">Frais réduits sur les transactions internationales</p>
              </div>

              <div className="flex items-start">
                <div className="bg-emerald-100 p-1 rounded-full mr-2">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm">Utilisation immédiate de votre solde après réception de fonds</p>
              </div>

              <div className="flex items-start">
                <div className="bg-emerald-100 p-1 rounded-full mr-2">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm">Sécurité renforcée avec des notifications instantanées</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrepaidCards;
