
import { supabase } from '@/integrations/supabase/client';
import { SecurityService } from './securityService';
import { balanceService } from './balanceService';

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
  private securityService = new SecurityService();

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
    const securityCheck = await this.securityService.validateUserOperation(
      userId,
      'transfer',
      { amount: request.amount, recipient: request.recipientPhone }
    );

    if (!securityCheck.isValid) {
      errors.push(...securityCheck.errors);
      securityFlags.push(...securityCheck.flags);
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
    const hasBalance = await balanceService.checkSufficientBalance(userId, request.amount);
    if (!hasBalance) {
      throw new Error('Solde insuffisant');
    }

    // Calculate fees (simplified - should use actual fee service)
    const fees = request.amount * 0.01; // 1% fee

    try {
      // Create transfer record with only valid database fields
      const { data: transfer, error: transferError } = await supabase
        .from('transfers')
        .insert({
          sender_id: userId,
          recipient_phone: request.recipientPhone,
          recipient_country: request.recipientCountry,
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

      // Deduct balance using secure balance service
      await balanceService.updateBalance(userId, -request.amount, 'transfer_debit');

      // Log security event
      await this.securityService.logSecurityEvent(
        userId,
        'transfer_executed',
        {
          transferId: transfer.id,
          amount: request.amount,
          recipient: request.recipientPhone
        }
      );

      return transfer;
    } catch (error) {
      // Log failed transfer attempt
      await this.securityService.logSecurityEvent(
        userId,
        'transfer_failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          amount: request.amount,
          recipient: request.recipientPhone
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
