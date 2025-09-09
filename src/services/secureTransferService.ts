
import { supabase } from '@/integrations/supabase/client';
import { SecurityService } from './securityService';
import { getUserBalance } from './withdrawalService';

export interface SecureTransferRequest {
  recipientPhone: string;
  amount: number;
  senderCountry: string;
  recipientCountry: string;
}

export interface TransferValidationResult {
  isValid: boolean;
  errors: string[];
  securityFlags: string[];
}

class SecureTransferService {
  async validateTransferRequest(
    userId: string,
    request: SecureTransferRequest
  ): Promise<TransferValidationResult> {
    const errors: string[] = [];
    const securityFlags: string[] = [];

    // Basic validation
    if (!request.recipientPhone || request.recipientPhone.length < 8) {
      errors.push('Numéro de téléphone du destinataire invalide');
    }

    if (!request.amount || request.amount <= 0) {
      errors.push('Montant invalide');
    }

    if (request.amount > 1000000) {
      errors.push('Montant trop élevé');
      securityFlags.push('LARGE_AMOUNT');
    }

    // Security validations
    const inputValidation = SecurityService.validateFinancialInput(request.amount, 'transfer');
    if (!inputValidation.isValid) {
      errors.push(inputValidation.error || 'Validation échouée');
    }

    // Rate limiting check
    const isWithinLimit = await SecurityService.checkRateLimit('transfer_validation', 10, 60);
    if (!isWithinLimit) {
      errors.push('Trop de tentatives de transfert');
      securityFlags.push('RATE_LIMITED');
    }

    return {
      isValid: errors.length === 0,
      errors,
      securityFlags
    };
  }

  async executeSecureTransfer(
    userId: string,
    request: SecureTransferRequest,
    recipientId?: string
  ) {
    // Validate request first
    const validation = await this.validateTransferRequest(userId, request);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check balance
    const balanceData = await getUserBalance(userId);
    if (balanceData.balance < request.amount) {
      throw new Error('Solde insuffisant');
    }

    // Calculate fees (simplified - should use actual fee service)
    const fees = request.amount * 0.01; // 1% fee

    try {
      // Create transfer record with required fields
      const { data: transfer, error: transferError } = await supabase
        .from('transfers')
        .insert({
          sender_id: userId,
          recipient_phone: request.recipientPhone,
          recipient_country: request.recipientCountry,
          recipient_full_name: 'Unknown', // Default value - should be fetched from user lookup
          amount: request.amount,
          fees: fees,
          currency: 'XAF',
          status: 'pending',
          ...(recipientId && { recipient_id: recipientId })
        })
        .select()
        .single();

      if (transferError) {
        throw new Error(`Erreur lors de la création du transfert: ${transferError.message}`);
      }

      // Deduct balance using existing balance service
      await supabase.rpc('increment_balance', {
        user_id: userId,
        amount: -request.amount
      });

      // Activer le bonus de parrainage si c'est la première transaction du destinataire
      if (recipientId) {
        try {
          const { error: referralError } = await supabase.rpc('activate_referral_bonus', {
            user_id_param: recipientId
          });
          
          if (referralError) {
            console.error("Erreur activation bonus parrainage:", referralError);
          }
        } catch (error) {
          console.error("Erreur non-critique activation bonus:", error);
        }
      }

      // Log security event
      await SecurityService.logSecurityEvent(
        'transfer_executed',
        {
          transferId: transfer.id,
          amount: request.amount,
          recipient: request.recipientPhone,
          user_id: userId
        }
      );

      return transfer;
    } catch (error) {
      // Log failed transfer attempt
      await SecurityService.logSecurityEvent(
        'transfer_failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          amount: request.amount,
          recipient: request.recipientPhone,
          user_id: userId
        }
      );
      throw error;
    }
  }

  async getTransferHistory(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('transfers')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Erreur lors de la récupération de l'historique: ${error.message}`);
    }

    return data;
  }
}

export const secureTransferService = new SecureTransferService();

// Export the function that balanceService expects
export const secureProcessTransfer = async (
  senderId: string,
  recipientId: string,
  amount: number,
  senderCountry: string,
  recipientCountry: string
): Promise<{ success: boolean }> => {
  try {
    await secureTransferService.executeSecureTransfer(senderId, {
      recipientPhone: 'phone_placeholder', // This should be passed as parameter
      amount,
      senderCountry,
      recipientCountry
    }, recipientId);
    
    return { success: true };
  } catch (error) {
    console.error('Secure transfer failed:', error);
    return { success: false };
  }
};
