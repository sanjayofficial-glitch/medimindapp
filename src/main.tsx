import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { queryClient } from "./lib/query-client";
import { getServiceWorkerRegistration } from "./utils/push-notifications";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await getServiceWorkerRegistration();
      console.log('[APP] Service Worker initialized');
    } catch (error) {
      console.error('[APP] Service Worker init failed:', error);
    }
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);