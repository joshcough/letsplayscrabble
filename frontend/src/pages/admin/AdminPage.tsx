import React from "react";
import { Link } from "react-router-dom";

import AdminInterface from "../../components/admin/AdminInterface";

const AdminPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-end">
        <Link
          to="/overlay/misc"
          className="bg-[#FAF1DB] text-[#4A3728] px-4 py-2 rounded-md hover:bg-[#4A3728] hover:text-[#FAF1DB] transition-colors border-2 border-[#4A3728]"
        >
          Open Stats Overlay
        </Link>
      </div>
      <AdminInterface />
    </div>
  );
};

export default AdminPage;
