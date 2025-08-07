
import SimpleHtmlSecureWithdrawalConfirmation from "@/components/user/SimpleHtmlSecureWithdrawalConfirmation";

interface WithdrawalRequest {
  id: string;
  amount: number;
  agent_name: string;
  agent_phone: string;
  created_at: string;
}

interface WithdrawalRequestNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  requestData: WithdrawalRequest | null;
}

const WithdrawalRequestNotification = ({
  isOpen,
  onClose,
  onConfirm,
  onReject,
  requestData
}: WithdrawalRequestNotificationProps) => {
  if (!requestData || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <SimpleHtmlSecureWithdrawalConfirmation
        isOpen={true}
        onClose={onClose}
        onConfirm={async () => onConfirm()}
        amount={requestData.amount}
        agentName={requestData.agent_name}
        agentPhone={requestData.agent_phone}
        withdrawalPhone={requestData.agent_phone}
        isProcessing={false}
      />
    </div>
  );
};

export default WithdrawalRequestNotification;
