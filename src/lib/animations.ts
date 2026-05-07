import { Variants } from "framer-motion";

export const iconHover: Variants = {
  rest: { scale: 1, rotate: 0 },
  hover: { 
    scale: 1.15, 
    rotate: 5,
    transition: { type: "spring", stiffness: 400, damping: 17 }
  },
  tap: { 
    scale: 0.9,
    transition: { duration: 0.1 }
  }
};

export const iconBounce: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: [1, 1.15, 1],
    transition: { duration: 0.4, times: [0, 0.5, 1] }
  }
};

export const buttonTap: Variants = {
  rest: { scale: 1 },
  tap: { 
    scale: 0.97,
    transition: { duration: 0.1 }
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.15 }
  }
};

export const cardHover: Variants = {
  rest: { y: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  hover: { 
    y: -3,
    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
    transition: { duration: 0.2 }
  }
};

export const cardInteractive: Variants = {
  rest: { scale: 1, borderColor: "rgba(226, 232, 240, 1)" },
  hover: { 
    scale: 1.01,
    borderColor: "rgba(16, 185, 129, 0.5)",
    transition: { duration: 0.15 }
  },
  tap: { 
    scale: 0.99,
    transition: { duration: 0.1 }
  }
};

export const popIn: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  }
};

export const slideInUp: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
};

export const slideInLeft: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const staggerItem: Variants = {
  hidden: { y: 10, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
};

export const pulse: Variants = {
  rest: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
};

export const shimmer: Variants = {
  rest: { opacity: 1 },
  hover: { 
    opacity: 0.8,
    transition: { duration: 0.15 }
  }
};

export const numberPop: Variants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 20 }
  }
};

export const iconPop: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: [1, 1.2, 1.1],
    transition: { duration: 0.3, times: [0, 0.5, 1] }
  },
  tap: { 
    scale: 0.85,
    transition: { duration: 0.1 }
  }
};

export const chevronSlide: Variants = {
  rest: { x: 0, opacity: 0.5 },
  hover: { 
    x: 4, 
    opacity: 1,
    transition: { duration: 0.2 }
  }
};

export const glowPulse: Variants = {
  rest: { 
    boxShadow: "0 0 0 0px rgba(16, 185, 129, 0)" 
  },
  pulse: {
    boxShadow: [
      "0 0 0 0px rgba(16, 185, 129, 0.4)",
      "0 0 0 10px rgba(16, 185, 129, 0)"
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
};

export const inputFocus: Variants = {
  rest: { scale: 1 },
  focus: { 
    scale: 1.02,
    transition: { duration: 0.15 }
  }
};

export const listItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { 
      delay: i * 0.03,
      type: "spring", 
      stiffness: 300, 
      damping: 25 
    }
  })
};

export const scaleIn: Variants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { 
      delay: i * 0.05,
      type: "spring", 
      stiffness: 400, 
      damping: 30 
    }
  })
};

export const bounceIn: Variants = {
  hidden: { scale: 0.3, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 20 }
  }
};

export const gentleBounce: Variants = {
  rest: { y: 0 },
  hover: { 
    y: [0, -3, -2, -3, 0],
    transition: { duration: 0.4 }
  }
};

export const rotatePop: Variants = {
  rest: { scale: 1, rotate: 0 },
  hover: { 
    scale: [1, 1.1, 1],
    rotate: [0, 10, 0],
    transition: { duration: 0.4 }
  }
};

export const scaleRotateTap: Variants = {
  rest: { scale: 1, rotate: 0 },
  hover: { 
    scale: 1.08,
    rotate: 3,
    transition: { type: "spring", stiffness: 400, damping: 20 }
  },
  tap: { 
    scale: 0.95,
    rotate: -3,
    transition: { duration: 0.1 }
  }
};