import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { initMockEnv } from './mockEnv';
import { App } from './App';
import './index.css';

// Mock environment for local development
initMockEnv();

const root = ReactDOM.createRoot(document.getElementById('root')!);

// Check if Telegram WebApp is available
const isTelegramWebApp = !!window.Telegram?.WebApp;

if (isTelegramWebApp || import.meta.env.DEV) {
  // Initialize Telegram WebApp
  if (isTelegramWebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }

  // Render app
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  // Not in Telegram environment
  root.render(
    <div style={{
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>⚠️ Environment Not Supported</h1>
      <p>This app must be opened in Telegram.</p>
      <p style={{ fontSize: '14px', color: '#666' }}>
        Please open this app through a Telegram bot.
      </p>
    </div>
  );
}
