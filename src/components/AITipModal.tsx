import { Button } from "@/components/ui/button";
import { Lightbulb, AlertTriangle } from "lucide-react";
import { askAIAssistant, getLocalDosageRules } from "@/utils/ai-assistant";
import { Medicine } from "@/utils/storage";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"; // Added missing imports

interface AITipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicine: Medicine;
}

export const AITipModal = ({ open, onOpenChange, medicine }: AITipModalProps) => {
  const [tip, setTip] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTip = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await askAIAssistant(`What are the dosage instructions and important precautions for ${medicine.name}?`, medicine);
      setTip(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tip");
      setTip(getLocalDosageRules(medicine.name)); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTip("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-emerald-600" />
            Dosage Tips for {medicine.name}
          </DialogTitle>
        </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          )}
          
          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Using Local Guidelines</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">{error}</p>
            </div>
          )}
                    {tip && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">{tip}</p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 italic">
                  Disclaimer: I am an AI, not a doctor. Consult a healthcare professional for medical advice.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={fetchTip} disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh Tip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};