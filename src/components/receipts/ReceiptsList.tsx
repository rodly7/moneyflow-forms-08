
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar } from "lucide-react";
import { generateReceipt, downloadReceipt } from "./ReceiptGenerator";
import { formatCurrency } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Receipt {
  id: string;
  transaction_id: string;
  transaction_type: string;
  receipt_data: any;
  created_at: string;
}

const ReceiptsList = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReceipts = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mappedReceipts = (data || []).map((transfer: any) => ({
        id: transfer.id,
        transaction_id: transfer.id,
        transaction_type: 'transfer',
        receipt_data: {
          amount: transfer.amount,
          fees: transfer.fees,
          recipient: transfer.recipient_full_name,
          phone: transfer.recipient_phone,
          country: transfer.recipient_country,
          status: transfer.status,
          date: transfer.created_at
        },
        created_at: transfer.created_at,
        user_id: transfer.sender_id
      }));
      
      setReceipts(mappedReceipts);
    } catch (error) {
      console.error("Erreur lors du chargement des reçus:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les reçus",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleDownloadReceipt = (receipt: Receipt) => {
    if (!profile) return;

    const transactionData = {
      id: receipt.transaction_id,
      type: receipt.transaction_type as any,
      amount: receipt.receipt_data.amount,
      recipient_name: receipt.receipt_data.recipient_name,
      recipient_phone: receipt.receipt_data.recipient_phone,
      created_at: receipt.created_at,
      status: receipt.receipt_data.status || 'completed',
      fees: receipt.receipt_data.fees
    };

    const userData = {
      full_name: profile.full_name || 'Utilisateur',
      phone: profile.phone,
      country: profile.country || 'Non défini'
    };

    const doc = generateReceipt(transactionData, userData);
    downloadReceipt(doc, receipt.transaction_id);
  };

  const getTransactionTypeLabel = (type: string) => {
    const types = {
      transfer: 'Transfert',
      withdrawal: 'Retrait',
      deposit: 'Dépôt',
      savings: 'Épargne'
    };
    return types[type as keyof typeof types] || type;
  };

  useEffect(() => {
    fetchReceipts();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Mes Reçus</h2>
      </div>

      {receipts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun reçu disponible</p>
            <p className="text-sm text-gray-500 mt-2">
              Les reçus seront générés automatiquement après vos transactions
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {receipts.map((receipt) => (
            <Card key={receipt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                        {getTransactionTypeLabel(receipt.transaction_type)}
                      </span>
                      <span className="text-sm text-gray-500">
                        #{receipt.transaction_id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(receipt.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="font-medium">
                        {formatCurrency(receipt.receipt_data.amount, "XAF")}
                      </div>
                    </div>

                    {receipt.receipt_data.recipient_name && (
                      <p className="text-sm text-gray-600 mt-1">
                        Vers: {receipt.receipt_data.recipient_name}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReceipt(receipt)}
                    className="flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiptsList;
