/**
 * Utilitaires pour optimiser les performances globales de l'application
 */

// Cache pour les calculs coûteux
const calculationCache = new Map<string, any>();

/**
 * Cache intelligent pour les calculs
 */
export const memoizeCalculation = <T>(
  key: string,
  calculation: () => T,
  ttl: number = 5 * 60 * 1000 // 5 minutes par défaut
): T => {
  const cached = calculationCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.value;
  }
  
  const result = calculation();
  calculationCache.set(key, {
    value: result,
    timestamp: Date.now()
  });
  
  return result;
};

/**
 * Nettoie le cache expiré
 */
export const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of calculationCache.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) { // 10 minutes
      calculationCache.delete(key);
    }
  }
};

/**
 * Optimise les requêtes en lot
 */
export class BatchProcessor<T, R> {
  private queue: Array<{ item: T; resolve: (result: R) => void; reject: (error: Error) => void }> = [];
  private processing = false;
  private batchSize: number;
  private delay: number;

  constructor(batchSize: number = 10, delay: number = 100) {
    this.batchSize = batchSize;
    this.delay = delay;
  }

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      this.scheduleProcess();
    });
  }

  private scheduleProcess() {
    if (this.processing) return;
    
    setTimeout(() => this.process(), this.delay);
  }

  private async process() {
    if (this.queue.length === 0 || this.processing) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      // Traiter le lot (à implémenter selon les besoins)
      const results = await this.processBatch(batch.map(item => item.item));
      
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error as Error);
      });
    } finally {
      this.processing = false;
      
      // Traiter le lot suivant s'il y en a un
      if (this.queue.length > 0) {
        this.scheduleProcess();
      }
    }
  }

  protected async processBatch(items: T[]): Promise<R[]> {
    // À surcharger dans les implémentations concrètes
    throw new Error('processBatch must be implemented');
  }
}

/**
 * Gestionnaire de priorité pour les tâches
 */
export class TaskPriorityQueue {
  private highPriority: Array<() => Promise<void>> = [];
  private mediumPriority: Array<() => Promise<void>> = [];
  private lowPriority: Array<() => Promise<void>> = [];
  private processing = false;

  addTask(task: () => Promise<void>, priority: 'high' | 'medium' | 'low' = 'medium') {
    switch (priority) {
      case 'high':
        this.highPriority.push(task);
        break;
      case 'medium':
        this.mediumPriority.push(task);
        break;
      case 'low':
        this.lowPriority.push(task);
        break;
    }
    
    this.processNext();
  }

  private async processNext() {
    if (this.processing) return;
    
    const nextTask = this.getNextTask();
    if (!nextTask) return;
    
    this.processing = true;
    
    try {
      await nextTask();
    } catch (error) {
      console.error('Task execution failed:', error);
    } finally {
      this.processing = false;
      // Traiter la tâche suivante
      setTimeout(() => this.processNext(), 0);
    }
  }

  private getNextTask(): (() => Promise<void>) | null {
    if (this.highPriority.length > 0) {
      return this.highPriority.shift()!;
    }
    if (this.mediumPriority.length > 0) {
      return this.mediumPriority.shift()!;
    }
    if (this.lowPriority.length > 0) {
      return this.lowPriority.shift()!;
    }
    return null;
  }
}

/**
 * Instance globale du gestionnaire de tâches
 */
export const taskQueue = new TaskPriorityQueue();

/**
 * Optimise les mises à jour du DOM
 */
export const batchDOMUpdates = (() => {
  const updates: Array<() => void> = [];
  let scheduled = false;

  return (update: () => void) => {
    updates.push(update);
    
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        updates.forEach(update => update());
        updates.length = 0;
        scheduled = false;
      });
    }
  };
})();

/**
 * Gestionnaire de ressources pour éviter les fuites mémoire
 */
export class ResourceManager {
  private resources = new Set<() => void>();

  addResource(cleanup: () => void) {
    this.resources.add(cleanup);
  }

  cleanup() {
    this.resources.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    });
    this.resources.clear();
  }
}

/**
 * Service worker pour le cache intelligent
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

/**
 * Nettoyage automatique du cache toutes les 30 minutes
 */
if (typeof window !== 'undefined') {
  setInterval(cleanExpiredCache, 30 * 60 * 1000);
}