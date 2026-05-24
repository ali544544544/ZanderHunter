import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Debug-Option: ?no-sw in der URL deaktiviert den Service Worker
    if (window.location.search.includes('no-sw')) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          for (const cacheName of cacheNames) {
            if (cacheName.startsWith('zanderhunter-')) {
              caches.delete(cacheName);
            }
          }
        });
      }
      console.log('Service Worker manually disabled via URL');
      return;
    }

    let reloadedForServiceWorkerUpdate = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadedForServiceWorkerUpdate) return;
      reloadedForServiceWorkerUpdate = true;
      window.location.reload();
    });

    const serviceWorkerUrl = `${import.meta.env.BASE_URL}sw.js?v=15`
    navigator.serviceWorker.register(serviceWorkerUrl)
      .then(reg => {
        reg.update();
        console.log('Service Worker registered successfully:', reg.scope);
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error)
      })
  })
}
