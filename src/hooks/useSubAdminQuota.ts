
import { useSubAdminDailyRequests } from './useSubAdminDailyRequests';
import { toast } from 'sonner';

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

  return {
    ...status,
    checkQuotaAndRecord,
    checkQuotaOnly,
    recordRequest
  };
};
