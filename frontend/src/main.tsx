import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';
import '@/shared/i18n/i18n';
import { bootstrapLocale } from '@/shared/i18n/bootstrapLocale';

// Backend redirect uses FRONTEND_URL + "/oauth/...". Trailing slash in FRONTEND_URL yields
// https://host//oauth/... and pathname "//oauth/..." — React Router would not match /oauth/...
if (typeof window !== 'undefined') {
  const { pathname, search, hash } = window.location;
  if (pathname.startsWith('//')) {
    const normalized = pathname.replace(/^\/+/, '/');
    window.history.replaceState(null, '', `${normalized}${search}${hash}`);
  }
}

function getRootEl(): HTMLElement {
  const el = document.getElementById('root');
  if (!el) {
    throw new Error('Failed to find the root element');
  }
  return el;
}

function RootLoading() {
  return (
    <div
      style={{
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      …
    </div>
  );
}

async function start() {
  await bootstrapLocale();
  createRoot(getRootEl()).render(
    <StrictMode>
      <Suspense fallback={<RootLoading />}>
        <App />
      </Suspense>
    </StrictMode>
  );
}

void start();
