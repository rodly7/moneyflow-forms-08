
import { useState, useEffect, useCallback } from 'react';

interface ResponsiveLayout {
  screenWidth: number;
  screenHeight: number;
  isPortrait: boolean;
  isLandscape: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  safeAreaTop: number;
  safeAreaBottom: number;
  isVerySmallMobile: boolean;
  isSmallMobile: boolean;
  isMediumMobile: boolean;
  dynamicViewportHeight: number;
  getAdaptiveSize: (baseSize: number) => number;
  getResponsiveGrid: (minCols: number, maxCols: number) => string;
  getOptimalColumns: (itemWidth: number, gap: number) => number;
}

export const useResponsiveLayout = (): ResponsiveLayout => {
  const [dimensions, setDimensions] = useState({
    screenWidth: 0,
    screenHeight: 0,
    safeAreaTop: 0,
    safeAreaBottom: 0
  });

  const updateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Récupérer les safe areas CSS
    const computedStyle = getComputedStyle(document.documentElement);
    const safeAreaTop = parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0');
    const safeAreaBottom = parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0');

    setDimensions({
      screenWidth: width,
      screenHeight: height,
      safeAreaTop,
      safeAreaBottom
    });
  }, []);

  useEffect(() => {
    updateDimensions();
    
    const handleResize = () => {
      // Debounce pour éviter trop d'appels
      setTimeout(updateDimensions, 100);
    };

    const handleOrientationChange = () => {
      // Délai pour laisser l'orientation se stabiliser
      setTimeout(updateDimensions, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateDimensions]);

  const { screenWidth, screenHeight, safeAreaTop, safeAreaBottom } = dimensions;

  // Déterminer l'orientation
  const isPortrait = screenHeight > screenWidth;
  const isLandscape = !isPortrait;

  // Déterminer le type d'appareil et les sous-catégories mobiles
  const deviceType: 'mobile' | 'tablet' | 'desktop' = 
    screenWidth < 768 ? 'mobile' :
    screenWidth < 1024 ? 'tablet' : 'desktop';

  // Catégories mobiles détaillées
  const isVerySmallMobile = screenWidth < 360;
  const isSmallMobile = screenWidth >= 360 && screenWidth < 414;
  const isMediumMobile = screenWidth >= 414 && screenWidth < 768;

  // Hauteur dynamique de viewport (pour gérer le clavier virtuel)
  const dynamicViewportHeight = screenHeight;

  // Fonction pour calculer une taille adaptative
  const getAdaptiveSize = useCallback((baseSize: number): number => {
    const scaleFactor = Math.min(screenWidth / 375, screenHeight / 667); // Base iPhone SE
    const minScale = 0.85;
    const maxScale = 1.3;
    const clampedScale = Math.max(minScale, Math.min(maxScale, scaleFactor));
    
    return Math.round(baseSize * clampedScale);
  }, [screenWidth, screenHeight]);

  // Fonction pour obtenir une grille responsive
  const getResponsiveGrid = useCallback((minCols: number, maxCols: number): string => {
    const cols = screenWidth < 400 ? minCols :
                 screenWidth < 600 ? Math.min(minCols + 1, maxCols) :
                 screenWidth < 900 ? Math.min(minCols + 2, maxCols) :
                 maxCols;
    
    return `grid-cols-${cols}`;
  }, [screenWidth]);

  // Fonction pour calculer le nombre optimal de colonnes
  const getOptimalColumns = useCallback((itemWidth: number, gap: number): number => {
    const availableWidth = screenWidth - 32; // padding horizontal
    const cols = Math.floor((availableWidth + gap) / (itemWidth + gap));
    return Math.max(1, Math.min(cols, 4)); // Entre 1 et 4 colonnes max
  }, [screenWidth]);

  return {
    screenWidth,
    screenHeight,
    isPortrait,
    isLandscape,
    deviceType,
    safeAreaTop,
    safeAreaBottom,
    isVerySmallMobile,
    isSmallMobile,
    isMediumMobile,
    dynamicViewportHeight,
    getAdaptiveSize,
    getResponsiveGrid,
    getOptimalColumns
  };
};
