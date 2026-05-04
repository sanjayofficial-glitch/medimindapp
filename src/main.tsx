import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initializeNotifications, requestNotificationPermission } from "./utils/notifications";

// Initialize notifications and request permissions
requestNotificationPermission().then((granted) => {
  if (granted) {
    initializeNotifications();
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>
);