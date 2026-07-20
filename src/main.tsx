import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite environment WebSocket connection errors and unhandled rejections
if (typeof window !== 'undefined') {
  const isViteOrWS = (err: any) => {
    const errMsg = String(err?.message || err?.reason || err || '').toLowerCase();
    return (
      errMsg.includes('websocket') ||
      errMsg.includes('web-socket') ||
      errMsg.includes('vite') ||
      errMsg.includes('hmr') ||
      errMsg.includes('closed without opened') ||
      errMsg.includes('connection closed')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isViteOrWS(event.reason) || isViteOrWS(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isViteOrWS(event.error) || isViteOrWS(event.message) || isViteOrWS(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

