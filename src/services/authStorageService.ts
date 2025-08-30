// Service pour gérer le stockage local de l'authentification
export const authStorageService = {
  // Clés de stockage
  STORED_PHONE_KEY: 'sendflow_stored_phone',
  
  // Stocker le numéro de téléphone après connexion réussie
  storePhoneNumber(phone: string): void {
    try {
      const normalizedPhone = phone.replace(/[^\d+]/g, '');
      localStorage.setItem(this.STORED_PHONE_KEY, normalizedPhone);
      console.log('📱 Numéro de téléphone stocké:', normalizedPhone);
    } catch (error) {
      console.error('❌ Erreur lors du stockage du numéro:', error);
    }
  },

  // Récupérer le numéro de téléphone stocké
  getStoredPhoneNumber(): string | null {
    try {
      const storedPhone = localStorage.getItem(this.STORED_PHONE_KEY);
      console.log('📱 Numéro récupéré du stockage:', storedPhone);
      return storedPhone;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du numéro:', error);
      return null;
    }
  },

  // Vérifier si un numéro est stocké
  hasStoredPhoneNumber(): boolean {
    return this.getStoredPhoneNumber() !== null;
  },

  // Supprimer le numéro stocké (lors de la déconnexion)
  clearStoredPhoneNumber(): void {
    try {
      localStorage.removeItem(this.STORED_PHONE_KEY);
      console.log('📱 Numéro de téléphone supprimé du stockage');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du numéro:', error);
    }
  },

  // Formater le numéro pour l'affichage
  formatPhoneForDisplay(phone: string): string {
    // Masquer une partie du numéro pour la sécurité
    // Ex: +221771234567 -> +221****4567
    if (phone.length <= 4) return phone;
    
    const visibleEnd = phone.slice(-4);
    const visibleStart = phone.slice(0, 4);
    const maskedMiddle = '*'.repeat(Math.max(0, phone.length - 8));
    
    return `${visibleStart}${maskedMiddle}${visibleEnd}`;
  }
};