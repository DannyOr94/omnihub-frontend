import { useState, useEffect, useRef } from 'react'

/**
 * Hook para detectar si un elemento está en el viewport
 */
export function useInView(threshold = 0.3) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return [ref, inView]
}

/**
 * Hook para animar un contador numérico
 */
export function useCounter(target, duration = 1800, shouldStart = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!shouldStart) return

    setCount(0)
    let start = null

    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      
      // Easing function (Cubic Out)
      const eased = 1 - Math.pow(1 - progress, 3)
      
      setCount(Math.floor(eased * target))

      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }, [target, duration, shouldStart])

  return count
}
