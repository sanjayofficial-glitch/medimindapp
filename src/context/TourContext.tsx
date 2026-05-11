import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface TourStep {
  id: string;
  target: string;
  titleKey: string;
  descKey: string;
  position: "top" | "bottom" | "center";
}

interface TourContextType {
  isOpen: boolean;
  currentStep: number;
  steps: TourStep[];
  openTour: (steps?: TourStep[]) => void;
  closeTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  hasSeenOnboarding: boolean;
  markOnboardingSeen: () => void;
  restartTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

const STORAGE_KEY = "medimind_has_seen_onboarding";

export function TourProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) === "true";
    }
    return false;
  });

  const openTour = useCallback((newSteps?: TourStep[]) => {
    if (newSteps && newSteps.length > 0) {
      setSteps(newSteps);
    }
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const markOnboardingSeen = useCallback(() => {
    setHasSeenOnboarding(true);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const restartTour = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  return (
    <TourContext.Provider
      value={{
        isOpen,
        currentStep,
        steps,
        openTour,
        closeTour,
        nextStep,
        prevStep,
        goToStep,
        hasSeenOnboarding,
        markOnboardingSeen,
        restartTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within TourProvider");
  }
  return context;
}

export { TourStep };