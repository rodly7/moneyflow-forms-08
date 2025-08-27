import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import { Users, UserCheck, UserX, Clock, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserRequest {
  id: string;
  user_id: string;
  type: string;
  status: string;
  amount: number;
  created_at: string;
}

interface UserRequestsManagementProps {
  type: string;
}

const UserRequestsManagement = ({ type }: UserRequestsManagementProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['user-requests', type, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('user_requests')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('user_id', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erreur lors de la récupération des demandes:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les demandes",
          variant: "destructive"
        });
        return [];
      }

      return data || [];
    },
  });

  const handleApprove = async (request: UserRequest) => {
    try {
      // Mettre à jour le statut de la demande
      const { error } = await supabase
        .from('user_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);

      if (error) {
        console.error("Erreur lors de l'approbation de la demande:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'approuver la demande",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Demande approuvée",
        description: "La demande a été approuvée avec succès",
      });

      refetch(); // Actualiser les données après l'approbation

    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (request: UserRequest) => {
    try {
      // Mettre à jour le statut de la demande
      const { error } = await supabase
        .from('user_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);

      if (error) {
        console.error("Erreur lors du rejet de la demande:", error);
        toast({
          title: "Erreur",
          description: "Impossible de rejeter la demande",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Demande rejetée",
        description: "La demande a été rejetée avec succès",
      });

      refetch(); // Actualiser les données après le rejet

    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Demandes des Utilisateurs ({type})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Demandes des Utilisateurs ({type})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Rechercher par ID utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute top-2.5 right-3 w-5 h-5 text-gray-500" />
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {requests?.map((request) => (
            <div 
              key={request.id}
              className="flex items-center justify-between p-4 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{request.user_id}</h4>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusText(request.status)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Type: {request.type}
                </p>
                <p className="text-sm text-muted-foreground">
                  Montant: {formatCurrency(request.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  <Clock className="inline-block w-3 h-3 mr-1" />
                  {formatDate(request.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {request.status === 'pending' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApprove(request)}
                      className="text-green-600 hover:bg-green-50"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReject(request)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {requests?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune demande trouvée</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRequestsManagement;
