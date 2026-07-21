import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LanguageSync } from '@/i18n/LanguageSync';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ThemeSync } from '@/components/providers/ThemeSync';
import '@/i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageSync />
      <ThemeSync />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
