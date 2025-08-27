import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecipientInfo from "./transfer-steps/RecipientInfo";
import TransferDetails from "./transfer-steps/TransferDetails";
import TransferSummary from "./transfer-steps/TransferSummary";
import TransferStepper from "./transfer/TransferStepper";
import SimpleHtmlTransferConfirmation from "./transfer/SimpleHtmlTransferConfirmation";
import { BiometricConfirmation } from "@/components/security/BiometricConfirmation";
import { useTransferForm } from "@/hooks/useTransferForm";
import { useState } from "react";
import { CheckCircle, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const TransferForm = () => {
  const { userRole, profile } = useAuth();
  const isMobile = useIsMobile();
  
  const {
    currentStep,
    data,
    isLoading,
    pendingTransferInfo,
    showTransferConfirmation,
    showBiometricConfirmation,
    updateFields,
    back,
    handleSubmit,
    handleConfirmedTransfer,
    processFinalTransfer,
    resetForm,
    setShowTransferConfirmation,
    setShowBiometricConfirmation
  } = useTransferForm();

  const [copied, setCopied] = useState(false);

  const steps = [
    { title: "Informations Bénéficiaire", component: RecipientInfo },
    { title: "Détails du Transfert", component: TransferDetails },
    { title: "Résumé", component: TransferSummary },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Écran de confirmation pour transfert en attente
  if (pendingTransferInfo) {
    return (
      <div className="w-full">
        <Card className={`backdrop-blur-md bg-white/80 shadow-xl rounded-xl border-0 overflow-hidden w-full ${isMobile ? 'mx-1' : ''}`}>
          <div className={`${isMobile ? 'p-2' : 'p-3'} w-full`}>
            <div className="text-center mb-4">
              <CheckCircle className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-emerald-500 mx-auto mb-3`} />
              <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>Transfert en attente</h2>
              <p className={`text-gray-600 mt-2 ${isMobile ? 'text-sm' : ''}`}>
                Le destinataire n'a pas encore de compte. Un code a été généré pour lui permettre de réclamer le transfert.
              </p>
            </div>
            
            <div className={`space-y-3 bg-gray-50 ${isMobile ? 'p-3' : 'p-4'} rounded-lg w-full`}>
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Téléphone du destinataire</p>
                <p className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{pendingTransferInfo.recipientPhone}</p>
              </div>
              
              <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>Code de réclamation</p>
                <div className={`flex items-center justify-between bg-white border rounded-md ${isMobile ? 'p-2' : 'p-3'}`}>
                  <span className={`font-mono font-bold ${isMobile ? 'text-base' : 'text-lg'} tracking-wider`}>
                    {pendingTransferInfo.claimCode}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(pendingTransferInfo.claimCode)}
                    className="text-emerald-600"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-1`}>
                  Partagez ce code avec le destinataire pour qu'il puisse réclamer l'argent.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center mt-4">
              <Button 
                onClick={resetForm} 
                size={isMobile ? "default" : "lg"}
                className={`w-full ${isMobile ? 'h-12 text-base' : 'h-14 text-lg'} ${
                  userRole === 'agent' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Faire un autre transfert
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Formulaire de transfert principal
  return (
    <div className="w-full">
      <Card className={`backdrop-blur-md bg-white/80 shadow-xl rounded-xl border-0 overflow-hidden w-full ${isMobile ? 'mx-1' : ''}`}>
        <div className={`${isMobile ? 'p-1' : 'p-2'} w-full`}>
          {/* En-tête adapté selon le rôle */}
          {userRole === 'agent' && (
            <div className={`mb-2 ${isMobile ? 'p-2' : 'p-2'} bg-blue-50 border border-blue-200 rounded-md w-full`}>
              <p className={`text-blue-700 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                💼 Mode Agent: Effectuez des transferts pour vos clients depuis {profile?.country || 'votre pays'}
              </p>
            </div>
          )}

          <div className={`${isMobile ? 'mb-2' : 'mb-3'} w-full`}>
            <TransferStepper steps={steps} currentStep={currentStep} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-1 w-full">
            <div className="w-full">
              <CurrentStepComponent {...data} updateFields={updateFields} />
            </div>
            
            <div className={`${isMobile ? 'mt-2' : 'mt-2'} flex flex-col sm:flex-row justify-between gap-2 w-full`}>
              {currentStep !== 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={back}
                  size={isMobile ? "default" : "lg"}
                  className={`w-full sm:w-auto order-2 sm:order-1 ${isMobile ? 'h-10 text-sm' : 'h-12 text-base'}`}
                  disabled={isLoading}
                >
                  Retour
                </Button>
              )}
              <Button
                type="submit"
                size={isMobile ? "default" : "lg"}
                className={`w-full sm:w-auto order-1 sm:order-2 ${isMobile ? 'h-10 text-sm' : 'h-12 text-base'} ${
                  userRole === 'agent' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } ${currentStep === 0 ? "sm:ml-auto" : ""}`}
                disabled={isLoading}
              >
                {isLoading 
                  ? "Traitement..." 
                  : currentStep === steps.length - 1 
                    ? "Valider" 
                    : "Continuer"
                }
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Confirmation sécurisée du transfert */}
      <SimpleHtmlTransferConfirmation
        isOpen={showTransferConfirmation}
        onClose={() => setShowTransferConfirmation(false)}
        onConfirm={handleConfirmedTransfer}
        transferData={{
          amount: data.transfer.amount,
          recipientName: data.recipient.fullName,
          recipientPhone: data.recipient.phone,
          recipientCountry: data.recipient.country,
          senderCountry: profile?.country || "Cameroun"
        }}
        isProcessing={isLoading}
      />

      {/* Confirmation biométrique */}
      <BiometricConfirmation
        isOpen={showBiometricConfirmation}
        onClose={() => setShowBiometricConfirmation(false)}
        onConfirm={processFinalTransfer}
        amount={data.transfer.amount}
        operationType="Transfert d'argent"
        recipient={data.recipient.fullName}
      />
    </div>
  );
};

export default TransferForm;
