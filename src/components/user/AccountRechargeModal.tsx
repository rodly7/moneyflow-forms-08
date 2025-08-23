
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, MapPin, Copy, CreditCard, Wallet, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Agent {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  status: string;
  user_id: string;
  commission_balance: number;
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

type OperationType = 'recharge' | 'retrait';
type StepType = 'operation' | 'payment_method' | 'agent_selection' | 'request_details';

const AccountRechargeModal = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>('operation');
  const [selectedOperation, setSelectedOperation] = useState<OperationType | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Reset state when modal closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCurrentStep('operation');
      setSelectedOperation(null);
      setSelectedPaymentMethod(null);
      setSelectedAgent(null);
      setAmount('');
      setDescription('');
    }
  };

  // Fetch agents with available cash
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents-with-cash', profile?.country],
    queryFn: async () => {
      if (!profile?.country) return [];
      
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('id, full_name, phone, country, status, user_id, commission_balance')
        .eq('country', profile.country)
        .eq('status', 'active')
        .gt('commission_balance', 0)
        .limit(10);

      if (agentsError) throw agentsError;
      if (!agentsData) return [];

      const agentUserIds = agentsData.map(agent => agent.user_id);
      const { data: locationsData, error: locationsError } = await supabase
        .from('agent_locations')
        .select('agent_id, address, zone, is_active')
        .in('agent_id', agentUserIds)
        .eq('is_active', true);

      if (locationsError) {
        console.warn('Could not fetch agent locations:', locationsError);
      }

      const agentsWithLocations: Agent[] = agentsData.map(agent => ({
        ...agent,
        agent_location: locationsData?.find(loc => loc.agent_id === agent.user_id) || null
      }));

      return agentsWithLocations;
    },
    enabled: !!profile?.country && isOpen && currentStep === 'agent_selection',
  });

  // Fetch payment methods
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
    enabled: !!profile?.country && isOpen && currentStep === 'payment_method',
  });

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copié dans le presse-papiers`);
  };

  const callAgent = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleSubmitRequest = async () => {
    if (!selectedAgent || !amount || !selectedOperation) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      // Here you would create the request in the database
      toast.success(`Demande de ${selectedOperation} envoyée à l'agent ${selectedAgent.full_name}`);
      setIsOpen(false);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la demande');
    }
  };

  const renderOperationSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">
        Que souhaitez-vous faire ?
      </h3>
      <div className="grid grid-cols-1 gap-4">
        <Card 
          className={`cursor-pointer transition-colors hover:bg-accent ${selectedOperation === 'recharge' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => {
            setSelectedOperation('recharge');
            setCurrentStep('payment_method');
          }}
        >
          <CardContent className="p-6 text-center">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <h4 className="font-semibold">Recharger mon compte</h4>
            <p className="text-sm text-muted-foreground">Ajouter de l'argent à votre compte</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-colors hover:bg-accent ${selectedOperation === 'retrait' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => {
            setSelectedOperation('retrait');
            setCurrentStep('agent_selection');
          }}
        >
          <CardContent className="p-6 text-center">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h4 className="font-semibold">Retirer de l'argent</h4>
            <p className="text-sm text-muted-foreground">Retirer de l'argent de votre compte</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPaymentMethodSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep('operation')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          Choisissez un mode de paiement
        </h3>
      </div>
      
      {paymentLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : paymentMethods && paymentMethods.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {paymentMethods.map((method) => (
            <Card 
              key={method.id} 
              className={`cursor-pointer transition-colors hover:bg-accent border-l-4 border-l-green-500 ${selectedPaymentMethod?.id === method.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => {
                setSelectedPaymentMethod(method);
                setCurrentStep('agent_selection');
              }}
            >
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
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(method.payment_number, 'Numéro de paiement');
                    }}
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
  );

  const renderAgentSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCurrentStep(selectedOperation === 'recharge' ? 'payment_method' : 'operation')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          Choisissez un agent disponible
        </h3>
      </div>
      
      {agentsLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : agents && agents.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {agents.map((agent) => (
            <Card 
              key={agent.id} 
              className={`cursor-pointer transition-colors hover:bg-accent border-l-4 border-l-blue-500 ${selectedAgent?.id === agent.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => {
                setSelectedAgent(agent);
                setCurrentStep('request_details');
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{agent.full_name}</span>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Disponible
                    </Badge>
                    <Badge variant="outline" className="text-blue-600">
                      {agent.commission_balance.toLocaleString()} FCFA
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono">{agent.phone}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(agent.phone, 'Numéro');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          callAgent(agent.phone);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

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
              Aucun agent avec du cash disponible dans votre territoire ({profile?.country})
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderRequestDetails = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep('agent_selection')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          Détails de la demande
        </h3>
      </div>

      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2">Récapitulatif</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Opération:</span>
              <span className="font-medium">{selectedOperation === 'recharge' ? 'Recharge' : 'Retrait'}</span>
            </div>
            {selectedPaymentMethod && (
              <div className="flex justify-between">
                <span>Mode de paiement:</span>
                <span className="font-medium">{selectedPaymentMethod.provider_name}</span>
              </div>
            )}
            {selectedAgent && (
              <div className="flex justify-between">
                <span>Agent:</span>
                <span className="font-medium">{selectedAgent.full_name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <Label htmlFor="amount">Montant (FCFA) *</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Entrez le montant"
            min="1000"
            step="1000"
          />
        </div>

        <div>
          <Label htmlFor="description">Description (optionnel)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ajoutez une description"
          />
        </div>

        <Button 
          onClick={handleSubmitRequest}
          className="w-full"
          disabled={!amount || !selectedAgent}
        >
          <Send className="w-4 h-4 mr-2" />
          Envoyer la demande
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'operation':
        return renderOperationSelection();
      case 'payment_method':
        return renderPaymentMethodSelection();
      case 'agent_selection':
        return renderAgentSelection();
      case 'request_details':
        return renderRequestDetails();
      default:
        return renderOperationSelection();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            💰 Recharger mon compte
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Gérez vos recharges et retraits facilement
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {renderCurrentStep()}

          {/* Instructions générales */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Instructions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Contactez l'agent choisi pour finaliser votre opération</li>
                <li>• Vérifiez toujours l'identité de l'agent avant toute transaction</li>
                <li>• Gardez vos reçus de transaction comme preuve</li>
                <li>• Les agents affichés ont du cash disponible</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountRechargeModal;
