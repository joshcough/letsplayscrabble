import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/ThemeContext";

type NavPath = "/" | "/tournaments/manager" | "/overlays";
type AdminPath = "/admin" | "/admin/current-match" | "/admin/notifications";

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, username, userId } = useAuth();
  const { theme } = useThemeContext();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [userDropdownPosition, setUserDropdownPosition] = useState({ top: 0, right: 0 });
  const [adminDropdownPosition, setAdminDropdownPosition] = useState({ top: 0, left: 0 });
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const adminButtonRef = useRef<HTMLButtonElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or on window resize/scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check user dropdown
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node) && 
          userButtonRef.current && !userButtonRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      // Check admin dropdown
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node) && 
          adminButtonRef.current && !adminButtonRef.current.contains(event.target as Node)) {
        setIsAdminDropdownOpen(false);
      }
    };

    const handleWindowEvents = () => {
      if (isUserDropdownOpen) {
        calculateUserDropdownPosition();
      }
      if (isAdminDropdownOpen) {
        calculateAdminDropdownPosition();
      }
    };

    const handleScroll = () => {
      setIsUserDropdownOpen(false);
      setIsAdminDropdownOpen(false);
    };

    if (isUserDropdownOpen || isAdminDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleWindowEvents);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleWindowEvents);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isUserDropdownOpen, isAdminDropdownOpen]);

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
      case "/overlays":
        return "Overlays";
    }
  };

  const getAdminActiveClass = (): string => {
    if (location.pathname.startsWith('/admin')) {
      return `${theme.colors.hoverBackground} ${theme.colors.pageTextPrimary || theme.colors.textPrimary}`;
    }
    return "";
  };

  const getAdminLabel = (path: AdminPath): string => {
    switch (path) {
      case "/admin":
        return "Admin Home";
      case "/admin/current-match":
        return "Current Match";
      case "/admin/notifications":
        return "Notification Management";
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const calculateUserDropdownPosition = () => {
    if (userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setUserDropdownPosition({
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right, // Distance from right edge
      });
    }
  };

  const calculateAdminDropdownPosition = () => {
    if (adminButtonRef.current) {
      const rect = adminButtonRef.current.getBoundingClientRect();
      setAdminDropdownPosition({
        top: rect.bottom + 8, // 8px gap below button
        left: rect.left, // Align with left edge of button
      });
    }
  };

  const toggleUserDropdown = () => {
    if (!isUserDropdownOpen) {
      calculateUserDropdownPosition();
    }
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsAdminDropdownOpen(false); // Close admin dropdown
  };

  const toggleAdminDropdown = () => {
    if (!isAdminDropdownOpen) {
      calculateAdminDropdownPosition();
    }
    setIsAdminDropdownOpen(!isAdminDropdownOpen);
    setIsUserDropdownOpen(false); // Close user dropdown
  };

  const paths: NavPath[] = ["/", "/tournaments/manager", "/overlays"];
  const adminPaths: AdminPath[] = ["/admin", "/admin/current-match", "/admin/notifications"];

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
            
            {/* Admin Dropdown */}
            {username && userId && (
              <div className="relative">
                <button
                  ref={adminButtonRef}
                  onClick={toggleAdminDropdown}
                  className={`inline-flex items-center px-4 py-2 mt-3 mb-3
                            ${theme.colors.pageTextPrimary || theme.colors.textPrimary} font-medium rounded
                            ${theme.colors.hoverBackground} hover:${theme.colors.pageTextSecondary || theme.colors.textSecondary}
                            transition-colors duration-200 ${getAdminActiveClass()}`}
                >
                  Admin
                  <svg 
                    className={`ml-2 h-4 w-4 transition-transform ${isAdminDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isAdminDropdownOpen && createPortal(
                  <div 
                    ref={adminDropdownRef}
                    className="fixed w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-[9999]"
                    style={{
                      top: `${adminDropdownPosition.top}px`,
                      left: `${adminDropdownPosition.left}px`,
                    }}
                  >
                    <div className="py-1">
                      {adminPaths.map((adminPath) => (
                        <Link
                          key={adminPath}
                          to={adminPath}
                          onClick={() => setIsAdminDropdownOpen(false)}
                          className={`block px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-200 ${
                            location.pathname === adminPath 
                              ? 'text-blue-600 bg-blue-50 font-medium' 
                              : 'text-gray-700'
                          }`}
                        >
                          {getAdminLabel(adminPath)}
                        </Link>
                      ))}
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            )}
          </div>
          <div className="flex items-center">
            {username && userId && (
              <div className="relative">
                <button
                  ref={userButtonRef}
                  onClick={toggleUserDropdown}
                  className={`inline-flex items-center px-4 py-2
                            ${theme.colors.pageTextPrimary || theme.colors.textPrimary} font-medium rounded
                            ${theme.colors.hoverBackground} hover:${theme.colors.pageTextSecondary || theme.colors.textSecondary}
                            transition-colors duration-200`}
                >
                  {username}
                  <svg 
                    className={`ml-2 h-4 w-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserDropdownOpen && createPortal(
                  <div 
                    ref={userDropdownRef}
                    className="fixed w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-[9999]"
                    style={{
                      top: `${userDropdownPosition.top}px`,
                      right: `${userDropdownPosition.right}px`,
                    }}
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs text-gray-500 border-b">
                        ID: {userId}
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        Logout
                      </button>
                    </div>
                  </div>,
                  document.body
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
