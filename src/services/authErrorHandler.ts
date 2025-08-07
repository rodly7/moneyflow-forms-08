
export class AuthErrorHandler {
  private static retryCount = new Map<string, number>();
  private static maxRetries = 3;

  static async handleAuthError(error: any, operation: string): Promise<boolean> {
    const errorKey = `${operation}_${error?.message || 'unknown'}`;
    const currentRetries = this.retryCount.get(errorKey) || 0;

    if (currentRetries >= this.maxRetries) {
      console.error(`❌ Max retries exceeded for ${operation}:`, error);
      this.retryCount.delete(errorKey);
      return false;
    }

    this.retryCount.set(errorKey, currentRetries + 1);
    
    // Attendre avant de réessayer
    await new Promise(resolve => setTimeout(resolve, 1000 * currentRetries));
    
    return true;
  }

  static clearRetries(operation: string) {
    const keysToDelete = Array.from(this.retryCount.keys()).filter(key => 
      key.startsWith(`${operation}_`)
    );
    keysToDelete.forEach(key => this.retryCount.delete(key));
  }
}
