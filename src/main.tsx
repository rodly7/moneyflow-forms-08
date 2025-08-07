
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Configuration PWA améliorée
const initializePWA = () => {
  console.log('Initializing PWA...');
  
  // Service Worker Registration
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    })
    .then((registration) => {
      console.log('SW registered: ', registration.scope);
      
      // Vérifier les mises à jour toutes les heures
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
      
    })
    .catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  }

  // Configuration pour iOS
  if (/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())) {
    // Empêcher le zoom sur les inputs
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    });

    // Gérer la barre d'état sur iOS
    const metaThemeColor = document.querySelector('meta[name=theme-color]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#2563eb');
    }
  }
};

// Initialiser la PWA après le chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  initializePWA();
});

// Si le DOM est déjà chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePWA);
} else {
  initializePWA();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
