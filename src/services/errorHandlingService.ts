
import { AuthErrorHandler } from './authErrorHandler';

const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Identifiants de connexion invalides. Vérifiez votre numéro de téléphone et mot de passe.',
    USER_ALREADY_REGISTERED: 'Un compte existe déjà avec ce numéro de téléphone. Essayez de vous connecter.',
    EMAIL_NOT_CONFIRMED: 'Veuillez confirmer votre email avant de vous connecter.',
    SESSION_MISSING: 'Session expirée. Veuillez vous reconnecter.',
    DEFAULT: 'Une erreur est survenue lors de l\'authentification.'
  },
  TRANSFER: {
    INSUFFICIENT_FUNDS: 'Solde insuffisant pour effectuer ce transfert.',
    USER_NOT_FOUND: 'Destinataire introuvable.',
    LIMIT_EXCEEDED: 'Limite mensuelle de transfert dépassée.',
    DEFAULT: 'Une erreur est survenue lors du transfert.'
  },
  WITHDRAWAL: {
    INSUFFICIENT_BALANCE: 'Solde insuffisant pour effectuer ce retrait.',
    INVALID_VERIFICATION_CODE: 'Code de vérification invalide ou expiré.',
    DEFAULT: 'Une erreur est survenue lors du retrait.'
  },
  BILLS: {
    INSUFFICIENT_FUNDS: 'Solde insuffisant pour payer cette facture.',
    BILL_NOT_FOUND: 'Facture introuvable.',
    PAYMENT_FAILED: 'Échec du paiement de la facture.',
    VALIDATION_ERROR: 'Données de facture invalides.',
    DEFAULT: 'Une erreur est survenue lors du traitement de la facture.'
  },
  BIOMETRIC: {
    NOT_SUPPORTED: 'Authentification biométrique non supportée sur cet appareil.',
    NOT_ALLOWED: 'Authentification biométrique refusée par l\'utilisateur.',
    FAILED: 'Échec de l\'authentification biométrique. Utilisez votre mot de passe.',
    DEFAULT: 'Erreur d\'authentification biométrique.'
  },
  VALIDATION: {
    REQUIRED_FIELD: 'Ce champ est obligatoire.',
    INVALID_AMOUNT: 'Le montant doit être un nombre positif.',
    INVALID_PHONE: 'Numéro de téléphone invalide.',
    INVALID_DATE: 'Date invalide.',
    DEFAULT: 'Erreur de validation des données.'
  }
} as const;

export const errorHandlingService = {
  async handleAuthError(error: any): Promise<string> {
    const message = error?.message || '';
    
    if (message.includes('Invalid login credentials')) {
      return ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
    }
    if (message.includes('User already registered')) {
      return ERROR_MESSAGES.AUTH.USER_ALREADY_REGISTERED;
    }
    if (message.includes('Email not confirmed')) {
      return ERROR_MESSAGES.AUTH.EMAIL_NOT_CONFIRMED;
    }
    if (message.includes('Auth session missing')) {
      await AuthErrorHandler.handleAuthError(error, 'auth_session');
      return ERROR_MESSAGES.AUTH.SESSION_MISSING;
    }
    
    return message || ERROR_MESSAGES.AUTH.DEFAULT;
  },

  handleTransferError(error: any): string {
    const message = error?.message || '';
    
    if (message.includes('Insufficient funds')) {
      return ERROR_MESSAGES.TRANSFER.INSUFFICIENT_FUNDS;
    }
    if (message.includes('User not found')) {
      return ERROR_MESSAGES.TRANSFER.USER_NOT_FOUND;
    }
    if (message.includes('Monthly limit exceeded') || message.includes('Limite mensuelle')) {
      return ERROR_MESSAGES.TRANSFER.LIMIT_EXCEEDED;
    }
    
    return message || ERROR_MESSAGES.TRANSFER.DEFAULT;
  },

  handleWithdrawalError(error: any): string {
    const message = error?.message || '';
    
    if (message.includes('Insufficient balance')) {
      return ERROR_MESSAGES.WITHDRAWAL.INSUFFICIENT_BALANCE;
    }
    if (message.includes('Invalid verification code')) {
      return ERROR_MESSAGES.WITHDRAWAL.INVALID_VERIFICATION_CODE;
    }
    
    return message || ERROR_MESSAGES.WITHDRAWAL.DEFAULT;
  },

  handleBillError(error: any): string {
    const message = error?.message || '';
    
    if (message.includes('Insufficient funds') || message.includes('Solde insuffisant')) {
      return ERROR_MESSAGES.BILLS.INSUFFICIENT_FUNDS;
    }
    if (message.includes('Bill not found') || message.includes('Facture introuvable')) {
      return ERROR_MESSAGES.BILLS.BILL_NOT_FOUND;
    }
    if (message.includes('Payment failed')) {
      return ERROR_MESSAGES.BILLS.PAYMENT_FAILED;
    }
    if (message.includes('validation') || message.includes('required')) {
      return ERROR_MESSAGES.BILLS.VALIDATION_ERROR;
    }
    
    return message || ERROR_MESSAGES.BILLS.DEFAULT;
  },

  handleBiometricError(error: any): string {
    if (!error?.name) return ERROR_MESSAGES.BIOMETRIC.DEFAULT;
    
    switch (error.name) {
      case 'NotSupportedError':
        return ERROR_MESSAGES.BIOMETRIC.NOT_SUPPORTED;
      case 'NotAllowedError':
        return ERROR_MESSAGES.BIOMETRIC.NOT_ALLOWED;
      case 'InvalidStateError':
      case 'UnknownError':
        return ERROR_MESSAGES.BIOMETRIC.FAILED;
      default:
        return ERROR_MESSAGES.BIOMETRIC.DEFAULT;
    }
  },

  handleValidationError(error: any): string {
    const message = error?.message || '';
    
    if (message.includes('required')) {
      return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    }
    if (message.includes('amount') || message.includes('montant')) {
      return ERROR_MESSAGES.VALIDATION.INVALID_AMOUNT;
    }
    if (message.includes('phone') || message.includes('téléphone')) {
      return ERROR_MESSAGES.VALIDATION.INVALID_PHONE;
    }
    if (message.includes('date')) {
      return ERROR_MESSAGES.VALIDATION.INVALID_DATE;
    }
    
    return message || ERROR_MESSAGES.VALIDATION.DEFAULT;
  },

  // Fonction utilitaire pour gérer toutes les erreurs
  handleError(error: any, context: string): string {
    console.error(`Erreur dans ${context}:`, error);
    
    switch (context) {
      case 'auth':
        return this.handleAuthError(error);
      case 'transfer':
        return this.handleTransferError(error);
      case 'withdrawal':
        return this.handleWithdrawalError(error);
      case 'bills':
        return this.handleBillError(error);
      case 'biometric':
        return this.handleBiometricError(error);
      case 'validation':
        return this.handleValidationError(error);
      default:
        return error?.message || 'Une erreur inattendue s\'est produite';
    }
  }
};
