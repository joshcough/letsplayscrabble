import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

type NavPath = "/" | "/tournaments/manager" | "/admin" | "/overlays" | "/overlays/modern";

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, username, userId } = useAuth();

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
          <div className="flex items-center space-x-4">
            {username && userId && (
              <span className="text-[#4A3728]/70 text-sm italic">
                {username} (ID: {userId})
              </span>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2
                        text-[#4A3728] font-medium rounded
                        hover:bg-[#4A3728] hover:text-[#FAF1DB]
                        transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
