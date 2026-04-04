import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import AIChatModal from "./AIChatModal";

const AIButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-4 right-4 z-50 bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-lg p-2"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="w-6 h-6" />
      </Button>
      <AIChatModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default AIButton;