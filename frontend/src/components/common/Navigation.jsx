// components/common/Navigation.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "bg-[#4A3728] text-[#FAF1DB]" : "";
  };

  return (
    <nav className="bg-[#E4C6A0] border-b-4 border-[#4A3728]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-2">
            {["/", "/tournaments/manager", "/admin"].map((path) => {
              const label =
                path === "/"
                  ? "Home"
                  : path === "/tournaments/manager"
                    ? "Tournament Manager"
                    : "Admin";
              return (
                <Link
                  key={path}
                  to={path}
                  className={`inline-flex items-center px-4 py-2 mt-3 mb-3
                            text-[#4A3728] font-medium rounded
                            hover:bg-[#4A3728] hover:text-[#FAF1DB]
                            transition-colors duration-200 ${isActive(path)}`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
