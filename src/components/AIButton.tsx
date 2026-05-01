import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import AIChatModal from "./AIChatModal";

const AIButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        className="fixed bottom-24 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0px rgba(16, 185, 129, 0.4)",
              "0 0 0 15px rgba(16, 185, 129, 0)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="rounded-full"
        >
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-xl w-14 h-14 p-0"
            onClick={() => setIsOpen(true)}
            title="Ask MediMind AI"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </Button>
        </motion.div>
      </motion.div>
      <AIChatModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default AIButton;