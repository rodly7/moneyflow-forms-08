/**
 * Utilitaires pour optimiser les images et améliorer les performances
 */

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  loading?: 'lazy' | 'eager';
  className?: string;
}

/**
 * Génère des URLs d'images optimisées avec différentes résolutions
 */
export const generateResponsiveImageUrls = (baseUrl: string, sizes: number[]) => {
  return sizes.map(size => ({
    src: `${baseUrl}?w=${size}&q=80`,
    width: size,
    descriptor: `${size}w`
  }));
};

/**
 * Crée un srcSet pour les images responsives
 */
export const createSrcSet = (baseUrl: string, sizes: number[] = [320, 640, 768, 1024, 1280, 1920]) => {
  const urls = generateResponsiveImageUrls(baseUrl, sizes);
  return urls.map(url => `${url.src} ${url.descriptor}`).join(', ');
};

/**
 * Optimise automatiquement les images selon le contexte
 */
export const getOptimizedImageProps = ({
  src,
  alt,
  width,
  height,
  quality = 80,
  loading = 'lazy',
  className
}: OptimizedImageProps) => {
  const optimizedSrc = `${src}?w=${width || 800}&h=${height || 600}&q=${quality}`;
  
  return {
    src: optimizedSrc,
    alt,
    width,
    height,
    loading,
    className,
    decoding: 'async' as const,
    // Générer automatiquement les tailles responsives
    srcSet: width ? createSrcSet(src, [
      Math.floor(width * 0.5),
      Math.floor(width * 0.75),
      width,
      Math.floor(width * 1.5),
      Math.floor(width * 2)
    ]) : undefined,
    sizes: width ? `(max-width: ${Math.floor(width * 0.75)}px) 100vw, ${width}px` : undefined,
  };
};

/**
 * Précharge les images critiques pour améliorer les performances
 */
export const preloadImages = (imageUrls: string[]) => {
  if (typeof window !== 'undefined') {
    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }
};

/**
 * Détecte le support WebP et retourne le format approprié
 */
export const detectWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Crée une image progressive avec effet de fondu
 */
export class ProgressiveImage {
  private container: HTMLElement;
  private lowQualityImg: HTMLImageElement;
  private highQualityImg: HTMLImageElement;
  private loaded = false;

  constructor(container: HTMLElement, lowQualitySrc: string, highQualitySrc: string) {
    this.container = container;
    this.lowQualityImg = new Image();
    this.highQualityImg = new Image();
    
    this.init(lowQualitySrc, highQualitySrc);
  }

  private init(lowQualitySrc: string, highQualitySrc: string) {
    // Charger d'abord l'image basse qualité
    this.lowQualityImg.onload = () => {
      this.container.style.backgroundImage = `url(${lowQualitySrc})`;
      this.container.style.filter = 'blur(2px)';
      this.loadHighQuality(highQualitySrc);
    };
    
    this.lowQualityImg.src = lowQualitySrc;
  }

  private loadHighQuality(highQualitySrc: string) {
    this.highQualityImg.onload = () => {
      if (!this.loaded) {
        this.container.style.backgroundImage = `url(${highQualitySrc})`;
        this.container.style.filter = 'none';
        this.container.style.transition = 'filter 0.3s ease-out';
        this.loaded = true;
      }
    };
    
    this.highQualityImg.src = highQualitySrc;
  }
}

/**
 * Hook pour les images avec lazy loading intelligent
 */
export const createIntersectionObserver = (callback: (entry: IntersectionObserverEntry) => void) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    // Fallback pour les navigateurs non supportés
    setTimeout(() => callback({} as IntersectionObserverEntry), 100);
    return null;
  }

  return new IntersectionObserver((entries) => {
    entries.forEach(callback);
  }, {
    rootMargin: '50px 0px', // Commence à charger 50px avant que l'image soit visible
    threshold: 0.1
  });
};