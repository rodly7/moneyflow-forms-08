
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAutomaticBills } from '@/hooks/useAutomaticBills';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Wifi,
  CheckCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import BillCard from './BillCard';
import SimpleBillForm from './SimpleBillForm';

const AutomaticBillsManager = () => {
  const { 
    bills, 
    loading, 
    createBill, 
    updateBill, 
    deleteBill, 
    toggleAutomation,
    payBillManually,
    paymentHistory 
  } = useAutomaticBills();
  
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bill_name: '',
    amount: '',
    due_date: '',
    recurrence: 'monthly',
    is_automated: false,
    recipient_phone: ''
  });

  const resetForm = () => {
    setFormData({
      bill_name: '',
      amount: '',
      due_date: '',
      recurrence: 'monthly',
      is_automated: false,
      recipient_phone: ''
    });
    setShowForm(false);
    setEditingBill(null);
  };

  const handleCreateBill = async () => {
    if (!formData.bill_name.trim() || !formData.amount || !formData.due_date || !formData.recipient_phone) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être un nombre positif",
        variant: "destructive"
      });
      return;
    }

    try {
      await createBill({
        bill_name: formData.bill_name.trim(),
        amount: amount,
        due_date: formData.due_date,
        recurrence: formData.recurrence,
        priority: 1,
        is_automated: formData.is_automated,
        status: 'pending',
        payment_number: formData.recipient_phone,
        meter_number: ''
      });

      resetForm();
    } catch (error) {
      console.error('Error creating bill:', error);
    }
  };

  const handleEditBill = async () => {
    if (!editingBill) return;

    if (!formData.bill_name.trim() || !formData.amount || !formData.due_date || !formData.recipient_phone) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être un nombre positif",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateBill(editingBill, {
        bill_name: formData.bill_name.trim(),
        amount: amount,
        due_date: formData.due_date,
        recurrence: formData.recurrence,
        is_automated: formData.is_automated,
        payment_number: formData.recipient_phone
      });

      resetForm();
    } catch (error) {
      console.error('Error updating bill:', error);
    }
  };

  const startEdit = (bill: any) => {
    setEditingBill(bill.id);
    setFormData({
      bill_name: bill.bill_name || '',
      amount: bill.amount?.toString() || '',
      due_date: bill.due_date || '',
      recurrence: bill.recurrence || 'monthly',
      is_automated: bill.is_automated || false,
      recipient_phone: bill.payment_number || ''
    });
    setShowForm(true);
  };

  const handlePayNow = async (billId: string) => {
    try {
      await payBillManually(billId);
    } catch (error) {
      console.error('Error paying bill:', error);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    try {
      await deleteBill(billId);
    } catch (error) {
      console.error('Error deleting bill:', error);
    }
  };

  const handleToggleAutomation = async (billId: string, isAutomated: boolean) => {
    try {
      await toggleAutomation(billId, isAutomated);
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Factures Automatiques</h1>
          <p className="text-gray-600">Gérez vos paiements récurrents</p>
        </div>
        
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle facture
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh]">
            <SimpleBillForm
              editingBill={editingBill}
              formData={formData}
              setFormData={setFormData}
              onSubmit={editingBill ? handleEditBill : handleCreateBill}
              onCancel={resetForm}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Bills List */}
      <div className="grid gap-4">
        {bills.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <Wifi className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Aucune facture automatique</h3>
              <p className="text-gray-500 mb-4">Créez votre première facture automatique pour simplifier vos paiements.</p>
              <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Créer une facture
              </Button>
            </CardContent>
          </Card>
        ) : (
          bills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              loading={loading}
              onEdit={startEdit}
              onDelete={handleDeleteBill}
              onToggleAutomation={handleToggleAutomation}
              onPayNow={handlePayNow}
            />
          ))
        )}
      </div>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card className="shadow-lg border-0 bg-white">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Historique des Paiements
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="space-y-3">
              {paymentHistory.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">
                      Facture payée - {payment.amount.toLocaleString()} FCFA
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(payment.payment_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <Badge variant={payment.status === 'success' ? 'default' : 'destructive'} className={payment.status === 'success' ? 'bg-green-500' : ''}>
                    {payment.status === 'success' ? 'Réussi' : 'Échoué'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutomaticBillsManager;
