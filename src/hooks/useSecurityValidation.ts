
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { SecurityService } from "@/services/securityService";

export const useSecurityValidation = () => {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);

  const validateFinancialOperation = useCallback(async (
    amount: number,
    operation: string,
    additionalChecks?: () => Promise<boolean>
  ): Promise<boolean> => {
    setIsValidating(true);
    
    try {
      // Input validation
      const inputValidation = SecurityService.validateFinancialInput(amount, operation);
      if (!inputValidation.isValid) {
        toast({
          title: "Validation échouée",
          description: inputValidation.error,
          variant: "destructive"
        });
        return false;
      }

      // Rate limiting check
      const isWithinRateLimit = await SecurityService.checkRateLimit(
        `${operation}_operation`,
        operation === 'transfer' ? 10 : 5, // More lenient for transfers
        60 // 1 hour window
      );

      if (!isWithinRateLimit) {
        toast({
          title: "Limite de tentatives atteinte",
          description: "Trop de tentatives récentes. Veuillez réessayer plus tard.",
          variant: "destructive"
        });
        
        await SecurityService.logSecurityEvent('rate_limit_exceeded', {
          operation,
          amount
        }, 'medium');
        
        return false;
      }

      // Session validation
      const isSessionValid = await SecurityService.validateSession();
      if (!isSessionValid) {
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          variant: "destructive"
        });
        return false;
      }

      // Additional custom checks
      if (additionalChecks) {
        const customValidation = await additionalChecks();
        if (!customValidation) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Security validation error:", error);
      toast({
        title: "Erreur de validation",
        description: "Une erreur s'est produite lors de la validation",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [toast]);

  const validateFileUpload = useCallback((file: File): boolean => {
    const validation = SecurityService.validateFileUpload(file);
    
    if (!validation.isValid) {
      toast({
        title: "Fichier invalide",
        description: validation.error,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  }, [toast]);

  return {
    validateFinancialOperation,
    validateFileUpload,
    isValidating
  };
};
