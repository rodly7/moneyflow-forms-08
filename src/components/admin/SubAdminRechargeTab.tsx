import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/currency";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserPlus, UserCheck, UserX, DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle, XCircle, Clock, Filter, RefreshCw, Download, Eye, MessageSquare, Phone, Mail, MapPin } from "lucide-react";

interface SubAdminRechargeTabProps {
  // Define any props here
}

export const SubAdminRechargeTab: React.FC<SubAdminRechargeTabProps> = ({ /* props */ }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientData, setClientData] = useState<any | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSearchClient = async () => {
    setIsProcessing(true);
    setClientData(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phoneNumber)
        .single();

      if (error) {
        console.error("Error searching client:", error);
        toast({
          title: "Error",
          description: "Could not find client with that phone number.",
          variant: "destructive",
        });
      } else {
        setClientData(data);
        toast({
          title: "Client Found",
          description: `Client ${data.full_name} found.`,
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRechargeClient = async () => {
    if (!clientData) {
      toast({
        title: "Error",
        description: "Please search for a client first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const rechargeAmount = parseFloat(amount);

      if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid recharge amount.",
          variant: "destructive",
        });
        return;
      }

      // Call the function to increment the balance
      const { error } = await supabase.rpc('increment_balance', {
        user_id: clientData.id,
        amount: rechargeAmount
      });

      if (error) {
        console.error("Error recharging client:", error);
        toast({
          title: "Error",
          description: "Could not recharge client.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Client ${clientData.full_name} recharged successfully with ${amount} XAF.`,
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recharge Client Account</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="phoneNumber">Client Phone Number</Label>
          <Input
            type="tel"
            id="phoneNumber"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <Button onClick={handleSearchClient} disabled={isProcessing}>
            {isProcessing ? "Searching..." : "Search Client"}
          </Button>
        </div>

        {clientData && (
          <div className="border rounded-md p-4">
            <h4 className="text-lg font-semibold">Client Information</h4>
            <p>Name: {clientData.full_name}</p>
            <p>Phone: {clientData.phone}</p>
            <p>Balance: {formatCurrency(clientData.balance, "XAF")}</p>
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="amount">Recharge Amount (XAF)</Label>
          <Input
            type="number"
            id="amount"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button onClick={handleRechargeClient} disabled={isProcessing || !clientData}>
            {isProcessing ? "Recharging..." : "Recharge Client"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
