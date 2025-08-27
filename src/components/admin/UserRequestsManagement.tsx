
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface UserRequestsManagementProps {
  type: 'verification' | 'general';
}

interface UserRequest {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  country: string;
  address: string;
  role: 'user' | 'agent';
  balance: number;
  is_verified?: boolean;
  avatar_url?: string;
  id_card_url?: string;
  id_card_number?: string;
  type: string;
}

const UserRequestsManagement = ({ type }: UserRequestsManagementProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<'user' | 'agent' | 'all'>('user');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const fetchUserRequests = async () => {
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      console.log('🔄 Chargement des demandes utilisateurs...');

      let query = supabase
        .from('profiles')
        .select('*');

      if (selectedRole && selectedRole !== "all") {
        query = query.eq('role', selectedRole);
      }

      if (searchQuery) {
        query = query.ilike('full_name', `%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Erreur lors de la récupération des demandes:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les demandes",
          variant: "destructive"
        });
        return;
      }

      // Transform profiles data to match UserRequest interface
      const transformedData: UserRequest[] = data?.map(profile => ({
        id: profile.id,
        created_at: profile.created_at,
        full_name: profile.full_name || 'Non spécifié',
        phone: profile.phone,
        country: profile.country || 'Non spécifié',
        address: profile.address || 'Non spécifié',
        role: profile.role === 'admin' || profile.role === 'sub_admin' ? 'agent' : profile.role as 'user' | 'agent',
        balance: profile.balance || 0,
        is_verified: profile.is_verified,
        avatar_url: profile.avatar_url,
        id_card_url: profile.id_card_url,
        id_card_number: profile.id_card_number,
        type: type
      })) || [];

      setRequests(transformedData);
    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserRequests();
  }, [selectedRole, searchQuery, type]);

  const handleApprove = async (request: UserRequest) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
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

      fetchUserRequests();
    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (request: UserRequest) => {
    if (!request) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: true, banned_reason: rejectionReason })
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

      fetchUserRequests();
    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setRejectionReason("");
      setSelectedRequest(null);
      setIsRejectModalOpen(false);
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

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Gestion des Demandes ({requests.length})
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fetchUserRequests()}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtrer
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Filter Section */}
        {isFilterOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select value={selectedRole} onValueChange={(value: 'user' | 'agent' | 'all') => setSelectedRole(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="all">Tous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="mb-4">
          <Label htmlFor="search">Rechercher</Label>
          <div className="relative">
            <Input
              type="text"
              id="search"
              placeholder="Rechercher par nom"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute top-2.5 right-3 w-5 h-5 text-gray-500" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune demande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.full_name}</div>
                      <div className="text-sm text-gray-500">{request.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">{request.role}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(request.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.is_verified ? (
                        <Badge className="bg-green-100 text-green-800">Vérifié</Badge>
                      ) : (
                        <Badge variant="outline">En attente</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {!request.is_verified && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsRejectModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeter
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(request)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approuver
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Reject Modal */}
      {selectedRequest && isRejectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50">
          <div className="relative p-8 bg-white rounded-md max-w-md mx-auto mt-20">
            <h2 className="text-lg font-semibold mb-4">Rejeter la demande de {selectedRequest.full_name}</h2>
            <Label htmlFor="rejectionReason">Motif du rejet</Label>
            <Textarea
              id="rejectionReason"
              placeholder="Entrez le motif du rejet"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={() => handleReject(selectedRequest)} disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Rejet en cours...</span>
                  </div>
                ) : (
                  "Rejeter"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default UserRequestsManagement;
