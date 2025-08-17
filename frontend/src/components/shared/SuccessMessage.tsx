import React from "react";

interface SuccessMessageProps {
  message: string | null;
  className?: string;
  autoHide?: boolean;
  duration?: number;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ 
  message, 
  className = "",
  autoHide = false,
  duration = 3000
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoHide && message) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, autoHide, duration]);

  if (!message || !visible) return null;

  return (
    <div 
      className={`bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 ${className}`}
      role="status"
    >
      {message}
    </div>
  );
};