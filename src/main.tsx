import { ErrorBoundary } from "./components/ErrorBoundary";
import { initializeNotifications } from "./utils/notifications";
import { createRoot } from "react-dom/client";
import App from "./App";

initializeNotifications().catch(console.error);

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);