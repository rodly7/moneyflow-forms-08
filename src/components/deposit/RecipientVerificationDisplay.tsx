
interface RecipientVerificationDisplayProps {
  isVerified: boolean;
  recipientName: string;
  recipientBalance: number | null;
}

const RecipientVerificationDisplay = ({ 
  isVerified, 
  recipientName, 
  recipientBalance 
}: RecipientVerificationDisplayProps) => {
  if (!isVerified) {
    return null;
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex flex-col space-y-2">
        <p className="text-sm text-green-700">
          <strong>Nom:</strong> {recipientName}
        </p>
        <p className="text-lg font-semibold text-green-800">
          <strong>Solde exact:</strong> {recipientBalance ?? 0} FCFA
        </p>
      </div>
    </div>
  );
};

export default RecipientVerificationDisplay;
