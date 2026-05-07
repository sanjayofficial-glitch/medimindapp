import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import AIChatModal from "./AIChatModal";
import { glowPulse, iconPop } from "@/lib/animations";

const AIButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        className="fixed bottom-24 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <motion.div
          variants={glowPulse}
          initial="rest"
          animate="pulse"
          whileHover="rest"
          className="rounded-full"
        >
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-xl shadow-emerald-500/25 w-14 h-14 p-0"
            onClick={() => setIsOpen(true)}
            title="Ask MediMind AI"
          >
            <motion.div variants={iconPop} initial="rest" whileHover="hover" whileTap="tap">
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
          </Button>
        </motion.div>
      </motion.div>
      <AIChatModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default AIButton;