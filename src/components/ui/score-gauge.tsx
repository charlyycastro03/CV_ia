"use client"

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ScoreGaugeProps {
  value: number // 0 to 100
  size?: number
  strokeWidth?: number
  delay?: number
}

// Interpola entre 252 (Violeta), 38 (Ámbar) y 150 (Verde)
function getScoreColor(value: number) {
  if (value <= 50) {
    // 0 -> 50: Interpola de 252 a 398 (38)
    const t = value / 50
    let hue = 252 + (398 - 252) * t
    if (hue > 360) hue -= 360
    
    const sat = 70 + (85 - 70) * t
    const light = 68 + (58 - 68) * t
    return `hsl(${hue}, ${sat}%, ${light}%)`
  } else {
    // 50 -> 100: Interpola de 38 a 150
    const t = (value - 50) / 50
    const hue = 38 + (150 - 38) * t
    const sat = 85 + (65 - 85) * t
    const light = 58 + (50 - 58) * t
    return `hsl(${hue}, ${sat}%, ${light}%)`
  }
}

export function ScoreGauge({ value, size = 64, strokeWidth = 6, delay = 0 }: ScoreGaugeProps) {
  const shouldReduceMotion = useReducedMotion()
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? value : 0)
  
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  useEffect(() => {
    if (shouldReduceMotion) return

    let startTime: number
    let animationFrame: number
    const duration = 1000 // 1s
    const startValue = 0

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = timestamp - startTime - (delay * 1000)

      if (progress < 0) {
        animationFrame = requestAnimationFrame(animate)
        return
      }

      if (progress < duration) {
        const easeOutQuart = 1 - Math.pow(1 - progress / duration, 4)
        setDisplayValue(Math.round(startValue + (value - startValue) * easeOutQuart))
        animationFrame = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, delay, shouldReduceMotion])

  const color = getScoreColor(value)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={!shouldReduceMotion ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute flex items-center justify-center">
        <span className="font-mono text-lg font-bold" style={{ color }}>
          {displayValue}
        </span>
      </div>
    </div>
  )
}
