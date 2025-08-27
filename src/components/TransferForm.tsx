
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RecipientInfo from "./transfer-steps/RecipientInfo";
import TransferDetails from "./transfer-steps/TransferDetails";
import TransferSummary from "./transfer-steps/TransferSummary";
import { useTransferForm } from "@/hooks/useTransferForm";
import { BiometricConfirmation } from "./security/BiometricConfirmation";
import { SimpleHtmlTransferConfirmation } from "./transfer/SimpleHtmlTransferConfirmation";

const FORM_STEPS = [
  { title: "Informations Bénéficiaire" },
  { title: "Détails du Transfert" },
  { title: "Résumé" },
];

const TransferForm = () => {
  const navigate = useNavigate();
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

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === FORM_STEPS.length - 1;

  if (pendingTransferInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500/20 to-purple-500/20 py-8 px-4">
        <div className="container max-w-md mx-auto">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Transfert en Attente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Le destinataire ({pendingTransferInfo.recipientPhone}) peut réclamer l'argent avec ce code:</p>
              <div className="text-center">
                <div className="text-2xl font-bold bg-gray-100 p-4 rounded-lg">
                  {pendingTransferInfo.claimCode}
                </div>
              </div>
              <Button onClick={resetForm} className="w-full">
                Nouveau Transfert
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500/20 to-purple-500/20 py-8 px-4">
      <div className="container max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        {/* Progress Indicator */}
        <Card className="bg-white shadow-md">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              {FORM_STEPS.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < FORM_STEPS.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <h2 className="text-lg font-semibold text-center">
              {FORM_STEPS[currentStep].title}
            </h2>
          </CardContent>
        </Card>

        {/* Form Content */}
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>
              {currentStep === 0 && (
                <RecipientInfo
                  updateFields={updateFields}
                  recipient={data.recipient}
                  transfer={data.transfer}
                />
              )}
              
              {currentStep === 1 && (
                <TransferDetails
                  updateFields={updateFields}
                  recipientCountry={data.recipient.country}
                  amount={data.transfer.amount}
                  nextStep={() => {}}
                />
              )}
              
              {currentStep === 2 && (
                <TransferSummary
                  recipientFullName={data.recipient.fullName}
                  recipientPhone={data.recipient.phone}
                  recipientCountry={data.recipient.country}
                  transferAmount={data.transfer.amount}
                  transferCurrency={data.transfer.currency}
                />
              )}

              <div className="flex gap-4 mt-6">
                {!isFirstStep && (
                  <Button type="button" variant="outline" onClick={back}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Précédent
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLastStep ? "Confirmer le Transfert" : "Suivant"}
                  {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Transfer Confirmation Modal */}
        <SimpleHtmlTransferConfirmation
          isOpen={showTransferConfirmation}
          onClose={() => setShowTransferConfirmation(false)}
          onConfirm={handleConfirmedTransfer}
          amount={data.transfer.amount}
          recipientName={data.recipient.fullName}
          recipientPhone={data.recipient.phone}
          recipientCountry={data.recipient.country}
          senderCountry="Cameroun"
          isProcessing={isLoading}
        />

        {/* Biometric Confirmation */}
        <BiometricConfirmation
          isOpen={showBiometricConfirmation}
          onClose={() => setShowBiometricConfirmation(false)}
          onConfirm={processFinalTransfer}
          amount={data.transfer.amount}
          operationType="transfer"
        />
      </div>
    </div>
  );
};

export default TransferForm;
