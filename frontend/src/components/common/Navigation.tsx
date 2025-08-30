import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

type NavPath = "/" | "/tournaments/manager" | "/admin" | "/overlays" | "/overlays/modern";

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, username, userId } = useAuth();
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

  const isActive = (path: NavPath): string => {
    return location.pathname === path ? "bg-[#4A3728] text-[#FAF1DB]" : "";
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
      case "/overlays/modern":
        return "Modern Overlays";
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const paths: NavPath[] = ["/", "/tournaments/manager", "/admin", "/overlays", "/overlays/modern"];

  return (
    <nav className="bg-[#E4C6A0] border-b-4 border-[#4A3728]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-2">
            {paths.map((path) => (
              <Link
                key={path}
                to={path}
                className={`inline-flex items-center px-4 py-2 mt-3 mb-3
                          text-[#4A3728] font-medium rounded
                          hover:bg-[#4A3728] hover:text-[#FAF1DB]
                          transition-colors duration-200 ${isActive(path)}`}
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
                  className="inline-flex items-center px-4 py-2
                            text-[#4A3728] font-medium rounded
                            hover:bg-[#4A3728] hover:text-[#FAF1DB]
                            transition-colors duration-200"
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
