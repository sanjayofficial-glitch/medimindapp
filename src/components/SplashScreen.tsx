"use client";

import { useEffect, useState } from "react";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 bg-emerald-600 flex items-center justify-center z-50 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center justify-center w-full h-full">
        <img 
          src="/animation.gif" 
          alt="MediMind Animation"
          className="w-full max-w-sm h-auto max-h-[60vh] object-contain"
        />
        
        <h1 className="text-3xl font-bold text-white tracking-tight mt-4">MediMind</h1>
      </div>
    </div>
  );
};

export default SplashScreen;