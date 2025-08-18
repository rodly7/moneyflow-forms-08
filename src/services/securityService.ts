
import { supabase } from "@/integrations/supabase/client";

export class SecurityService {
  /**
   * Check if user has exceeded rate limit for a specific operation
   */
  static async checkRateLimit(
    operationType: string,
    maxAttempts: number = 5,
    windowMinutes: number = 60
  ): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) return false;

      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.user.id,
        p_operation_type: operationType,
        p_max_attempts: maxAttempts,
        p_window_minutes: windowMinutes
      });

      if (error) {
        console.error("Rate limit check error:", error);
        return false; // Allow operation if check fails to avoid blocking legitimate users
      }

      return data || false;
    } catch (error) {
      console.error("Rate limit service error:", error);
      return false;
    }
  }

  /**
   * Enhanced input validation for financial operations
   */
  static validateFinancialInput(amount: number, operation: string): {
    isValid: boolean;
    error?: string;
  } {
    // Check for negative amounts
    if (amount <= 0) {
      return { isValid: false, error: "Le montant doit être positif" };
    }

    // Check for unrealistic amounts
    const maxAmounts = {
      transfer: 5000000, // 5M FCFA
      deposit: 10000000, // 10M FCFA
      withdrawal: 2000000, // 2M FCFA
      bill_payment: 1000000 // 1M FCFA
    };

    const maxAmount = maxAmounts[operation as keyof typeof maxAmounts] || 1000000;
    if (amount > maxAmount) {
      return { 
        isValid: false, 
        error: `Le montant maximum pour ${operation} est de ${maxAmount.toLocaleString()} FCFA` 
      };
    }

    // Check for suspicious patterns (multiple of unusual numbers)
    if (amount % 111111 === 0 && amount > 111111) {
      return { 
        isValid: false, 
        error: "Montant inhabituel détecté. Veuillez utiliser un montant différent." 
      };
    }

    return { isValid: true };
  }

  /**
   * Sanitize and validate phone numbers
   */
  static sanitizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Cameroon numbers
    if (cleaned.startsWith('237')) {
      cleaned = cleaned.substring(3);
    }
    
    // Ensure proper format
    if (cleaned.length === 9 && cleaned.match(/^[267]/)) {
      return '+237' + cleaned;
    }
    
    return phone; // Return original if can't sanitize
  }

  /**
   * Log security events for monitoring
   */
  static async logSecurityEvent(
    eventType: string,
    details: Record<string, any>,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // Insert into audit_logs table
      await supabase.from('audit_logs').insert({
        action: `security_${eventType}`,
        table_name: 'security_events',
        user_id: user.user?.id || null,
        new_values: {
          event_type: eventType,
          severity,
          details,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_address: 'client_side' // Will be filled by server if needed
        }
      });
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  /**
   * Validate file uploads with enhanced security
   */
  static validateFileUpload(file: File): {
    isValid: boolean;
    error?: string;
  } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];

    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: "Le fichier ne doit pas dépasser 5MB" 
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: "Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou PDF" 
      };
    }

    // Check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeExtensionMap: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'application/pdf': ['pdf']
    };

    const validExtensions = mimeExtensionMap[file.type] || [];
    if (extension && !validExtensions.includes(extension)) {
      return { 
        isValid: false, 
        error: "L'extension du fichier ne correspond pas au type de fichier" 
      };
    }

    return { isValid: true };
  }

  /**
   * Enhanced session validation
   */
  static async validateSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        await this.logSecurityEvent('invalid_session', { error: error?.message });
        return false;
      }

      // Check if session is close to expiry (within 5 minutes)
      const expiryTime = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiryTime.getTime() - now.getTime();
      
      if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes
        // Attempt to refresh session
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          await this.logSecurityEvent('session_refresh_failed', { error: refreshError.message });
          return false;
        }
      }

      return true;
    } catch (error) {
      await this.logSecurityEvent('session_validation_error', { error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }
}
