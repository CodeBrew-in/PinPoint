import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { USE_API } from './lib/http';
import { initAuth } from './store/remote';
import './index.css';

if (USE_API) void initAuth(); // verify a saved login with the server before pages decide who is signed in

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
