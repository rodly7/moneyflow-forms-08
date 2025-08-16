
import React from 'react';
import MobilePaymentForm from '@/components/recharge/MobilePaymentForm';
import PaymentStatusMonitor from '@/components/recharge/PaymentStatusMonitor';

const MobileRecharge = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Recharge Mobile
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <MobilePaymentForm />
          </div>
          
          <div>
            <PaymentStatusMonitor />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileRecharge;
