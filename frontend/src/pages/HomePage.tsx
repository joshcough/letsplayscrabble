import React, { useEffect } from "react";
import { Link } from "react-router-dom";

import { ApiService } from "../services/interfaces";
import { useThemeContext } from "../context/ThemeContext";

const HomePage: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
  const { theme } = useThemeContext();

  useEffect(() => {
    document.title = "LPS: Home";
  }, []);

  return (
    <div>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-12">
          <a
            href="https://letsplayscrabble.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transform hover:scale-105 transition-transform"
          >
            <img
              src="/letsplayscrabble.png"
              alt="LetsPlayScrabble.com"
              className="h-24 object-contain"
            />
          </a>
        </div>

        <div className="text-center mb-12">
          <h2 className={`${theme.colors.pageTextPrimary || theme.colors.textPrimary} text-2xl font-bold`}>
            Tournament Manager
          </h2>
          <p className={`${theme.colors.pageTextSecondary || theme.colors.textSecondary} mt-2`}>
            A companion app for LetsPlayScrabble.com
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Link
            to="/tournaments/manager"
            className="group relative h-[200px] flex"
          >
            <div className="absolute inset-0 bg-red-600 opacity-10 group-hover:opacity-20 transition-opacity" />
            <div
              className={`relative ${theme.colors.cardBackground} p-8 rounded border-2 ${theme.colors.primaryBorder} ${theme.colors.shadowColor} shadow-lg
                          transform group-hover:-translate-y-1 transition-transform flex-1 flex flex-col`}
            >
              <h2 className={`text-xl font-bold ${theme.colors.textPrimary} mb-3`}>
                Tournament Manager
              </h2>
              <p className={theme.colors.textSecondary}>
                Manage tournaments, view standings, and track results
              </p>
            </div>
          </Link>

          <Link to="/admin" className="group relative h-[200px] flex">
            <div className="absolute inset-0 bg-blue-600 opacity-10 group-hover:opacity-20 transition-opacity" />
            <div
              className={`relative ${theme.colors.cardBackground} p-8 rounded border-2 ${theme.colors.primaryBorder} ${theme.colors.shadowColor} shadow-lg
                          transform group-hover:-translate-y-1 transition-transform flex-1 flex flex-col`}
            >
              <h2 className={`text-xl font-bold ${theme.colors.textPrimary} mb-3`}>
                Admin Interface
              </h2>
              <p className={theme.colors.textSecondary}>Choose the current live pairing</p>
            </div>
          </Link>

          <Link to="/overlays" className="group relative h-[200px] flex">
            <div className="absolute inset-0 bg-green-600 opacity-10 group-hover:opacity-20 transition-opacity" />
            <div
              className={`relative ${theme.colors.cardBackground} p-8 rounded border-2 ${theme.colors.primaryBorder} ${theme.colors.shadowColor} shadow-lg
                          transform group-hover:-translate-y-1 transition-transform flex-1 flex flex-col`}
            >
              <h2 className={`text-xl font-bold ${theme.colors.textPrimary} mb-3`}>
                Tournament Overlays
              </h2>
              <p className={theme.colors.textSecondary}>
                OBS overlays for live streaming tournaments
              </p>
            </div>
          </Link>
        </div>

        <div className={`text-center mt-12 ${theme.colors.pageTextPrimary || theme.colors.textPrimary} text-sm`}>
          <p>
            Built for{" "}
            <a
              href="https://letsplayscrabble.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`underline hover:${theme.colors.pageTextSecondary || theme.colors.textSecondary}`}
            >
              LetsPlayScrabble.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
