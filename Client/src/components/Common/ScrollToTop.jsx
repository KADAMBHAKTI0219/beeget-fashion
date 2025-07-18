import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Component to scroll to top when route changes
 */
const ScrollToTop = () => {
  const { pathname } = useLocation()
  
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [pathname])
  
  return null
}

export default ScrollToTop