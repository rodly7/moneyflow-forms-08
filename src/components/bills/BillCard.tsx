
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  Zap, 
  Calendar, 
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BillCardProps {
  bill: any;
  loading: boolean;
  onEdit: (bill: any) => void;
  onDelete: (billId: string) => void;
  onToggleAutomation: (billId: string, isAutomated: boolean) => void;
  onPayNow: (billId: string) => void;
}

const BillCard = ({ bill, loading, onEdit, onDelete, onToggleAutomation, onPayNow }: BillCardProps) => {
  const getStatusBadge = (bill: any) => {
    if (bill.status === 'paid') {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="w-3 h-3 mr-1" />Payée</Badge>;
    }
    
    const dueDate = parseISO(bill.due_date);
    const today = new Date();
    
    if (isBefore(dueDate, today)) {
      return <Badge variant="destructive" className="bg-red-500 text-white"><AlertCircle className="w-3 h-3 mr-1" />En retard</Badge>;
    }
    
    const threeDaysFromNow = addDays(today, 3);
    if (isBefore(dueDate, threeDaysFromNow)) {
      return <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white"><Clock className="w-3 h-3 mr-1" />Bientôt due</Badge>;
    }
    
    return <Badge variant="outline" className="border-blue-300 text-blue-600"><Calendar className="w-3 h-3 mr-1" />En attente</Badge>;
  };

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      onDelete(bill.id);
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white hover:-translate-y-1 touch-manipulation">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Header avec nom et statut */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-800 truncate">{bill.bill_name}</h3>
              {getStatusBadge(bill)}
            </div>
            
            {/* Actions mobiles - Boutons visibles */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Boutons d'action principaux pour PWA */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(bill)}
                className="h-9 w-9 p-0 border-blue-200 hover:border-blue-300 hover:bg-blue-50 touch-manipulation"
                disabled={loading}
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="h-9 w-9 p-0 border-red-200 hover:border-red-300 hover:bg-red-50 touch-manipulation"
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
              
              {/* Menu dropdown pour options supplémentaires */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 w-9 p-0 border-gray-200 hover:border-gray-300 hover:bg-gray-50 touch-manipulation"
                  >
                    <MoreHorizontal className="h-4 w-4 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 bg-white border border-gray-200 shadow-lg z-50"
                  sideOffset={8}
                >
                  <DropdownMenuItem 
                    onClick={() => onEdit(bill)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <CreditCard className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="font-medium text-lg text-green-700">{bill.amount.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between gap-2 p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Échéance: {format(parseISO(bill.due_date), 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
              <Zap className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span className="capitalize">{bill.recurrence}</span>
            </div>
          </div>

          {/* Informations complémentaires */}
          {(bill.payment_number || bill.meter_number) && (
            <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg">
              {bill.payment_number && <div className="flex justify-between"><span>N° Paiement:</span><span className="font-mono">{bill.payment_number}</span></div>}
              {bill.meter_number && <div className="flex justify-between"><span>N° Compteur:</span><span className="font-mono">{bill.meter_number}</span></div>}
            </div>
          )}

          {/* Section des contrôles */}
          <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
            {/* Toggle automation */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Paiement automatique</span>
              </div>
              <Switch
                checked={bill.is_automated}
                onCheckedChange={(checked) => onToggleAutomation(bill.id, checked)}
                disabled={loading}
                className="touch-manipulation"
              />
            </div>

            {/* Bouton de paiement principal - Optimisé pour PWA */}
            {bill.status !== 'paid' && (
              <Button
                onClick={() => onPayNow(bill.id)}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payer Maintenant ({bill.amount.toLocaleString()} FCFA)
                  </>
                )}
              </Button>
            )}

            {/* Message pour factures payées */}
            {bill.status === 'paid' && (
              <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-700 font-medium">Facture payée</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillCard;
