import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BillCardProps {
  bill: {
    id: string;
    bill_name: string;
    amount: number;
    due_date: string;
    recurrence: string;
    is_automated: boolean;
    status: string;
    last_payment_date?: string;
    payment_number?: string;
    meter_number?: string;
  };
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
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Payée</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />En retard</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Échec</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      onDelete();
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{bill.bill_name}</h3>
              {getStatusBadge(bill.status)}
            </div>
            
            <div className="flex items-center gap-1 text-lg font-bold text-primary mb-2">
              <DollarSign className="w-4 h-4" />
              {bill.amount.toLocaleString()} FCFA
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Échéance: {new Date(bill.due_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span>Récurrence: {bill.recurrence}</span>
              </div>
              
              {bill.payment_number && (
                <div>
                  <span>N° de paiement: {bill.payment_number}</span>
                </div>
              )}
              
              {bill.meter_number && (
                <div>
                  <span>N° compteur: {bill.meter_number}</span>
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              checked={bill.is_automated}
              onCheckedChange={onToggleAutomation}
            />
            <span className="text-sm text-muted-foreground">
              Paiement automatique
            </span>
          </div>

          {bill.status === 'pending' && (
            <Button 
              size="sm" 
              onClick={onPayNow}
              className="ml-2"
            >
              Payer maintenant
            </Button>
          )}
        </div>

        {bill.status === 'paid' && bill.last_payment_date && (
          <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
            Dernière paiement: {new Date(bill.last_payment_date).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};