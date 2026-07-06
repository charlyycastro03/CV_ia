"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface SlideInProps {
  children: ReactNode
  direction?: "up" | "down" | "left" | "right"
  delay?: number
  duration?: number
  className?: string
}

export function SlideIn({ 
  children, 
  direction = "up", 
  delay = 0, 
  duration = 0.4,
  className = "" 
}: SlideInProps) {
  
  const getInitialY = () => {
    if (direction === "up") return 20
    if (direction === "down") return -20
    return 0
  }
  
  const getInitialX = () => {
    if (direction === "left") return 20
    if (direction === "right") return -20
    return 0
  }

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: getInitialY(),
        x: getInitialX()
      }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        x: 0
      }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
