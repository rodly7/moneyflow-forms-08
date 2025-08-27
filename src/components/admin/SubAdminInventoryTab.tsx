import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import { Package, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InventoryData {
  total_products: number;
  products_in_stock: number;
  products_out_of_stock: number;
  average_price: number;
  total_value: number;
  low_stock_products: number;
}

const SubAdminInventoryTab = () => {
  const { toast } = useToast();
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInventoryData = async () => {
    setIsLoading(true);
    try {
      // Simulate fetching inventory data (replace with your actual data fetching logic)
      const mockData: InventoryData = {
        total_products: 150,
        products_in_stock: 120,
        products_out_of_stock: 30,
        average_price: 7500,
        total_value: 900000,
        low_stock_products: 15,
      };

      setInventoryData(mockData);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleRefresh = () => {
    fetchInventoryData();
  };

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">Aperçu de l'Inventaire</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Actualisation...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded-md w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded-md"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-gray-200 rounded-md"></div>
              <div className="h-12 bg-gray-200 rounded-md"></div>
            </div>
          </div>
        ) : inventoryData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-4 bg-blue-50 rounded-md border border-blue-200">
                <Package className="w-6 h-6 mr-3 text-blue-500" />
                <div>
                  <h4 className="font-semibold text-gray-700">Total des Produits</h4>
                  <p className="text-gray-600">{inventoryData.total_products}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-green-50 rounded-md border border-green-200">
                <TrendingUp className="w-6 h-6 mr-3 text-green-500" />
                <div>
                  <h4 className="font-semibold text-gray-700">Produits en Stock</h4>
                  <p className="text-gray-600">{inventoryData.products_in_stock}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-4 bg-orange-50 rounded-md border border-orange-200">
                <AlertTriangle className="w-6 h-6 mr-3 text-orange-500" />
                <div>
                  <h4 className="font-semibold text-gray-700">Produits en Rupture de Stock</h4>
                  <p className="text-gray-600">{inventoryData.products_out_of_stock}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-purple-50 rounded-md border border-purple-200">
                <TrendingUp className="w-6 h-6 mr-3 text-purple-500" />
                <div>
                  <h4 className="font-semibold text-gray-700">Produits Bientôt en Rupture de Stock</h4>
                  <p className="text-gray-600">{inventoryData.low_stock_products}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-4 bg-teal-50 rounded-md border border-teal-200">
                <TrendingUp className="w-6 h-6 mr-3 text-teal-500" />
                <div>
                  <h4 className="font-semibold text-gray-700">Prix Moyen</h4>
                  <p className="text-gray-600">{formatCurrency(inventoryData.average_price, 'XAF')}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-yellow-50 rounded-md border border-yellow-200">
                <TrendingUp className="w-6 h-6 mr-3 text-yellow-500" />
                <div>
                  <h4 className="font-semibold text-gray-700">Valeur Totale de l'Inventaire</h4>
                  <p className="text-gray-600">{formatCurrency(inventoryData.total_value, 'XAF')}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Aucune donnée d'inventaire disponible.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubAdminInventoryTab;
