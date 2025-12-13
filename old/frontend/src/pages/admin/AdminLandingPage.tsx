import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useThemeContext } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const AdminLandingPage: React.FC = () => {
  const { theme } = useThemeContext();
  const { userId } = useAuth();

  useEffect(() => {
    document.title = "LPS: Admin";
  }, []);

  return (
    <div className={`min-h-screen ${theme.colors.pageBackground}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold ${theme.colors.textPrimary} mb-4`}>
            Tournament Administration
          </h1>
          <p className={`text-xl ${theme.colors.textSecondary}`}>
            Manage live tournament operations, notifications, and overlay systems
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Match Admin */}
          <div className={`${theme.colors.cardBackground} rounded-lg shadow-md border-2 ${theme.colors.primaryBorder}`}>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🎮</span>
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${theme.colors.textPrimary}`}>
                    Current Match
                  </h2>
                  <p className={`${theme.colors.textSecondary}`}>
                    Live tournament game management
                  </p>
                </div>
              </div>
              <p className={`${theme.colors.textSecondary} mb-6`}>
                Control the current game display, manage player selections, and monitor live match progress. 
                Essential for running tournament overlays and managing game flow.
              </p>
              <Link
                to="/admin/current-match"
                className={`inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors font-medium`}
              >
                Manage Current Match
              </Link>
            </div>
          </div>

          {/* Notification System */}
          <div className={`${theme.colors.cardBackground} rounded-lg shadow-md border-2 ${theme.colors.primaryBorder}`}>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🔔</span>
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${theme.colors.textPrimary}`}>
                    Notifications
                  </h2>
                  <p className={`${theme.colors.textSecondary}`}>
                    Advanced notification queue management
                  </p>
                </div>
              </div>
              <p className={`${theme.colors.textSecondary} mb-6`}>
                Test and manage notification system with real-time queue controls. 
                Send high score and winning streak notifications, manage priority queues, 
                and control overlay displays.
              </p>
              <Link
                to="/admin/notifications"
                className={`inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors font-medium`}
              >
                Manage Notifications
              </Link>
            </div>
          </div>

          {/* User Management - Only visible to admin (user ID 1) */}
          {userId === 1 && (
            <div className={`${theme.colors.cardBackground} rounded-lg shadow-md border-2 ${theme.colors.primaryBorder}`}>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${theme.colors.textPrimary}`}>
                      User Management
                    </h2>
                    <p className={`${theme.colors.textSecondary}`}>
                      Create and manage user accounts
                    </p>
                  </div>
                </div>
                <p className={`${theme.colors.textSecondary} mb-6`}>
                  Add new users, manage existing accounts, and control user access.
                  Create credentials for tournament directors and overlay operators.
                </p>
                <Link
                  to="/dev/user-management"
                  className={`inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors font-medium`}
                >
                  Manage Users
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminLandingPage;