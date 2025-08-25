
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SimplePaymentNumbersManager from './SimplePaymentNumbersManager';
import SystemSettings from './SystemSettings';
import { Phone, Settings } from 'lucide-react';

const PaymentSettingsTab = () => {
  return (
    <div className="p-6">
      <Tabs defaultValue="numbers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="numbers" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Numéros de Paiement
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Paramètres Système
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="numbers" className="mt-6">
          <SimplePaymentNumbersManager />
        </TabsContent>
        
        <TabsContent value="system" className="mt-6">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentSettingsTab;
