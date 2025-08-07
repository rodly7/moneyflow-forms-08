
export const validatePhoneNumber = (phone: string): boolean => {
  // Remove spaces and special characters for validation
  const cleanPhone = phone.replace(/\s+/g, '');
  
  // Check if it's a valid international format
  const phoneRegex = /^\+[1-9]\d{6,15}$/;
  return phoneRegex.test(cleanPhone);
};

export const validateAmount = (amount: number): { isValid: boolean; message?: string } => {
  if (amount <= 0) {
    return { isValid: false, message: "Le montant doit être supérieur à 0" };
  }
  
  if (amount > 50000000) { // 50M FCFA max
    return { isValid: false, message: "Le montant dépasse la limite maximale autorisée" };
  }
  
  if (!Number.isInteger(amount)) {
    return { isValid: false, message: "Le montant doit être un nombre entier" };
  }
  
  return { isValid: true };
};

export const validateIdCardNumber = (idNumber: string): boolean => {
  // Basic validation - at least 6 characters, alphanumeric
  if (!idNumber || idNumber.length < 6) {
    return false;
  }
  
  // Only letters and numbers allowed
  const idRegex = /^[A-Za-z0-9]+$/;
  return idRegex.test(idNumber);
};

export const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters
  return input.replace(/[<>\"'%;()&+]/g, '').trim();
};

export const validateFileUpload = (file: File, maxSize: number, allowedTypes: string[]): { isValid: boolean; message?: string } => {
  if (file.size > maxSize) {
    return { isValid: false, message: `Le fichier est trop volumineux (max: ${Math.round(maxSize / 1024 / 1024)}MB)` };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: "Type de fichier non autorisé" };
  }
  
  return { isValid: true };
};
