import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Download,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/currency";

interface Request {
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

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  balance: number;
  role: string;
  created_at: string;
}

const AdminUserRequestsOverview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedTab, setSelectedTab] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [selectedTab, filterDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('status', selectedTab)
        .gte('created_at', `${filterDate}T00:00:00+00:00`)
        .lt('created_at', `${filterDate}T23:59:59+00:00`)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error("Error fetching requests:", requestsError);
        toast({
          title: "Error",
          description: "Failed to fetch withdrawal requests",
          variant: "destructive",
        });
        return;
      }

      setRequests(requestsData || []);

      const userIds = [...new Set(requestsData?.map(req => req.user_id))];

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds as string[]);

      if (usersError) {
        console.error("Error fetching users:", usersError);
        toast({
          title: "Error",
          description: "Failed to fetch user profiles",
          variant: "destructive",
        });
        return;
      }

      setUsers(usersData || []);
    } finally {
      setIsLoading(false);
    }
  };

  const approveRequest = async (requestId: string, userId: string, amount: number) => {
    setIsApproving(true);
    setSelectedRequestId(requestId);
    try {
      const { error: transferError } = await supabase.rpc('transfer_funds_admin', {
        sender_id: user?.id,
        recipient_id: userId,
        transfer_amount: amount,
        request_id: requestId
      });

      if (transferError) {
        console.error("Error during transfer:", transferError);
        toast({
          title: "Error",
          description: "Failed to approve withdrawal request",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Withdrawal request approved successfully",
      });

      fetchData();
    } finally {
      setIsApproving(false);
      setSelectedRequestId(null);
    }
  };

  const rejectRequest = async (requestId: string) => {
    setIsRejecting(true);
    setSelectedRequestId(requestId);
    try {
      const { error: rejectError } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (rejectError) {
        console.error("Error rejecting request:", rejectError);
        toast({
          title: "Error",
          description: "Failed to reject withdrawal request",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Withdrawal request rejected successfully",
      });

      fetchData();
    } finally {
      setIsRejecting(false);
      setSelectedRequestId(null);
    }
  };

  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Requests Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={selectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" onClick={() => setSelectedTab("pending")}>
              <Clock className="w-4 h-4 mr-2" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" onClick={() => setSelectedTab("approved")}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" onClick={() => setSelectedTab("rejected")}>
              <XCircle className="w-4 h-4 mr-2" />
              Rejected
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border rounded px-2 py-1"
              />
            </div>
            <Badge variant="secondary">
              {requests.length} requests
            </Badge>
          </div>
          <TabsContent value="pending">
            <ScrollArea className="h-[450px] w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-500 mt-2">No pending requests</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {requests.map((request) => {
                    const user = getUserById(request.user_id);
                    return (
                      <Card key={request.id} className="bg-white/95 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle>
                            Withdrawal Request
                            <Badge className="ml-2">{request.status}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p>
                              <strong>Date:</strong> {formatDate(request.created_at)}
                            </p>
                            <p>
                              <strong>User:</strong> {user?.full_name} ({user?.email})
                            </p>
                            <p>
                              <strong>Phone:</strong> {user?.phone}
                            </p>
                            <p>
                              <strong>Amount:</strong> {formatCurrency(request.amount, "XAF")}
                            </p>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                onClick={() => approveRequest(request.id, request.user_id, request.amount)}
                                disabled={isApproving && selectedRequestId === request.id}
                              >
                                {isApproving && selectedRequestId === request.id ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => rejectRequest(request.id)}
                                disabled={isRejecting && selectedRequestId === request.id}
                              >
                                {isRejecting && selectedRequestId === request.id ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Rejecting...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="approved">
            <ScrollArea className="h-[450px] w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-500 mt-2">No approved requests</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {requests.map((request) => {
                    const user = getUserById(request.user_id);
                    return (
                      <Card key={request.id} className="bg-white/95 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle>
                            Withdrawal Request
                            <Badge className="ml-2">{request.status}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p>
                              <strong>Date:</strong> {formatDate(request.created_at)}
                            </p>
                            <p>
                              <strong>User:</strong> {user?.full_name} ({user?.email})
                            </p>
                            <p>
                              <strong>Phone:</strong> {user?.phone}
                            </p>
                            <p>
                              <strong>Amount:</strong> {formatCurrency(request.amount, "XAF")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="rejected">
            <ScrollArea className="h-[450px] w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-500 mt-2">No rejected requests</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {requests.map((request) => {
                    const user = getUserById(request.user_id);
                    return (
                      <Card key={request.id} className="bg-white/95 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle>
                            Withdrawal Request
                            <Badge className="ml-2">{request.status}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p>
                              <strong>Date:</strong> {formatDate(request.created_at)}
                            </p>
                            <p>
                              <strong>User:</strong> {user?.full_name} ({user?.email})
                            </p>
                            <p>
                              <strong>Phone:</strong> {user?.phone}
                            </p>
                            <p>
                              <strong>Amount:</strong> {formatCurrency(request.amount, "XAF")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminUserRequestsOverview;
