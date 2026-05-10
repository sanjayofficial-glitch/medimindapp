"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import animationData from "../../public/animation.lottie";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [animationLoaded, setAnimationLoaded] = useState(false);

  useEffect(() => {
    setAnimationLoaded(true);
    
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

  return (
    <div className="fixed inset-0 bg-emerald-600 flex items-center justify-center z-50">
      <div className="w-64 h-64 md:w-80 md:h-80">
        {animationLoaded && (
          <Lottie 
            {...defaultOptions} 
            height={320}
            width={320}
          />
        )}
      </div>
    </div>
  );
};

export default SplashScreen;