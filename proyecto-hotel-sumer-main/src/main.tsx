import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from "./context/AuthContext";

// Single shared client. staleTime keeps tab-switching cheap; gcTime lets
// inactive queries linger so a quick away-and-back skips the refetch.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Apply saved theme before React renders, so the cream→marine flip is
// imperceptible on reload.
(() => {
  const t = localStorage.getItem("theme");
  if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
  // "light" and "system" both leave the attribute off → defaults to light tokens.
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            fontSize: "14px",
            borderRadius: "10px",
            background: "var(--color-surface)",
            color: "var(--color-ink)",
            border: "1px solid rgb(226 232 240)",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
          },
          success: {
            iconTheme: { primary: "var(--color-marine)", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "var(--color-terracotta)", secondary: "#fff" },
          },
        }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
