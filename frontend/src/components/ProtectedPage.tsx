// components/ProtectedPage.tsx
import React from "react";
import { useRequireAuth } from "../hooks/useRequireAuth";

export const ProtectedPage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useRequireAuth();

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return <>{children}</>;
};
