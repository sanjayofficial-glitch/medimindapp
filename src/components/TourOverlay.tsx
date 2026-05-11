import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X, Play } from "lucide-react";
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
  const prevStepRef = useRef(currentStep);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const totalSteps = steps.length;

  useEffect(() => {
    prevStepRef.current = currentStep;
  }, [currentStep]);

  const updateBox = useCallback(() => {
    if (!step?.target || !containerRef.current) {
      setBox(null);
      return;
    }

    const targetEl = document.getElementById(step.target);
    if (!targetEl) {
      setBox(null);
      return;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const padding = 8;

    setBox({
      top: targetRect.top - containerRect.top - padding,
      left: targetRect.left - containerRect.left - padding,
      width: targetRect.width + padding * 2,
      height: targetRect.height + padding * 2,
    });
  }, [step?.target]);

  useEffect(() => {
    if (isOpen) {
      updateBox();
      window.addEventListener("resize", updateBox);
      window.addEventListener("scroll", updateBox, true);
      const scrollEl = document.querySelector("[data-tour-container]");
      if (scrollEl) {
        scrollEl.addEventListener("scroll", updateBox, true);
      }
      return () => {
        window.removeEventListener("resize", updateBox);
        window.removeEventListener("scroll", updateBox, true);
      };
    }
  }, [isOpen, updateBox]);

  useEffect(() => {
    if (isOpen && step?.target) {
      updateBox();
    }
  }, [isOpen, step, updateBox]);

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
    if (isFirst) {
      return;
    }
    prevStep();
  }, [isFirst, prevStep]);

  const getTooltipPosition = () => {
    if (!box) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    if (step.position === "center") {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    if (step.position === "bottom") {
      const topPos = box.top + box.height + 200;
      return {
        top: `${Math.min(topPos, window.innerHeight - 350)}px`,
        left: "50%",
        transform: "translateX(-50%)",
      };
    }

    const topPos = box.top - 220;
    return {
      top: `${Math.max(topPos, 40)}px`,
      left: "50%",
      transform: "translateX(-50%)",
    };
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] overflow-hidden ${className}`}
      style={{
        position: "fixed",
        inset: 0,
        background: "transparent",
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.75); }
          50% { box-shadow: 0 0 0 8px rgba(22, 163, 74, 0.2), 0 0 0 9999px rgba(0, 0, 0, 0.75); }
        }
        @keyframes floatDown {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-8px); }
        }
        .tour-spotlight-glow {
          animation: pulse 2s ease-in-out infinite;
        }
        .tour-float-down {
          animation: floatDown 1.5s ease-in-out infinite;
        }
        .tour-float-up {
          animation: floatUp 1.5s ease-in-out infinite;
        }
      `}</style>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
          }}
        >
          {box && (
            <>
              <div
                className="tour-spotlight-glow"
                style={{
                  position: "absolute",
                  top: box.top,
                  left: box.left,
                  width: box.width,
                  height: box.height,
                  borderRadius: 16,
                  border: "3px solid #16a34a",
                  background: "transparent",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: box.top - 1,
                  left: box.left - 1,
                  width: box.width + 2,
                  height: box.height + 2,
                  borderRadius: 16,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
                }}
              />
              {step?.position === "bottom" && (
                <div
                  className="tour-float-down"
                  style={{
                    position: "absolute",
                    left: box.left + box.width / 2 - 14,
                    top: box.top + box.height + 16,
                    fontSize: 28,
                    filter: "drop-shadow(0 0 12px rgba(22, 163, 74, 0.9))",
                    lineHeight: 1,
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M12 4l-8 8h5v8h6v-8h5z" />
                  </svg>
                </div>
              )}
              {step?.position === "top" && (
                <div
                  className="tour-float-up"
                  style={{
                    position: "absolute",
                    left: box.left + box.width / 2 - 14,
                    top: box.top - 28,
                    fontSize: 28,
                    filter: "drop-shadow(0 0 12px rgba(22, 163, 74, 0.9))",
                    lineHeight: 1,
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M12 20l8-8h-5V4H9v8H4z" />
                  </svg>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {step && (
        <motion.div
          key={`tooltip-${currentStep}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="absolute z-[10000]"
          style={{
            width: 320,
            maxWidth: "calc(100vw - 40px)",
            ...getTooltipPosition(),
          }}
        >
          <div
            style={{
              background: "linear-gradient(145deg, #0f172a 0%, #1a2e1e 100%)",
              borderRadius: 24,
              padding: "20px 20px 16px",
              boxShadow: "0 24px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(22,163,74,0.18)",
              border: "1px solid rgba(22,163,74,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === currentStep ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: i === currentStep ? "#16a34a" : "#1e3a2a",
                    transition: "all 0.3s",
                    flexShrink: 0,
                  }}
                />
              ))}
              {!isFirst && !isLast && (
                <span
                  style={{
                    marginLeft: "auto",
                    color: "#16a34a",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {currentStep + 1}/{totalSteps}
                </span>
              )}
            </div>

            <div>
              <h3
                style={{
                  color: "#f1f5f9",
                  fontSize: language === "hi" ? 16 : 17,
                  fontWeight: 800,
                  margin: "0 0 8px",
                  lineHeight: 1.3,
                }}
              >
                {t(step.titleKey)}
              </h3>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: language === "hi" ? 13 : 13.5,
                  margin: "0 0 18px",
                  lineHeight: 1.6,
                }}
              >
                {t(step.descKey)}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={handlePrev}
                disabled={isFirst}
                style={{
                  background: isFirst ? "transparent" : "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: isFirst ? "#334155" : "#94a3b8",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isFirst ? "default" : "pointer",
                  fontFamily: "inherit",
                  opacity: isFirst ? 0.5 : 1,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ChevronLeft size={16} />
                {t("tour.back")}
              </button>

              {!isLast && (
                <button
                  onClick={closeTour}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#64748b",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
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
                  border: "none",
                  color: "#fff",
                  borderRadius: 14,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 18px rgba(22, 163, 74, 0.45)",
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
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

      {isLast && step && (
        <motion.div
          key="final-tooltip"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-[10001]"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(145deg, #0f172a 0%, #1a2e1e 100%)",
              borderRadius: 28,
              padding: "32px 36px 28px",
              boxShadow: "0 24px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(22,163,74,0.18)",
              border: "1px solid rgba(22,163,74,0.12)",
              textAlign: "center",
              width: 300,
            }}
          >
            <div
              style={{
                fontSize: 48,
                marginBottom: 16,
              }}
            >
              🎉
            </div>
            <h3
              style={{
                color: "#f1f5f9",
                fontSize: 22,
                fontWeight: 800,
                margin: "0 0 10px",
              }}
            >
              {t("tour.done")}
            </h3>
            <p
              style={{
                color: "#94a3b8",
                fontSize: 14,
                margin: "0 0 24px",
                lineHeight: 1.6,
              }}
            >
              {language === "hi"
                ? "MediMind आपको स्वस्थ रखने को तैयार है! कभी भी मदद सेक्शन से दोबारा टूर देखें।"
                : "MediMind is ready to help you stay healthy! You can revisit the tour anytime from the Help section."}
            </p>
            <button
              onClick={handleComplete}
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                border: "none",
                color: "#fff",
                borderRadius: 14,
                padding: "14px 32px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 18px rgba(22, 163, 74, 0.45)",
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