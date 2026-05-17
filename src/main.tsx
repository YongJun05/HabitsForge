/**
 * main.tsx
 * 
 * Application entry point. Mounts the React component tree to the DOM
 * and imports global CSS.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
