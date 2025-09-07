import React from "react";
import { Link } from "react-router-dom";

import AdminInterface from "../../components/admin/AdminInterface";
import { ApiService } from "../../services/interfaces";
import { useThemeContext } from "../../context/ThemeContext";

const CurrentMatchAdminPage: React.FC<{ apiService: ApiService }> = ({ apiService }) => {
  const { theme } = useThemeContext();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-end">
        <Link
          to="/overlay/misc"
          className={`${theme.colors.cardBackground} ${theme.colors.textPrimary} px-4 py-2 rounded-md ${theme.colors.hoverBackground} transition-colors border-2 ${theme.colors.primaryBorder}`}
        >
          Open Stats Overlay
        </Link>
      </div>
      <AdminInterface apiService={apiService} />
    </div>
  );
};

export default CurrentMatchAdminPage;
