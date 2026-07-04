"use client"

import { useEffect, useState } from 'react'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function FadeIn({ children, delay = 0, direction = 'up' }: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const directionClasses = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: 'translate-x-4',
    right: '-translate-x-4'
  }

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        isVisible 
          ? 'opacity-100 translate-x-0 translate-y-0' 
          : `opacity-0 ${directionClasses[direction]}`
      }`}
    >
      {children}
    </div>
  )
}
