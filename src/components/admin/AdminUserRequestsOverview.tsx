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
  UserCheck, 
  UserX, 
  Clock, 
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  RefreshCw,
  MessageSquare,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  DollarSign
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface UserRequest {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  country: string;
  address: string;
  city: string;
  id_type: string;
  id_number: string;
  id_recto_url: string;
  id_verso_url: string;
  proof_of_address_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  role: 'user' | 'agent';
  balance: number;
}

const AdminUserRequestsOverview = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedRole, setSelectedRole] = useState("user");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const fetchUserRequests = async () => {
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .not('id_recto_url', 'is', null)
        .not('id_verso_url', 'is', null)
        .not('proof_of_address_url', 'is', null);

      if (selectedStatus !== "all") {
        query = query.eq('status', selectedStatus);
      }

      if (selectedRole !== "all") {
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

      setRequests(data || []);
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
  }, [selectedStatus, selectedRole, searchQuery]);

  const handleApprove = async (requestId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', requestId);

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

  const handleReject = async () => {
    if (!selectedRequest) return;

    setIsLoading(true);
    setIsRejectModalOpen(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected', rejection_reason: rejectionReason })
        .eq('id', selectedRequest.id);

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
          Demandes Utilisateurs ({requests.length})
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
              <Label htmlFor="status">Statut</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                  <SelectItem value="all">Tous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value)}>
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
                    Date de la demande
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
                      <div className="text-sm text-gray-500">{request.email}</div>
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
                      {request.status === 'pending' && (
                        <Badge variant="outline">En attente</Badge>
                      )}
                      {request.status === 'approved' && (
                        <Badge className="bg-green-100 text-green-800">Approuvé</Badge>
                      )}
                      {request.status === 'rejected' && (
                        <Badge className="bg-red-100 text-red-800">Rejeté</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {request.status === 'pending' && (
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
                            onClick={() => handleApprove(request.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approuver
                          </Button>
                        </div>
                      )}
                      {request.status === 'rejected' && (
                        <div className="text-sm text-red-500">
                          Motif: {request.rejection_reason || 'Non spécifié'}
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
      {selectedRequest && (
        <div
          className={`fixed inset-0 z-50 overflow-auto bg-black/50 ${isRejectModalOpen ? 'block' : 'hidden'
            }`}
        >
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
              <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
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

export default AdminUserRequestsOverview;
