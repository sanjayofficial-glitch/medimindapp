"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/animation.gif";
    img.onload = () => setImageLoaded(true);
  }, []);

  useEffect(() => {
    if (!imageLoaded) return;
    
    const duration = 3000;
    const timer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [imageLoaded, onComplete]);

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-emerald-600 z-50 overflow-hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSkip}
        className="absolute top-4 right-4 z-50 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
      >
        <X className="w-5 h-5 mr-1" />
        Skip
      </Button>

      <div className="w-full h-full flex items-center justify-center p-4">
        <img
          src="/animation.gif"
          alt="MediMind Animation"
          className="w-full h-full max-w-2xl max-h-[80vh] object-contain"
        />
      </div>
    </div>
  );
};

export default SplashScreen;