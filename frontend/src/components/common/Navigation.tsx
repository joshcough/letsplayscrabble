import React from "react";
import { Link, useLocation } from "react-router-dom";

type NavPath = "/" | "/tournaments/manager" | "/admin";

const Navigation: React.FC = () => {
  const location = useLocation();

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
    }
  };

  const paths: NavPath[] = ["/", "/tournaments/manager", "/admin"];

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
        </div>
      </div>
    </nav>
  );
};

export default Navigation;