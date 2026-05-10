"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [canComplete, setCanComplete] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = "/animation.gif";
    
    img.onload = () => {
      setCanComplete(true);
      
      setTimeout(() => {
        setShowSkip(true);
      }, 2000);

      timerRef.current = setTimeout(() => {
        onComplete();
      }, 5000);
    };

    img.onerror = () => {
      setCanComplete(true);
      onComplete();
    };

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [onComplete]);

  const handleSkip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onComplete();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#059669',
        width: '100vw',
        height: '100vh',
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSkip}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 100000,
          color: 'rgba(255,255,255,0.7)',
          backgroundColor: showSkip ? 'rgba(255,255,255,0.15)' : 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '20px',
          padding: '8px 16px',
          cursor: showSkip ? 'pointer' : 'not-allowed',
          opacity: showSkip ? 1 : 0,
          transition: 'opacity 0.3s ease, background-color 0.3s ease',
        }}
        onMouseEnter={(e) => {
          if (showSkip) {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)';
          }
        }}
        onMouseLeave={(e) => {
          if (showSkip) {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
          }
        }}
      >
        <X className="w-4 h-4 mr-1" />
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
          }}
        />
      </div>
    </div>
  );
};

export default SplashScreen;