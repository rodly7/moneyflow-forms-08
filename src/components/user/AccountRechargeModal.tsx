
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Phone, MapPin, CreditCard, User, Wallet } from "lucide-react";
import { countries } from "@/data/countries";

interface Agent {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  status: string;
  address?: string;
  zone?: string;
}

interface AccountRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountRechargeModal = ({ isOpen, onClose }: AccountRechargeModalProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && profile?.country) {
      fetchAgentsInTerritory();
      getPaymentMethods();
    }
  }, [isOpen, profile?.country]);

  const fetchAgentsInTerritory = async () => {
    if (!profile?.country) return;
    
    setIsLoading(true);
    try {
      // Récupérer les agents du même pays que l'utilisateur
      const { data: agentsData, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country')
        .eq('role', 'agent')
        .eq('country', profile.country);

      if (error) throw error;

      // Récupérer les informations détaillées des agents
      const agentIds = agentsData?.map(agent => agent.id) || [];
      if (agentIds.length > 0) {
        const { data: agentDetails, error: agentError } = await supabase
          .from('agents')
          .select('user_id, status')
          .in('user_id', agentIds)
          .eq('status', 'active');

        if (agentError) throw agentError;

        // Récupérer les localisations des agents
        const { data: locations, error: locationError } = await supabase
          .from('agent_locations')
          .select('agent_id, address, zone, is_active')
          .in('agent_id', agentIds)
          .eq('is_active', true);

        if (locationError) {
          console.warn("Erreur lors de la récupération des localisations:", locationError);
        }

        // Combiner les données
        const activeAgentIds = agentDetails?.map(agent => agent.user_id) || [];
        const filteredAgents = agentsData
          ?.filter(agent => activeAgentIds.includes(agent.id))
          .map(agent => {
            const location = locations?.find(loc => loc.agent_id === agent.id);
            return {
              ...agent,
              status: 'active',
              address: location?.address,
              zone: location?.zone
            };
          }) || [];

        setAgents(filteredAgents);
      } else {
        setAgents([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des agents:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la liste des agents",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const getPaymentMethods = () => {
    if (!profile?.country) return;
    
    const country = countries.find(c => c.name === profile.country);
    setPaymentMethods(country?.paymentMethods || []);
  };

  const handleCallAgent = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleCopyPhone = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber);
    toast({
      title: "Numéro copié",
      description: "Le numéro de téléphone a été copié dans le presse-papiers",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Recharger mon compte
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Modes de paiement disponibles */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Modes de paiement disponibles en {profile?.country}
            </h3>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {method}
                </Badge>
              ))}
            </div>
          </div>

          {/* Liste des agents */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Agents disponibles dans votre région
            </h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : agents.length > 0 ? (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <Card key={agent.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{agent.full_name}</span>
                            <Badge variant="outline" className="text-xs">
                              Agent actif
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 mb-1">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{agent.phone}</span>
                          </div>

                          {agent.address && (
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {agent.address} {agent.zone && `(${agent.zone})`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleCallAgent(agent.phone)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Appeler
                          </Button>
                          <Button
                            onClick={() => handleCopyPhone(agent.phone)}
                            variant="outline"
                            size="sm"
                          >
                            Copier
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    Aucun agent disponible dans votre région pour le moment.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Veuillez réessayer plus tard ou contactez le support.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Instructions :</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Contactez un agent de votre région pour effectuer un dépôt ou retrait</li>
              <li>• Vérifiez que l'agent accepte votre mode de paiement préféré</li>
              <li>• Préparez une pièce d'identité et votre numéro de téléphone</li>
              <li>• L'agent vous guidera pour finaliser votre transaction</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
