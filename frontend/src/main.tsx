import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Backend redirect uses FRONTEND_URL + "/oauth/...". Trailing slash in FRONTEND_URL yields
// https://host//oauth/... and pathname "//oauth/..." — React Router would not match /oauth/...
if (typeof window !== 'undefined') {
  const { pathname, search, hash } = window.location;
  if (pathname.startsWith('//')) {
    const normalized = pathname.replace(/^\/+/, '/');
    window.history.replaceState(null, '', `${normalized}${search}${hash}`);
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
