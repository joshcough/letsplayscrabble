import React from "react";

import { ErrorMessage } from "./ErrorMessage";
import { LoadingSpinner } from "./LoadingSpinner";
import { SuccessMessage } from "./SuccessMessage";

interface FormFeedbackProps {
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  loadingMessage?: string;
  className?: string;
}

/**
 * Unified feedback component for forms and data operations
 * Shows loading, error, or success states based on props
 */
export const FormFeedback: React.FC<FormFeedbackProps> = ({
  loading = false,
  error = null,
  success = null,
  loadingMessage = "Loading...",
  className = "",
}) => {
  if (loading) {
    return <LoadingSpinner message={loadingMessage} className={className} />;
  }

  if (error) {
    return <ErrorMessage error={error} className={className} />;
  }

  if (success) {
    return <SuccessMessage message={success} className={className} autoHide />;
  }

  return null;
};
