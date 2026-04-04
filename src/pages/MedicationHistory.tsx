import React from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const MedicationHistory = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Medication History</h2>
      <div className="flex items-center justify-between mb-4">
        <Calendar className="w-10 h-10" />
        <Button variant="outline" className="text-gray-600 hover:text-gray-900">
          <span className="text-sm">View Details</span>
        </Button>
      </div>
      <div className="mt-4">
        <p className="text-gray-600">No history available yet.</p>
      </div>
    </div>
  );
};

export default MedicationHistory;