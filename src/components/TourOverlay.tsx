import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X, Bell, BellOff } from "lucide-react";
import { useTour } from "../context/TourContext";
import { useTranslation } from "../i18n";

interface TourOverlayProps {
  className?: string;
}

export function TourOverlay({ className = "" }: TourOverlayProps) {
  const { isOpen, currentStep, steps, closeTour, nextStep, prevStep, goToStep, markOnboardingSeen } = useTour();
  const { t, language } = useTranslation();
  const [box, setBox] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const totalSteps = steps.length;

  const updateBox = useCallback(() => {
    if (!step?.target) {
      setBox(null);
      return;
    }

    const targetEl = document.getElementById(step.target);
    if (!targetEl || !containerRef.current) {
      setBox(null);
      return;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const padding = 12;

    setBox({
      top: targetRect.top - containerRect.top - padding,
      left: targetRect.left - containerRect.left - padding,
      width: targetRect.width + padding * 2,
      height: targetRect.height + padding * 2,
    });
  }, [step?.target]);

  useEffect(() => {
    if (isOpen && step?.target) {
      updateBox();
      window.addEventListener("resize", updateBox);
      window.addEventListener("scroll", updateBox, true);
      
      const scrollEl = document.querySelector("[data-tour-container]") || document.querySelector(".overflow-auto");
      if (scrollEl) {
        scrollEl.addEventListener("scroll", updateBox, true);
      }
      
      return () => {
        window.removeEventListener("resize", updateBox);
        window.removeEventListener("scroll", updateBox, true);
      };
    }
  }, [isOpen, step?.target, updateBox]);

  const handleComplete = useCallback(() => {
    markOnboardingSeen();
    closeTour();
  }, [markOnboardingSeen, closeTour]);

  const handleNext = useCallback(() => {
    if (isLast) {
      handleComplete();
    } else {
      nextStep();
    }
  }, [isLast, nextStep, handleComplete]);

  const handlePrev = useCallback(() => {
    if (isFirst) return;
    prevStep();
  }, [isFirst, prevStep]);

  const getTooltipPosition = () => {
    if (!box) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    if (step.position === "center") {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    if (step.position === "bottom") {
      const topPos = box.top + box.height + 220;
      return {
        top: `${Math.min(topPos, window.innerHeight - 380)}px`,
        left: "50%",
        transform: "translateX(-50%)",
      };
    }

    const topPos = box.top - 230;
    return {
      top: `${Math.max(topPos, 60)}px`,
      left: "50%",
      transform: "translateX(-50%)",
    };
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] overflow-hidden pointer-events-none ${className}`}
    >
      <style>{`
        @keyframes tour-pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.4), 0 0 0 0 rgba(22, 163, 74, 0.8);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(22, 163, 74, 0.2), 0 0 0 12px rgba(22, 163, 74, 0.3);
          }
        }
        @keyframes tour-arrow-bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(10px); }
        }
        @keyframes tour-arrow-bounce-up {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }
        @keyframes tour-float {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .tour-highlight-glow {
          animation: tour-pulse-glow 2s ease-in-out infinite;
        }
        .tour-arrow-down {
          animation: tour-arrow-bounce 1.2s ease-in-out infinite;
        }
        .tour-arrow-up {
          animation: tour-arrow-bounce-up 1.2s ease-in-out infinite;
        }
      `}</style>

      {box && step?.target && (
        <div
          className="absolute pointer-events-auto"
          style={{
            position: "absolute",
            top: box.top - 4,
            left: box.left - 4,
            width: box.width + 8,
            height: box.height + 8,
            borderRadius: 12,
            border: "3px solid #16a34a",
            background: "transparent",
            zIndex: 10000,
          }}
        >
          <div
            className="tour-highlight-glow"
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: 12,
              border: "3px solid #16a34a",
            }}
          />
          
          {step.position === "bottom" && (
            <div
              className="tour-arrow-down"
              style={{
                position: "absolute",
                left: "50%",
                bottom: -32,
                transform: "translateX(-50%)",
                fontSize: 32,
                filter: "drop-shadow(0 0 12px rgba(22, 163, 74, 1))",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#16a34a">
                <path d="M12 4l-8 8h5v8h6v-8h5z" />
              </svg>
            </div>
          )}
          
          {step.position === "top" && (
            <div
              className="tour-arrow-up"
              style={{
                position: "absolute",
                left: "50%",
                top: -32,
                transform: "translateX(-50%)",
                fontSize: 32,
                filter: "drop-shadow(0 0 12px rgba(22, 163, 74, 1))",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#16a34a">
                <path d="M12 20l8-8h-5V4H9v8H4z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {step && step.position !== "center" && (
        <motion.div
          key={`tooltip-${currentStep}`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute pointer-events-auto z-[10001]"
          style={{
            width: 340,
            maxWidth: "calc(100vw - 32px)",
            ...getTooltipPosition(),
          }}
        >
          <div
            style={{
              background: "linear-gradient(145deg, #022c22 0%, #064e3b 100%)",
              borderRadius: 20,
              padding: "18px 20px 16px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(22,163,74,0.3)",
              border: "2px solid #16a34a",
            }}
          >
            <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === currentStep ? 28 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: i === currentStep ? "#16a34a" : "#065f46",
                    transition: "all 0.3s",
                    flexShrink: 0,
                  }}
                />
              ))}
              {!isFirst && !isLast && (
                <span style={{ marginLeft: "auto", color: "#34d399", fontSize: 12, fontWeight: 600 }}>
                  {currentStep + 1}/{totalSteps}
                </span>
              )}
            </div>

            <div>
              <h3 style={{ color: "#ecfdf5", fontSize: 18, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.3 }}>
                {t(step.titleKey)}
              </h3>
              <p style={{ color: "#a7f3d0", fontSize: 14, margin: "0 0 16px", lineHeight: 1.6 }}>
                {t(step.descKey)}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={handlePrev}
                disabled={isFirst}
                style={{
                  background: isFirst ? "transparent" : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: isFirst ? "#6b7280" : "#d1fae5",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isFirst ? "default" : "pointer",
                  fontFamily: "inherit",
                  opacity: isFirst ? 0.5 : 1,
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <ChevronLeft size={16} />
                {t("tour.back")}
              </button>

              {!isLast && (
                <button
                  onClick={closeTour}
                  style={{
                    background: "transparent", border: "none",
                    color: "#6b7280", fontSize: 12,
                    cursor: "pointer", fontFamily: "inherit",
                    padding: "10px 8px",
                  }}
                >
                  {t("tour.skip")}
                </button>
              )}

              <button
                onClick={handleNext}
                style={{
                  background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                  border: "none", color: "#fff",
                  borderRadius: 12, padding: "12px 20px",
                  fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 4px 14px rgba(22, 163, 74, 0.4)",
                  marginLeft: "auto", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {isLast ? t("tour.done") : t("tour.next")}
                {!isLast && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {step && step.position === "center" && (
        <motion.div
          key="center-tooltip"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-[10001] pointer-events-auto"
          style={{
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(145deg, #022c22 0%, #064e3b 100%)",
              borderRadius: 24, padding: "32px 36px 28px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(22,163,74,0.3)",
              border: "2px solid #16a34a",
              textAlign: "center", width: 340,
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>💊</div>
            <h3 style={{ color: "#ecfdf5", fontSize: 26, fontWeight: 800, margin: "0 0 12px" }}>
              {t(step.titleKey)}
            </h3>
            <p style={{ color: "#a7f3d0", fontSize: 15, margin: "0 0 28px", lineHeight: 1.6 }}>
              {t(step.descKey)}
            </p>
            <button
              onClick={handleNext}
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                border: "none", color: "#fff",
                borderRadius: 14, padding: "14px 36px",
                fontSize: 16, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 6px 20px rgba(22, 163, 74, 0.45)",
              }}
            >
              {t("tour.startTour")}
            </button>
          </div>
        </motion.div>
      )}

      {isLast && step && (
        <motion.div
          key="final-tooltip"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-[10001] pointer-events-auto"
          style={{
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(145deg, #022c22 0%, #064e3b 100%)",
              borderRadius: 24, padding: "32px 36px 28px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(22,163,74,0.3)",
              border: "2px solid #16a34a",
              textAlign: "center", width: 340,
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h3 style={{ color: "#ecfdf5", fontSize: 26, fontWeight: 800, margin: "0 0 12px" }}>
              {language === "hi" ? "हो गया!" : "You're All Set!"}
            </h3>
            <p style={{ color: "#a7f3d0", fontSize: 15, margin: "0 0 28px", lineHeight: 1.6 }}>
              {language === "hi" 
                ? "MediMind आपको स्वस्थ रखने को तैयार है!"
                : "MediMind is ready to help you stay healthy!"}
            </p>
            <button
              onClick={handleComplete}
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                border: "none", color: "#fff",
                borderRadius: 14, padding: "14px 36px",
                fontSize: 16, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 6px 20px rgba(22, 163, 74, 0.45)",
              }}
            >
              {t("tour.done")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}