import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setupPdfjs } from './utils/pdfSetup';
import { NotificationProvider } from './components/Notification';

// Initialize PDF.js
setupPdfjs();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>
);
