
import DepositWithdrawalForm from "@/components/deposit-withdrawal/DepositWithdrawalForm";

const UnifiedDepositWithdrawal = () => {
  const handleSubmit = (amount: number, phone: string) => {
    console.log('Formulaire soumis:', { amount, phone });
  };

  return (
    <div className="container mx-auto p-4">
      <DepositWithdrawalForm 
        type="deposit"
        onSubmit={handleSubmit}
        isProcessing={false}
        userBalance={0}
      />
    </div>
  );
};

export default UnifiedDepositWithdrawal;
