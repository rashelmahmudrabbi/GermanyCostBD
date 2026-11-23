'use client';

import { motion } from 'framer-motion';
import { toBanglaDigits } from '@/lib/utils';

interface ProgressRingProps {
  percent: number;
  arranged: number;
  total: number;
  language: 'bn' | 'en';
  size?: number;
}

export function ProgressRing({ percent, arranged, total, language, size = 100 }: ProgressRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className="text-primary"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-mono">
          {language === 'bn' ? toBanglaDigits(String(percent)) : percent}%
        </span>
        <span className="text-[10px] text-muted-foreground">
          {language === 'bn' ? `${toBanglaDigits(String(arranged))}/${toBanglaDigits(String(total))}` : `${arranged}/${total}`}
        </span>
      </div>
    </div>
  );
}
