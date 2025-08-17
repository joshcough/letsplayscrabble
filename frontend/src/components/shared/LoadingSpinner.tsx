import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  size = "medium",
  className = "",
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-[#4A3728]/20 border-t-[#4A3728] rounded-full animate-spin`}
      />
      {message && <p className="mt-2 text-[#6B5744]">{message}</p>}
    </div>
  );
};
