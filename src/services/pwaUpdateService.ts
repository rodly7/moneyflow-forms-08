
export const pwaUpdateService = {
  // Vérifier les mises à jour de l'application avec cache-busting
  checkForUpdates: async (): Promise<boolean> => {
    if ('serviceWorker' in navigator && 'serviceWorker' in window.navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Vérifier si une mise à jour est déjà en attente
          if (registration.waiting) {
            console.log('🔄 Mise à jour déjà en attente');
            return true;
          }
          
          // Vérifier si une nouvelle version est en cours d'installation
          if (registration.installing) {
            console.log('🔄 Installation en cours');
            return true;
          }
          
          // Forcer la vérification des mises à jour de manière plus agressive
          try {
            console.log('🔍 Vérification forcée des mises à jour...');
            await registration.update();
            
            // Attendre un peu pour que la vérification se termine
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Re-vérifier s'il y a une mise à jour en attente
            const updatedRegistration = await navigator.serviceWorker.getRegistration();
            const hasWaitingWorker = !!updatedRegistration?.waiting;
            
            if (hasWaitingWorker) {
              console.log('✅ Nouvelle mise à jour détectée !');
            } else {
              console.log('ℹ️ Pas de mise à jour disponible');
            }
            
            return hasWaitingWorker;
          } catch (updateError) {
            console.log('⚠️ Erreur lors de la vérification, re-tentative...');
            // Deuxième tentative après un délai
            setTimeout(async () => {
              try {
                await registration.update();
              } catch (e) {
                console.log('Deuxième tentative échouée:', e);
              }
            }, 2000);
            return false;
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification des mises à jour:', error);
      }
    }
    return false;
  },

  // Installer la mise à jour en attente avec reload forcé
  installUpdate: async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          console.log('🚀 Installation de la mise à jour...');
          
          // Envoyer le message au service worker
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Attendre un peu puis forcer le reload
          setTimeout(() => {
            // Vider le cache avant le reload
            if ('caches' in window) {
              caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                  caches.delete(cacheName);
                });
              });
            }
            
            // Reload avec cache-busting
            window.location.href = window.location.href + '?v=' + Date.now();
          }, 500);
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'installation de la mise à jour:', error);
        // Fallback: reload simple
        window.location.reload();
      }
    }
  },

  // Forcer une vérification immédiate
  forceUpdateCheck: async (): Promise<boolean> => {
    console.log('🔄 Vérification forcée des mises à jour...');
    
    // Vider les caches d'abord
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('🗑️ Cache vidé');
      } catch (e) {
        console.log('Erreur lors du vidage du cache:', e);
      }
    }
    
    return await pwaUpdateService.checkForUpdates();
  },

  // Écouter les mises à jour du service worker
  onUpdateAvailable: (callback: () => void): (() => void) => {
    if ('serviceWorker' in navigator) {
      const handleUpdateFound = () => {
        console.log('🎉 Mise à jour disponible détectée !');
        callback();
      };
      
      const handleControllerChange = () => {
        console.log('🔄 Nouveau service worker actif');
        callback();
      };
      
      // Écouter les changements de contrôleur
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      
      // Écouter les mises à jour trouvées
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          handleUpdateFound();
        }
      });
      
      // Vérifier immédiatement au démarrage
      setTimeout(() => {
        pwaUpdateService.checkForUpdates().then(hasUpdate => {
          if (hasUpdate) {
            handleUpdateFound();
          }
        });
      }, 1000);
      
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
    return () => {};
  }
};
