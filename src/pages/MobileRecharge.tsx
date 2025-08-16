
import React from 'react';
import { MobilePaymentForm } from '@/components/recharge/MobilePaymentForm';
import { PaymentStatusMonitor } from '@/components/recharge/PaymentStatusMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MobileRecharge = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900">Recharge Mobile</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-center text-gray-800">
                Rechargez votre crédit mobile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MobilePaymentForm />
            </CardContent>
          </Card>

          {/* Payment Status Monitor */}
          <PaymentStatusMonitor />
        </div>
      </div>
    </div>
  );
};

export default MobileRecharge;
