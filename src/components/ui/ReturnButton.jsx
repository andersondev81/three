// components/ui/ReturnButton.jsx
"use client"

export const ReturnButton = ({
  onClick,
  children = "Return",
  className = "",
  variant = "default",
  fixed = true, // Nova prop para controlar posicionamento
}) => {
  const baseClasses = fixed
    ? "fixed bottom-8 right-8 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 "
    : "inline-block px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 "

  const variants = {
    default: "bg-gray-200 text-gray-700 hover:bg-gray-300",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    dark: "bg-gray-800 text-white hover:bg-gray-700",
    pink: "bg-pink-500 text-white hover:bg-pink-600 hover:shadow-pink-300",
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export default ReturnButton
