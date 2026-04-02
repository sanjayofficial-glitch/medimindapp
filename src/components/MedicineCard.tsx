"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock, Pill } from "lucide-react";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  taken: boolean;
  instructions?: string;
}

interface MedicineCardProps {
  medicine: Medicine;
  onToggleTaken: (id: string) => void;
}

export default function MedicineCard({ medicine, onToggleTaken }: MedicineCardProps) {
  const isPast = new Date().getHours() > parseInt(medicine.time.split(":")[0]);
  const isNow = Math.abs(new Date().getHours() - parseInt(medicine.time.split(":")[0])) <= 1;

  return (
    <Card className={`border-0 shadow-sm p-4 transition-all ${medicine.taken ? "bg-gray-50 opacity-75" : "bg-white"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg mt-1 ${medicine.taken ? "bg-gray-200" : "bg-[#4CAF50]/10"}`}>
            <Pill className={`w-5 h-5 ${medicine.taken ? "text-gray-400" : "text-[#4CAF50]"}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold ${medicine.taken ? "text-gray-500 line-through" : "text-gray-800"}`}>
                {medicine.name}
              </h3>
              <Badge variant={medicine.taken ? "secondary" : "default"} className={`text-xs ${medicine.taken ? "bg-gray-200 text-gray-600" : "bg-[#4CAF50]/10 text-[#4CAF50] hover:bg-[#4CAF50]/20"}`}>
                {medicine.dosage}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {medicine.time}
              </span>
              <span>•</span>
              <span>{medicine.frequency}</span>
              {medicine.instructions && (
                <>
                  <span>•</span>
                  <span className="text-[#FF6B35]">{medicine.instructions}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant={medicine.taken ? "outline" : "default"}
          onClick={() => onToggleTaken(medicine.id)}
          className={`h-9 px-3 rounded-lg ${
            medicine.taken
              ? "border-gray-300 text-gray-500 hover:bg-gray-100"
              : "bg-[#4CAF50] hover:bg-[#43A047] text-white"
          }`}
        >
          {medicine.taken ? (
            <Check className="w-4 h-4" />
          ) : (
            "Take"
          )}
        </Button>
      </div>
    </Card>
  );
}