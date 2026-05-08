import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useOneSignal } from "@/hooks/use-one-signal";

const PUSH_PREFERENCE_KEY = "medimind_push_notifications_enabled";
const HIDDEN_ROUTES = new Set(["/", "/login", "/signup"]);

const NotificationPermissionPrompt = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  const { isEnabled, isSubscribing, isSupported, isConfigured, subscribe } = useOneSignal();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isAuthLoading || !user || isEnabled || !isSupported || !isConfigured) {
      setIsVisible(false);
      return;
    }

    if (HIDDEN_ROUTES.has(location.pathname)) {
      setIsVisible(false);
      return;
    }

    if (typeof Notification === "undefined") {
      setIsVisible(false);
      return;
    }

    if (Notification.permission === "denied") {
      setIsVisible(false);
      return;
    }

    if (localStorage.getItem(PUSH_PREFERENCE_KEY) === "false") {
      setIsVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setIsVisible(true), 700);
    return () => window.clearTimeout(timer);
  }, [isAuthLoading, user, isEnabled, isSupported, isConfigured, location.pathname]);

  const handleAllow = async () => {
    const success = await subscribe();
    if (success) {
      setIsVisible(false);
      toast.success("Notifications enabled.");
      return;
    }

    if (Notification.permission === "denied") {
      localStorage.setItem(PUSH_PREFERENCE_KEY, "false");
      setIsVisible(false);
      toast.error("Notifications are blocked in your browser settings.");
      return;
    }

    toast.error("Could not enable notifications. Please try again.");
  };

  const handleDismiss = () => {
    localStorage.setItem(PUSH_PREFERENCE_KEY, "false");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-4 bottom-40 z-[70] mx-auto max-w-md rounded-lg border border-emerald-100 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Dismiss notification prompt"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-3 pr-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <Bell className="h-5 w-5" />
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-950 dark:text-white">Turn on medicine reminders?</p>
            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-slate-300">
              Get a reminder when it is time to take your meds.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAllow}
              disabled={isSubscribing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Allow
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleDismiss} disabled={isSubscribing}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionPrompt;
