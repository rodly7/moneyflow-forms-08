
import { useSubAdminDailyRequests } from './useSubAdminDailyRequests';
import { toast } from 'sonner';

const MAX_APPROVAL_AMOUNT = 500000; // Limite maximale d'approbation pour les sous-admins

export const useSubAdminQuota = () => {
  const { status, recordRequest } = useSubAdminDailyRequests();

  const checkQuotaAndRecord = async (requestType: string = 'user_request') => {
    if (!status.canMakeRequest) {
      toast.error(`Quota journalier atteint (${status.dailyLimit}). Revenez demain.`);
      return false;
    }

    return await recordRequest(requestType);
  };

  const checkQuotaOnly = () => {
    if (!status.canMakeRequest) {
      toast.error(`Quota journalier atteint (${status.dailyLimit}). Revenez demain.`);
      return false;
    }
    return true;
  };

  const canApproveAmount = (amount: number) => {
    if (amount > MAX_APPROVAL_AMOUNT) {
      toast.error(`Montant trop élevé. Les sous-administrateurs peuvent approuver jusqu'à ${MAX_APPROVAL_AMOUNT.toLocaleString()} XAF maximum.`);
      return false;
    }
    return true;
  };

  const checkAmountAndQuota = (amount: number) => {
    if (!canApproveAmount(amount)) {
      return false;
    }
    return checkQuotaOnly();
  };

  return {
    ...status,
    checkQuotaAndRecord,
    checkQuotaOnly,
    recordRequest,
    canApproveAmount,
    checkAmountAndQuota,
    maxApprovalAmount: MAX_APPROVAL_AMOUNT
  };
};
