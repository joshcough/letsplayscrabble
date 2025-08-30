import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/ThemeContext";

type NavPath = "/" | "/tournaments/manager" | "/admin" | "/overlays" | "/overlays/original";

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, username, userId } = useAuth();
  const { theme } = useThemeContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getActiveClass = (path: NavPath): string => {
    if (location.pathname === path) {
      return `${theme.colors.hoverBackground} ${theme.colors.pageTextPrimary || theme.colors.textPrimary}`;
    }
    return "";
  };

  const getLabel = (path: NavPath): string => {
    switch (path) {
      case "/":
        return "Home";
      case "/tournaments/manager":
        return "Tournament Manager";
      case "/admin":
        return "Admin";
      case "/overlays":
        return "Overlays";
      case "/overlays/original":
        return "Original Overlays";
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const paths: NavPath[] = ["/", "/tournaments/manager", "/admin", "/overlays", "/overlays/original"];

  return (
    <nav className={`${theme.colors.cardBackground} border-b-4 ${theme.colors.primaryBorder}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-2">
            {paths.map((path) => (
              <Link
                key={path}
                to={path}
                className={`inline-flex items-center px-4 py-2 mt-3 mb-3
                          ${theme.colors.pageTextPrimary || theme.colors.textPrimary} font-medium rounded
                          ${theme.colors.hoverBackground} hover:${theme.colors.pageTextSecondary || theme.colors.textSecondary}
                          transition-colors duration-200 ${getActiveClass(path)}`}
              >
                {getLabel(path)}
              </Link>
            ))}
          </div>
          <div className="flex items-center">
            {username && userId && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`inline-flex items-center px-4 py-2
                            ${theme.colors.pageTextPrimary || theme.colors.textPrimary} font-medium rounded
                            ${theme.colors.hoverBackground} hover:${theme.colors.pageTextSecondary || theme.colors.textSecondary}
                            transition-colors duration-200`}
                >
                  {username}
                  <svg 
                    className={`ml-2 h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs text-gray-500 border-b">
                        ID: {userId}
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
