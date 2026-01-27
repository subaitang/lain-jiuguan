import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress Vercel Toolbar warnings and other noise
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args.map(a => String(a)).join(' ');
  if (msg.includes('Default export is deprecated') || msg.includes('zustand')) return;
  originalWarn(...args);
};

// Optional: Suppress specific errors if they are external noise
const originalError = console.error;
console.error = (...args) => {
  const msg = args.map(a => String(a)).join(' ');
  if (msg.includes('The message port closed before a response was received')) return;
  originalError(...args);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);