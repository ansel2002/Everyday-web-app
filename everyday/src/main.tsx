import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { boot, watchAuth } from './data/session';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/ui.css';
import './styles/screens.css';

// Ask the browser not to clear this app's storage when space runs low. No prompt in most browsers.
navigator.storage?.persist?.().catch(() => {});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Work out who is here (signed in? unlocked?) and follow sign-in from a magic link.
void watchAuth();
void boot().then(() => {
  // A magic link returns with ?code=… ; once the session is saved, tidy the address.
  if (new URLSearchParams(window.location.search).has('code')) {
    window.history.replaceState(null, '', window.location.pathname + (window.location.hash || '#/today'));
  }
});
