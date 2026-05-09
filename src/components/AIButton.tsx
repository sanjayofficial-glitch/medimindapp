"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight } from "lucide-react";
import AIChatModal from "./AIChatModal";
import { iconPop } from "@/lib/animations";
import { useAI } from "@/context/AIContext";

const AIButton = () => {
  const { aiEnabled } = useAI();
  const [isOpen, setIsOpen] = useState(false);

  if (!aiEnabled) return null;

  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-between h-16 px-4 hover:bg-emerald-50 hover:text-emerald-700 transition-all group"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200 transition-colors">
            <motion.div variants={iconPop} initial="rest" whileHover="hover" whileTap="tap">
              <Sparkles className="w-5 h-5" />
            </motion.div>
          </div>
          <div className="text-left">
            <p className="font-medium">MediMind AI</p>
            <p className="text-xs text-muted-foreground">Ask anything about your health</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
      </Button>
      <AIChatModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default AIButton;