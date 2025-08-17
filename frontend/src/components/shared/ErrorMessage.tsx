import React from "react";

interface ErrorMessageProps {
  error: string | null;
  className?: string;
  variant?: "error" | "warning" | "info";
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  className = "",
  variant = "error" 
}) => {
  if (!error) return null;

  const variantStyles = {
    error: "bg-red-100 border-red-400 text-red-700",
    warning: "bg-yellow-100 border-yellow-400 text-yellow-700",
    info: "bg-blue-100 border-blue-400 text-blue-700"
  };

  return (
    <div 
      className={`border px-4 py-3 rounded mb-4 ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      {error}
    </div>
  );
};