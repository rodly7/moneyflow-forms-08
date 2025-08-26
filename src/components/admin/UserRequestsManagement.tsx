import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, Clock, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";

interface WithdrawalRequest {
  id: string;
  created_at: string;
  user_id: string;
  agent_id: string;
  agent_name: string;
  agent_phone: string;
  withdrawal_phone: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
}

export const UserRequestsManagement = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawalRequests();
  }, []);

  const fetchWithdrawalRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching withdrawal requests:", error);
        return;
      }

      setRequests(data || []);
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: string) => {
    await updateRequestStatus(requestId, 'approved');
  };

  const rejectRequest = async (requestId: string) => {
    await updateRequestStatus(requestId, 'rejected');
  };

  const updateRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) {
        console.error(`Error updating request status to ${status}:`, error);
        return;
      }

      // Refresh requests after update
      fetchWithdrawalRequests();
    } catch (error) {
      console.error(`Error updating request status to ${status}:`, error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Demandes de Retrait
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            Chargement des demandes...
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center p-4">Aucune demande de retrait en attente.</div>
        ) : (
          <ScrollArea className="h-[450px] w-full">
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div key={request.id} className="py-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium">Client</div>
                      <div className="text-gray-500">{request.user_id}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Agent</div>
                      <div className="text-gray-500">{request.agent_name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Montant</div>
                      <div className="text-gray-500">{formatCurrency(request.amount, 'XAF')}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Actions</div>
                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => approveRequest(request.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              Approuver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => rejectRequest(request.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              Rejeter
                            </Button>
                          </>
                        )}
                        {request.status !== 'pending' && (
                          <Badge
                            variant={request.status === 'approved' ? 'outline' : 'destructive'}
                          >
                            {request.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

