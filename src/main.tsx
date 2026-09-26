import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}

// Disable pinch-to-zoom (2+ touches) while preserving 100% fast, immediate single-finger swipe scrolling
if (typeof window !== 'undefined') {
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

// Register service worker in production when not embedded in an iframe
if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator && window.self === window.top) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({
        immediate: false,
        onOfflineReady() {
          console.log('App ready offline');
        },
      });
    })
    .catch(() => {
      // Ignore if PWA SW registration fails
    });
}
