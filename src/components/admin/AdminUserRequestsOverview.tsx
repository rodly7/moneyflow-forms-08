import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Filter,
  RefreshCw
} from "lucide-react";

interface UserRequest {
  id: string;
  user_id: string;
  type: string;
  details: any;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

const AdminUserRequestsOverview = () => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { toast } = useToast();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('user_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      if (searchQuery) {
        query = query.ilike('details', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des requêtes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les requêtes utilisateur",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterType, searchQuery]);

  const handleApprove = async (id: string) => {
    return handleAction(id, 'approved');
  };

  const handleReject = async (id: string) => {
    return handleAction(id, 'rejected');
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setIsActioning(true);
    try {
      const { error } = await supabase
        .from('user_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Requête ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`,
      });
      fetchRequests();
      closeModal();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la requête:", error);
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour la requête: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsActioning(false);
    }
  };

  const openModal = (request: UserRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setIsModalOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 mr-2 text-blue-600" />
          Aperçu des Requêtes Utilisateur
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="search">Rechercher:</Label>
            <Input
              type="text"
              id="search"
              placeholder="Rechercher par détails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="deposit">Dépôt</SelectItem>
                <SelectItem value="withdrawal">Retrait</SelectItem>
                <SelectItem value="account_update">Mise à jour du compte</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={fetchRequests} 
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Détails</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  <div className="flex items-center justify-center">
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Chargement des requêtes...
                  </div>
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Aucune requête trouvée.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.type}</TableCell>
                  <TableCell>
                    {typeof request.details === 'string' ? (
                      request.details
                    ) : (
                      <ul>
                        {Object.entries(request.details).map(([key, value]) => (
                          <li key={key}>
                            {key}: {String(value)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        request.status === 'pending'
                          ? 'secondary'
                          : request.status === 'approved'
                          ? 'success'
                          : 'destructive'
                      }
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(request.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(request)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Modal Detail */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Détails de la Requête</DialogTitle>
            </DialogHeader>
            {selectedRequest ? (
              <div className="grid gap-4">
                <div>
                  <Label>Type de Requête</Label>
                  <Input value={selectedRequest.type} readOnly />
                </div>
                <div>
                  <Label>Détails</Label>
                  <Textarea
                    value={JSON.stringify(selectedRequest.details, null, 2)}
                    readOnly
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <Label>Statut Actuel</Label>
                  <Input value={selectedRequest.status} readOnly />
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={closeModal}
                    disabled={isActioning}
                  >
                    Annuler
                  </Button>
                  <div className="flex gap-2">
                    {selectedRequest.status === 'pending' && (
                      <>
                        <Button
                          variant="success"
                          onClick={() => handleApprove(selectedRequest.id)}
                          disabled={isActioning}
                        >
                          {isActioning ? (
                            <div className="flex items-center justify-center">
                              <Clock className="mr-2 h-4 w-4 animate-spin" />
                              Approbation...
                            </div>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approuver
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(selectedRequest.id)}
                          disabled={isActioning}
                        >
                          {isActioning ? (
                            <div className="flex items-center justify-center">
                              <Clock className="mr-2 h-4 w-4 animate-spin" />
                              Rejet...
                            </div>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Rejeter
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p>Chargement des détails...</p>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminUserRequestsOverview;
