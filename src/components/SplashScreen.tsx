"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = "/animation.gif";
    
    img.onload = () => {
      setImageLoaded(true);
      
      skipTimerRef.current = setTimeout(() => {
        setShowSkip(true);
      }, 3000);
    };

    img.onerror = () => {
      onComplete();
    };

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    };
  }, [onComplete]);

  useEffect(() => {
    if (!imageLoaded) return;
    
    if (imgRef.current && imgRef.current.complete) {
      return;
    }

    timerRef.current = setTimeout(() => {
      onComplete();
    }, 8000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [imageLoaded, onComplete]);

  const handleSkip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
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
          color: 'rgba(255,255,255,0.8)',
          backgroundColor: showSkip ? 'rgba(255,255,255,0.15)' : 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '20px',
          padding: '8px 16px',
          cursor: showSkip ? 'pointer' : 'default',
          opacity: showSkip ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: showSkip ? 'auto' : 'none',
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
          ref={imgRef}
          src="/animation.gif"
          alt="MediMind Animation"
          onLoad={() => setImageLoaded(true)}
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