import React from "react";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

const AIButton = () => {
  return (
    <Button
      size="lg"
      className="fixed bottom-4 right-4 z-50 bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-lg p-2"
      onClick={() => {
        // Optional: Add any desired action here (e.g., analytics, navigation)
        // Example: window.location.href = "/ai-chat";
      }}
    >
      <Bot className="w-6 h-6" />
    </Button>
  );
};

export default AIButton;