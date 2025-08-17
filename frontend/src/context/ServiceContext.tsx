// frontend/src/context/ServiceContext.tsx
// Context for dependency injection of service implementations

import React, { createContext, useContext, ReactNode } from "react";
import { ApiService } from "../services/interfaces";
import { HttpApiService } from "../services/httpService";

// Create the context
const ServiceContext = createContext<ApiService | null>(null);

// Provider component
interface ServiceProviderProps {
  children: ReactNode;
  apiService?: ApiService; // Optional for testing - defaults to HttpApiService
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({
  children,
  apiService = new HttpApiService(), // Default implementation
}) => {
  return (
    <ServiceContext.Provider value={apiService}>
      {children}
    </ServiceContext.Provider>
  );
};

// Hook to use the service
export const useApiService = (): ApiService => {
  const service = useContext(ServiceContext);
  if (!service) {
    throw new Error("useApiService must be used within a ServiceProvider");
  }
  return service;
};