import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  id: number;
  username: string;
  exp: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userId: number | null;
  username: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const validateToken = (
    token: string | null,
  ): { isValid: boolean; payload?: JWTPayload } => {
    if (!token) return { isValid: false };

    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const currentTime = Date.now() / 1000;

      return {
        isValid: decoded.exp > currentTime,
        payload: decoded,
      };
    } catch {
      return { isValid: false };
    }
  };

  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    userId: number | null;
    username: string | null;
  }>(() => {
    const token = localStorage.getItem("token");
    const { isValid, payload } = validateToken(token);

    return {
      isAuthenticated: isValid,
      userId: payload?.id || null,
      username: payload?.username || null,
    };
  });

  // Check token validity periodically
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const { isValid, payload } = validateToken(token);

      if (!isValid && authState.isAuthenticated) {
        logout();
      } else if (
        isValid &&
        (!authState.isAuthenticated || authState.userId !== payload?.id)
      ) {
        // Update state if token is valid but state is out of sync
        setAuthState({
          isAuthenticated: true,
          userId: payload?.id || null,
          username: payload?.username || null,
        });
      }
    };

    const interval = setInterval(checkAuth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.userId]);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const { isValid, payload } = validateToken(token);

    if (isValid && payload) {
      setAuthState({
        isAuthenticated: true,
        userId: payload.id,
        username: payload.username,
      });
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setAuthState({
      isAuthenticated: false,
      userId: null,
      username: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authState.isAuthenticated,
        userId: authState.userId,
        username: authState.username,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
