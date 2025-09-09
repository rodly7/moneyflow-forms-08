import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAutomaticBills } from '@/hooks/useAutomaticBills';
import { AutomaticBillForm } from './AutomaticBillForm';
import { BillCard } from './BillCard';

interface FormData {
  bill_name: string;
  amount: number;
  due_date: string;
  recurrence: string;
  is_automated: boolean;
  priority: number;
  status: string;
  payment_number: string;
  meter_number: string;
}

export const AutomaticBillsManager: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    bill_name: '',
    amount: 0,
    due_date: '',
    recurrence: 'monthly',
    is_automated: false,
    priority: 1,
    status: 'pending',
    payment_number: '',
    meter_number: ''
  });

  const {
    bills,
    paymentHistory,
    loading,
    createBill,
    updateBill,
    deleteBill,
    toggleAutomation,
    payBillManually
  } = useAutomaticBills();

  const handleCreateBill = async () => {
    try {
      await createBill(formData);
      resetForm();
    } catch (error) {
      console.error('Error creating bill:', error);
    }
  };

  const handleEditBill = async () => {
    if (!editingBill) return;
    
    try {
      await updateBill(editingBill.id, formData);
      resetForm();
    } catch (error) {
      console.error('Error updating bill:', error);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        await deleteBill(billId);
      } catch (error) {
        console.error('Error deleting bill:', error);
      }
    }
  };

  const handleToggleAutomation = async (billId: string, isAutomated: boolean) => {
    try {
      await toggleAutomation(billId, isAutomated);
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const handlePayNow = async (billId: string) => {
    try {
      await payBillManually(billId);
    } catch (error) {
      console.error('Error paying bill:', error);
    }
  };

  const startEdit = (bill: any) => {
    setEditingBill(bill);
    setFormData({
      bill_name: bill.bill_name,
      amount: bill.amount,
      due_date: bill.due_date,
      recurrence: bill.recurrence,
      is_automated: bill.is_automated,
      priority: bill.priority,
      status: bill.status,
      payment_number: bill.payment_number || '',
      meter_number: bill.meter_number || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      bill_name: '',
      amount: 0,
      due_date: '',
      recurrence: 'monthly',
      is_automated: false,
      priority: 1,
      status: 'pending',
      payment_number: '',
      meter_number: ''
    });
    setEditingBill(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Factures Automatiques</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gérez vos factures récurrentes et automatisez vos paiements
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <AutomaticBillForm
              editingBill={editingBill}
              formData={formData}
              setFormData={setFormData}
              onSubmit={editingBill ? handleEditBill : handleCreateBill}
              onCancel={resetForm}
              loading={loading}
            />
          )}

          <div className="space-y-4">
            {bills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune facture automatique configurée
              </div>
            ) : (
              bills.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  onEdit={() => startEdit(bill)}
                  onDelete={() => handleDeleteBill(bill.id)}
                  onToggleAutomation={(isAutomated) => 
                    handleToggleAutomation(bill.id, isAutomated)
                  }
                  onPayNow={() => handlePayNow(bill.id)}
                />
              ))
            )}
          </div>

          {paymentHistory.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Historique des paiements</h3>
              <div className="space-y-2">
                {paymentHistory.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{payment.amount.toLocaleString()} FCFA</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      payment.status === 'success' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.status === 'success' ? 'Réussi' : 'Échec'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};