import { supabase } from '@/integrations/supabase/client';

/**
 * Service de chiffrement pour les codes PIN
 * Utilise une méthode de chiffrement symétrique simple avec une clé dérivée de l'ID utilisateur
 */
export const pinEncryptionService = {
  /**
   * Chiffre un PIN en utilisant une transformation basée sur l'ID utilisateur
   * @param pin Le PIN en clair (4 chiffres)
   * @param userId L'ID de l'utilisateur pour générer une clé unique
   * @returns Le PIN chiffré
   */
  encryptPin(pin: string, userId: string): string {
    // Créer une clé de chiffrement basée sur l'ID utilisateur
    const key = this.generateKey(userId);
    
    // Convertir le PIN en nombres et appliquer le chiffrement
    const encrypted = pin.split('').map((digit, index) => {
      const digitNum = parseInt(digit);
      const keyDigit = key[index % key.length];
      return ((digitNum + keyDigit) % 10).toString();
    }).join('');
    
    // Ajouter un préfixe pour identifier les PINs chiffrés
    return `enc_${encrypted}`;
  },

  /**
   * Déchiffre un PIN
   * @param encryptedPin Le PIN chiffré
   * @param userId L'ID de l'utilisateur
   * @returns Le PIN en clair
   */
  decryptPin(encryptedPin: string, userId: string): string {
    // Vérifier le préfixe
    if (!encryptedPin.startsWith('enc_')) {
      throw new Error('PIN chiffré invalide');
    }
    
    // Extraire la partie chiffrée
    const encrypted = encryptedPin.substring(4);
    
    // Créer la même clé de chiffrement
    const key = this.generateKey(userId);
    
    // Déchiffrer
    const decrypted = encrypted.split('').map((digit, index) => {
      const digitNum = parseInt(digit);
      const keyDigit = key[index % key.length];
      return ((digitNum - keyDigit + 10) % 10).toString();
    }).join('');
    
    return decrypted;
  },

  /**
   * Vérifie si un PIN en clair correspond au PIN chiffré stocké
   * @param plainPin Le PIN en clair saisi par l'utilisateur
   * @param encryptedPin Le PIN chiffré stocké en base
   * @param userId L'ID de l'utilisateur
   * @returns true si les PINs correspondent
   */
  verifyPin(plainPin: string, encryptedPin: string, userId: string): boolean {
    try {
      // Si le PIN stocké n'est pas chiffré (ancien format), comparer directement
      if (!encryptedPin.startsWith('enc_')) {
        return plainPin === encryptedPin;
      }
      
      const decryptedPin = this.decryptPin(encryptedPin, userId);
      return plainPin === decryptedPin;
    } catch (error) {
      console.error('Erreur lors de la vérification du PIN:', error);
      return false;
    }
  },

  /**
   * Génère une clé de chiffrement à partir de l'ID utilisateur
   * @param userId L'ID de l'utilisateur
   * @returns Un tableau de chiffres pour le chiffrement
   */
  generateKey(userId: string): number[] {
    // Utiliser l'ID utilisateur pour générer une clé reproductible
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en entier 32 bits
    }
    
    // Générer 4 chiffres à partir du hash
    const key: number[] = [];
    for (let i = 0; i < 4; i++) {
      key.push(Math.abs(hash >> (i * 8)) % 10);
    }
    
    return key;
  }
};