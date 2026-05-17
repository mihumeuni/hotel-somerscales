import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from "./context/AuthContext";

// Apply saved theme before React renders, so the cream→marine flip is
// imperceptible on reload.
(() => {
  const t = localStorage.getItem("theme");
  if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
  // "light" and "system" both leave the attribute off → defaults to light tokens.
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
