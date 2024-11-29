// pages/HomePage.tsx
import React from "react";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#E4C6A0]">
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
          <h2 className="text-[#4A3728] text-2xl font-bold">
            Tournament Manager
          </h2>
          <p className="text-[#6B5744] mt-2">
            A companion app for LetsPlayScrabble.com
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link
            to="/tournaments/manager"
            className="group relative h-[200px] flex"
          >
            <div className="absolute inset-0 bg-red-600 opacity-10 group-hover:opacity-20 transition-opacity" />
            <div
              className="relative bg-[#FAF1DB] p-8 rounded border-2 border-[#4A3728] shadow-lg
                          transform group-hover:-translate-y-1 transition-transform flex-1 flex flex-col"
            >
              <h2 className="text-xl font-bold text-[#4A3728] mb-3">
                Tournament Manager
              </h2>
              <p className="text-[#6B5744]">
                Manage tournaments, view standings, and track results
              </p>
            </div>
          </Link>

          <Link to="/admin" className="group relative h-[200px] flex">
            <div className="absolute inset-0 bg-blue-600 opacity-10 group-hover:opacity-20 transition-opacity" />
            <div
              className="relative bg-[#FAF1DB] p-8 rounded border-2 border-[#4A3728] shadow-lg
                          transform group-hover:-translate-y-1 transition-transform flex-1 flex flex-col"
            >
              <h2 className="text-xl font-bold text-[#4A3728] mb-3">
                Admin Interface
              </h2>
              <p className="text-[#6B5744]">
                Administrative tools and settings
              </p>
            </div>
          </Link>
        </div>

        <div className="text-center mt-12 text-[#4A3728] text-sm">
          <p>
            Built for{" "}
            <a
              href="https://letsplayscrabble.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#6B5744]"
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