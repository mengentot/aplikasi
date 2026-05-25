// Safeguard against environments or extensions trying to assign to read-only/getter-only window.fetch
try {
  let activeFetch = window.fetch;
  Object.defineProperty(window, 'fetch', {
    get() {
      return activeFetch;
    },
    set(newFetch) {
      activeFetch = newFetch;
    },
    configurable: true,
    enumerable: true
  });
} catch (err) {
  console.debug("Safe window.fetch override bypass:", err);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
