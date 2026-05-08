import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setupNotificationClickHandler } from "@/utils/onesignal";

const NotificationClickHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setupNotificationClickHandler((data) => {
      console.log("[NotificationClickHandler] Notification clicked:", data);

      if (data.action === "medication_reminder" || data.dose_log_id || data.medicine_id) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return null;
};

export default NotificationClickHandler;