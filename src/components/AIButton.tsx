import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import AIChatModal from "./AIChatModal";

const AIButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-20 right-6 z-50 bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-xl w-14 h-14 p-0 transition-transform hover:scale-110 active:scale-95"
        onClick={() => setIsOpen(true)}
        title="Ask MediMind AI"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </Button>
      <AIChatModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default AIButton;