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
      console.log('Service Worker manually disabled via URL');
      return;
    }

    const serviceWorkerUrl = `${import.meta.env.BASE_URL}sw.js`
    navigator.serviceWorker.register(serviceWorkerUrl)
      .then(reg => {
        console.log('Service Worker registered successfully:', reg.scope);
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error)
      })
  })
}
