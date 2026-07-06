"use client"

import { useReducedMotion } from "framer-motion"

export function AmbientBackground() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-background">
      {/* Noise Texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Glow Ambient Blob */}
      <div 
        className={`absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full blur-[120px] opacity-20 mix-blend-screen pointer-events-none ${!shouldReduceMotion ? 'animate-pulse' : ''}`}
        style={{
          background: 'radial-gradient(circle, hsl(var(--signal-low) / 0.4) 0%, hsl(var(--signal-mid) / 0.1) 40%, transparent 70%)',
          animationDuration: '10s'
        }}
      />
    </div>
  )
}
