import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AITipModal } from "./AITipModal";
import { Medicine } from "@/utils/storage";
import { getMedicines } from "@/utils/storage";

interface NotificationAction {
  type: 'taken' | 'snooze-5' | 'snooze-15' | 'snooze-30';
  medicineId: string;
}

export const NotificationHandler = () => {
  const [showAITip, setShowAITip] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState<Medicine | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleNotificationAction = (event: CustomEvent) => {
      const action = event.detail as NotificationAction;
      
      if (action.type === 'taken') {
        // Mark as taken in storage
        const medicines = getMedicines();
        const medicine = medicines.find(m => m.id === action.medicineId);
        if (medicine) {
          setCurrentMedicine(medicine);
          setShowAITip(true);
          toast.success(`Marked ${medicine.name} as taken!`);
        }
      } else if (action.type.startsWith('snooze-')) {
        const duration = parseInt(action.type.split('-')[1]);
        toast.info(`Snoozed for ${duration} minutes`);
      }
    };

    window.addEventListener('medimind_notification_action', handleNotificationAction);
    return () => window.removeEventListener('medimind_notification_action', handleNotificationAction);
  }, []);

  return (
    <>
      <AITipModal
        open={showAITip}
        onOpenChange={setShowAITip}
        medicine={currentMedicine!}
      />
    </>
  );
};