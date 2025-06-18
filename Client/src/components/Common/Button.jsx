import { forwardRef } from 'react'

const Button = forwardRef((
  { 
    children, 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    disabled = false,
    type = 'button',
    className = '',
    onClick,
    ...props 
  }, 
  ref
) => {
  // Base classes for all buttons
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200'
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-teal hover:bg-teal/90 text-white focus:ring-teal/50',
    secondary: 'bg-white border border-charcoal text-charcoal hover:bg-gray-50 focus:ring-charcoal/30',
    outline: 'bg-transparent border border-teal text-teal hover:bg-teal/10 focus:ring-teal/30',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/50',
    ghost: 'bg-transparent text-charcoal hover:bg-gray-100 focus:ring-gray-500/30'
  }
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-2.5 px-5',
    xl: 'text-lg py-3 px-6'
  }
  
  // Disabled classes
  const disabledClasses = 'opacity-50 cursor-not-allowed'
  
  // Full width class
  const widthClass = fullWidth ? 'w-full' : ''
  
  // Combine all classes
  const buttonClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    disabled ? disabledClasses : '',
    widthClass,
    className
  ].join(' ')
  
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button