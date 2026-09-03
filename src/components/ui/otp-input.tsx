"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type OtpInputProps = {
  length?: number;
  onComplete?: (value: string) => void;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export function OtpInput({
  length = 6,
  onComplete,
  onChange,
  className,
  disabled = false,
}: OtpInputProps) {
  const [digits, setDigits] = useState(() => Array.from({ length }, () => ""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigit(index: number, raw: string) {
    const value = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    onChange?.(next.join(""));

    if (value && index < length - 1) refs.current[index + 1]?.focus();
    if (next.every(Boolean)) onComplete?.(next.join(""));
  }

  function handleKeyDown(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div className={cn("grid grid-cols-6 gap-2", className)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          aria-label={`OTP digit ${index + 1}`}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => updateDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event.key)}
          className="focus-ring aspect-square min-w-0 rounded-xl border border-input bg-card text-center text-lg font-semibold text-foreground transition focus:border-primary"
        />
      ))}
    </div>
  );
}
