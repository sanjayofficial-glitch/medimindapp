"use client";

import React from 'react';
import { cn } from "@/lib/utils";

interface ClockTimePickerProps {
  hour: string;
  minute: string;
  period: string;
  onHourChange: (h: string) => void;
  onMinuteChange: (m: string) => void;
  onPeriodChange: (p: string) => void;
}

export const ClockTimePicker = ({ 
  hour, 
  minute, 
  period, 
  onHourChange, 
  onMinuteChange, 
  onPeriodChange 
}: ClockTimePickerProps) => {
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Digital Display */}
      <div className="flex items-center justify-center gap-3 py-8 bg-white rounded-3xl border-2 border-emerald-100 shadow-[inset_0_2px_10px_rgba(16,185,129,0.05)]">
        <div className="flex flex-col items-center min-w-[60px]">
          <span className={cn(
            "text-5xl sm:text-6xl font-black tabular-nums transition-colors duration-300",
            hour ? "text-emerald-600" : "text-emerald-100"
          )}>
            {hour.padStart(2, '0') || "00"}
          </span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Hour</span>
        </div>
        
        <span className="text-4xl sm:text-5xl font-black text-emerald-200 mb-6">:</span>
        
        <div className="flex flex-col items-center min-w-[60px]">
          <span className={cn(
            "text-5xl sm:text-6xl font-black tabular-nums transition-colors duration-300",
            minute ? "text-emerald-600" : "text-emerald-100"
          )}>
            {minute || "00"}
          </span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Min</span>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          {['AM', 'PM'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 active:scale-95",
                period === p 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-105" 
                  : "bg-emerald-50 text-emerald-400 hover:bg-emerald-100"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Selection Grids */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Select Hour</label>
            {hour && <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Selected: {hour}</span>}
          </div>
          <div className="grid grid-cols-6 gap-2">
            {hours.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => onHourChange(h)}
                className={cn(
                  "h-11 rounded-xl text-sm font-bold transition-all active:scale-90 touch-manipulation",
                  hour === h 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105 z-10" 
                    : "bg-white border border-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200"
                )}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Select Minute</label>
            {minute && <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Selected: {minute}</span>}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {minutes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onMinuteChange(m)}
                className={cn(
                  "h-11 rounded-xl text-sm font-bold transition-all active:scale-90 touch-manipulation",
                  minute === m 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105 z-10" 
                    : "bg-white border border-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};