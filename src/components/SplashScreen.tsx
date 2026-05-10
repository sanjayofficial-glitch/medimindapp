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
    <div 
      className="fixed inset-0 z-[9999] bg-emerald-600"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        width: '100vw', 
        height: '100vh'
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSkip}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 10000,
          color: 'rgba(255,255,255,0.8)',
          backgroundColor: 'rgba(255,255,255,0.1)',
        }}
        className="hover:text-white hover:bg-white/20 rounded-full"
      >
        <X className="w-5 h-5 mr-1" />
        Skip
      </Button>

      <div 
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="/animation.gif"
          alt="MediMind Animation"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            border: 'none',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;