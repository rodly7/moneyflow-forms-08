import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, Play, Calendar, DollarSign, Settings, Eye, Phone, Hash, User } from 'lucide-react';

interface AutomaticBill {
  id: string;
  bill_name: string;
  amount: number;
  due_date: string;
  recurrence: string;
  is_automated: boolean;
  priority: number;
  status: string;
  last_payment_date?: string;
  next_due_date?: string;
  payment_attempts: number;
  max_attempts: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  payment_number?: string;
  provider_number?: string;
  provider_name?: string;
  meter_number?: string;
  bill_type?: string;
  provider?: string;
}

interface BillCardProps {
  bill: AutomaticBill;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAutomation: (isAutomated: boolean) => void;
  onPayNow: () => void;
}

export const BillCard: React.FC<BillCardProps> = ({
  bill,
  onEdit,
  onDelete,
  onToggleAutomation,
  onPayNow
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Payée</Badge>;
      case 'pending':
        return <Badge variant="outline">En attente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échec</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRecurrenceText = (recurrence: string) => {
    switch (recurrence) {
      case 'monthly':
        return 'Mensuel';
      case 'quarterly':
        return 'Trimestriel';
      case 'yearly':
        return 'Annuel';
      case 'once':
        return 'Une fois';
      default:
        return recurrence;
    }
  };

  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{bill.bill_name}</h3>
              <p className="text-sm text-muted-foreground">
                {bill.amount.toLocaleString()} FCFA • {getRecurrenceText(bill.recurrence)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(bill.status)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Échéance: {new Date(bill.due_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Priorité: {bill.priority}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Automatisation:</span>
            <Switch
              checked={bill.is_automated}
              onCheckedChange={onToggleAutomation}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Détails de la facture</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nom</p>
                      <p className="font-semibold">{bill.bill_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Montant</p>
                      <p className="font-semibold">{bill.amount.toLocaleString()} FCFA</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Type</p>
                      <p>{bill.bill_type || bill.bill_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Récurrence</p>
                      <p>{getRecurrenceText(bill.recurrence)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Échéance</p>
                      <p>{new Date(bill.due_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Statut</p>
                      {getStatusBadge(bill.status)}
                    </div>
                  </div>

                  {bill.provider_name && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        <User className="h-4 w-4 inline mr-1" />
                        Fournisseur
                      </p>
                      <p className="font-medium">{bill.provider_name}</p>
                    </div>
                  )}

                  {bill.provider_number && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Numéro du fournisseur
                      </p>
                      <p className="font-mono">{bill.provider_number}</p>
                    </div>
                  )}

                  {bill.meter_number && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        <Hash className="h-4 w-4 inline mr-1" />
                        Numéro de compteur
                      </p>
                      <p className="font-mono">{bill.meter_number}</p>
                    </div>
                  )}

                  {bill.last_payment_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dernier paiement</p>
                      <p>{new Date(bill.last_payment_date).toLocaleDateString()}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Tentatives: {bill.payment_attempts}/{bill.max_attempts}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Auto:</span>
                      <Switch
                        checked={bill.is_automated}
                        onCheckedChange={onToggleAutomation}
                      />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onPayNow}
              disabled={bill.status === 'paid'}
            >
              <Play className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};