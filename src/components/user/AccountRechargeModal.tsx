
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, MapPin, Copy, CreditCard, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface Agent {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  status: string;
  user_id: string;
  agent_location?: {
    address: string;
    zone: string;
    is_active: boolean;
  } | null;
}

interface PaymentMethod {
  id: string;
  payment_number: string;
  provider_name: string;
  bill_type: string;
  description: string;
}

const AccountRechargeModal = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch agents in user's territory
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents-territory', profile?.country],
    queryFn: async () => {
      if (!profile?.country) return [];
      
      // First get agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('id, full_name, phone, country, status, user_id')
        .eq('country', profile.country)
        .eq('status', 'active')
        .limit(10);

      if (agentsError) throw agentsError;
      if (!agentsData) return [];

      // Then get locations for these agents
      const agentUserIds = agentsData.map(agent => agent.user_id);
      const { data: locationsData, error: locationsError } = await supabase
        .from('agent_locations')
        .select('agent_id, address, zone, is_active')
        .in('agent_id', agentUserIds)
        .eq('is_active', true);

      if (locationsError) {
        console.warn('Could not fetch agent locations:', locationsError);
      }

      // Combine agents with their locations
      const agentsWithLocations: Agent[] = agentsData.map(agent => ({
        ...agent,
        agent_location: locationsData?.find(loc => loc.agent_id === agent.user_id) || null
      }));

      return agentsWithLocations;
    },
    enabled: !!profile?.country && isOpen,
  });

  // Fetch payment methods for user's country
  const { data: paymentMethods, isLoading: paymentLoading } = useQuery({
    queryKey: ['payment-methods', profile?.country],
    queryFn: async () => {
      if (!profile?.country) return [];
      
      const { data, error } = await supabase
        .from('bill_payment_numbers')
        .select('*')
        .eq('country', profile.country)
        .eq('is_active', true);

      if (error) throw error;
      return data as PaymentMethod[];
    },
    enabled: !!profile?.country && isOpen,
  });

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copié dans le presse-papiers`);
  };

  const callAgent = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            💰 Recharger mon compte
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Trouvez un agent près de chez vous ou utilisez les moyens de paiement disponibles
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Methods Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Moyens de paiement disponibles - {profile?.country}
            </h3>
            
            {paymentLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : paymentMethods && paymentMethods.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <Card key={method.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{method.provider_name}</h4>
                          <p className="text-sm text-muted-foreground">{method.bill_type}</p>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          {method.bill_type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {method.payment_number}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(method.payment_number, 'Numéro de paiement')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {method.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {method.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Aucun moyen de paiement disponible pour {profile?.country}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Agents Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Agents dans votre territoire - {profile?.country}
            </h3>
            
            {agentsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : agents && agents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{agent.full_name}</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Actif
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Phone Number */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="font-mono">{agent.phone}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(agent.phone, 'Numéro')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => callAgent(agent.phone)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Location */}
                        {agent.agent_location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div className="text-sm">
                              <p>{agent.agent_location.address}</p>
                              {agent.agent_location.zone && (
                                <p className="text-muted-foreground">Zone: {agent.agent_location.zone}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Aucun agent actif trouvé dans votre territoire ({profile?.country})
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Instructions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Contactez un agent pour effectuer un dépôt ou retrait</li>
                <li>• Utilisez les numéros de paiement pour les transferts mobiles</li>
                <li>• Vérifiez toujours l'identité de l'agent avant toute transaction</li>
                <li>• Gardez vos reçus de transaction comme preuve</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountRechargeModal;
