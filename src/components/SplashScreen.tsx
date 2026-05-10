"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch("/animation.lottie")
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Failed to load animation:", err));
  }, []);

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
      <div className="flex flex-col items-center gap-4 w-80 h-80">
        {animationData ? (
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            className="w-full h-full"
          />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-white tracking-tight">MediMind</h1>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;