import React from "react";

interface LoadingErrorWrapperProps {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  noDataMessage?: string;
}

export const LoadingErrorWrapper: React.FC<LoadingErrorWrapperProps> = ({
  loading,
  error,
  children,
  noDataMessage = "No data available",
}) => {
  if (loading) {
    return <div className="text-black p-2">Loading...</div>;
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-black">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
