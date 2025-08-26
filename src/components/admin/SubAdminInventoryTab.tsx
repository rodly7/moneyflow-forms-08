import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export const SubAdminInventoryTab = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erreur lors de la récupération de l'inventaire:", error);
        setError("Impossible de charger l'inventaire.");
      } else {
        setInventory(data || []);
      }
    } catch (err) {
      console.error("Erreur inattendue lors de la récupération de l'inventaire:", err);
      setError("Une erreur inattendue s'est produite.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalInventoryValue = inventory.reduce((acc, item) => {
    return acc + (item.quantity * item.unit_price);
  }, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Inventaire
        </CardTitle>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            {inventory.length} article{inventory.length !== 1 ? 's' : ''}
          </Badge>
          <Button
            onClick={fetchInventory}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center p-8 text-red-500">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-300" />
            <p className="text-lg font-medium">{error}</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucun article dans l'inventaire</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-gray-800">{item.item_name}</h3>
                <p className="text-gray-600">Quantité: {item.quantity}</p>
                <p className="text-gray-600">Prix unitaire: {formatCurrency(item.unit_price, 'XAF')}</p>
                <div className="mt-2">
                  <Badge variant="outline">
                    {formatCurrency(item.quantity * item.unit_price, 'XAF')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Inventory Value */}
        {!isLoading && !error && inventory.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center justify-between">
              <p className="font-medium text-blue-700">Valeur totale de l'inventaire:</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-800 text-lg">
                  {formatCurrency(totalInventoryValue, 'XAF')}
                </span>
                {totalInventoryValue > 1000000 && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
