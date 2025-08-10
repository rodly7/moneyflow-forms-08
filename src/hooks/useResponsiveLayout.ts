
import { useState, useEffect } from 'react';

interface ResponsiveLayoutInfo {
  screenWidth: number;
  screenHeight: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isVerySmallMobile: boolean; // < 360px
  isSmallMobile: boolean; // 360-414px
  isMediumMobile: boolean; // 414-768px
  isTablet: boolean; // 768-1024px
  isDesktop: boolean; // > 1024px
  aspectRatio: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  dynamicViewportHeight: number;
}

export const useResponsiveLayout = (): ResponsiveLayoutInfo => {
  const [layoutInfo, setLayoutInfo] = useState<ResponsiveLayoutInfo>({
    screenWidth: 0,
    screenHeight: 0,
    isPortrait: true,
    isLandscape: false,
    isVerySmallMobile: false,
    isSmallMobile: false,
    isMediumMobile: false,
    isTablet: false,
    isDesktop: false,
    aspectRatio: 1,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    dynamicViewportHeight: 0,
  });

  useEffect(() => {
    const updateLayoutInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspectRatio = width / height;

      // Calcul des safe areas
      const computedStyle = getComputedStyle(document.documentElement);
      const safeAreaTop = parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0');
      const safeAreaBottom = parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0');

      // Hauteur dynamique pour éviter les problèmes de viewport sur mobile
      const dynamicViewportHeight = window.visualViewport?.height || height;

      const newLayoutInfo: ResponsiveLayoutInfo = {
        screenWidth: width,
        screenHeight: height,
        isPortrait: height > width,
        isLandscape: width > height,
        isVerySmallMobile: width < 360,
        isSmallMobile: width >= 360 && width < 414,
        isMediumMobile: width >= 414 && width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        aspectRatio,
        safeAreaTop,
        safeAreaBottom,
        dynamicViewportHeight,
      };

      setLayoutInfo(newLayoutInfo);

      // Mise à jour des variables CSS pour l'adaptation mobile
      document.documentElement.style.setProperty('--screen-width', `${width}px`);
      document.documentElement.style.setProperty('--screen-height', `${height}px`);
      document.documentElement.style.setProperty('--dynamic-vh', `${dynamicViewportHeight * 0.01}px`);
    };

    updateLayoutInfo();
    
    window.addEventListener('resize', updateLayoutInfo);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateLayoutInfo, 100); // Délai pour attendre la fin de l'animation
    });

    // Support pour visual viewport (clavier virtuel)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateLayoutInfo);
    }

    return () => {
      window.removeEventListener('resize', updateLayoutInfo);
      window.removeEventListener('orientationchange', updateLayoutInfo);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateLayoutInfo);
      }
    };
  }, []);

  return layoutInfo;
};
