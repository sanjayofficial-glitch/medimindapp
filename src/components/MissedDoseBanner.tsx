"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MissedDose } from "@/utils/notifications";

interface MissedDoseBannerProps {
  missedDoses: MissedDose[];
  onDismiss: (medicineId: string) => void;
}

export default function MissedDoseBanner({ missedDoses, onDismiss }: MissedDoseBannerProps) {
  if (missedDoses.length === 0) return null;

  return (
    <div className="space-y-2">
      {missedDoses.map((dose) => (
        <Alert key={dose.medicineId} className="bg-rose-50 border-rose-200 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-rose-400 hover:text-rose-600 hover:bg-rose-100"
            onClick={() => onDismiss(dose.medicineId)}
          >
            <X className="w-4 h-4" />
          </Button>
          <Heart className="h-4 w-4 text-rose-500" />
          <AlertTitle className="text-rose-800 font-semibold">
            You missed your {dose.medicineName} dose ❤️
          </AlertTitle>
          <AlertDescription className="text-rose-700">
            Take care! Consider taking it now if possible.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}