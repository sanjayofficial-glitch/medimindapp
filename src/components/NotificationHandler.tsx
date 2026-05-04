import { useEffect, useState } from "react";
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

  useEffect(() => {
    const handleNotificationAction = (event: CustomEvent) => {
      const action = event.detail as NotificationAction;
      
      if (action.type === 'taken') {
        const medicines = getMedicines();
        const medicine = medicines.find(m => m.id === action.medicineId);
        if (medicine) {
          setCurrentMedicine(medicine);
          setShowAITip(true);
          toast.success(`Marked ${medicine.name} as taken!`);
        }
      } else if (action.type.startsWith('snooze-')) {
        const duration = parseInt(action.type.split('-')[1], 10);
        toast.info(`Snoozed for ${duration} minutes`);
      }
    };

    window.addEventListener('medimind_notification_action', handleNotificationAction as EventListener);
    
    return () => {
      window.removeEventListener('medimind_notification_action', handleNotificationAction as EventListener);
    };
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