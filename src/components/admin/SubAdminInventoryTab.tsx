
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, AlertTriangle, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  max_stock: number;
  min_threshold: number;
  unit_price: number;
  status: 'available' | 'low_stock' | 'out_of_stock';
  created_at: string;
  updated_at: string;
}

const SubAdminInventoryTab = () => {
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async (): Promise<InventoryItem[]> => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erreur lors de la récupération de l\'inventaire:', error);
        return [];
      }

      // Mettre à jour le statut en fonction du stock
      const updatedItems = data?.map(item => {
        let status: 'available' | 'low_stock' | 'out_of_stock';
        if (item.stock === 0) {
          status = 'out_of_stock';
        } else if (item.stock <= item.min_threshold) {
          status = 'low_stock';
        } else {
          status = 'available';
        }

        return {
          ...item,
          status
        };
      }) || [];

      return updatedItems;
    },
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'low_stock':
        return <Badge className="bg-orange-100 text-orange-800">Stock Faible</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800">Rupture</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const totalValue = inventory.reduce((sum, item) => sum + (item.stock * item.unit_price), 0);
  const lowStockItems = inventory.filter(item => item.status === 'low_stock').length;
  const outOfStockItems = inventory.filter(item => item.status === 'out_of_stock').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Gestion d'Inventaire</h2>
        </div>
      </div>

      {/* Statistiques générales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue, 'XAF')}</div>
            <p className="text-sm text-muted-foreground">Inventaire total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles Totaux</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
            <p className="text-sm text-muted-foreground">Types d'articles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
            <p className="text-sm text-muted-foreground">Articles à réapprovisionner</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
            <p className="text-sm text-muted-foreground">Articles épuisés</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des articles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            État de l'Inventaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventory.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Stock: {item.stock} / {item.max_stock}</span>
                    <span>Seuil min: {item.min_threshold}</span>
                  </div>
                  <Progress 
                    value={getStockPercentage(item.stock, item.max_stock)}
                    className="h-2"
                  />
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-muted-foreground">Prix unitaire: </span>
                    <span className="font-semibold">{formatCurrency(item.unit_price, 'XAF')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valeur totale: </span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(item.stock * item.unit_price, 'XAF')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertes */}
      {(lowStockItems > 0 || outOfStockItems > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Alertes d'Inventaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {lowStockItems > 0 && (
                <p className="text-orange-700">
                  ⚠️ {lowStockItems} article(s) ont un stock faible et nécessitent un réapprovisionnement.
                </p>
              )}
              {outOfStockItems > 0 && (
                <p className="text-red-700">
                  🚨 {outOfStockItems} article(s) sont en rupture de stock.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubAdminInventoryTab;
