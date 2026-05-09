import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AIContextType {
  aiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

const AI_STORAGE_KEY = "medimind_ai_enabled";

export const AIProvider = ({ children }: { children: ReactNode }) => {
  const [aiEnabled, setAiEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(AI_STORAGE_KEY);
      return stored !== null ? stored === "true" : true;
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem(AI_STORAGE_KEY, String(aiEnabled));
  }, [aiEnabled]);

  const setAiEnabled = (enabled: boolean) => {
    setAiEnabledState(enabled);
  };

  return (
    <AIContext.Provider value={{ aiEnabled, setAiEnabled }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
};