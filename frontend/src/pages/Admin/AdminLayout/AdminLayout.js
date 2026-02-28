import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  List,
  Hotel,
  Users,
  ChevronRight,
  ChevronDown,
  Database,
  MapPin,
  Utensils,
  ShieldCheck,
  LayoutDashboard,
  Home,
} from "lucide-react";
import "./AdminLayout.scss";

const AdminLayout = () => {
  const role = localStorage.getItem("role");
  const savedPages = localStorage.getItem("allowedPages");
  const permissions = savedPages ? JSON.parse(savedPages) : [];

  const [isHotelsOpen, setIsHotelsOpen] = useState(true);

  const getPath = (pageName) => {
    if (role === "Admin") return `/admin/${pageName}`;
    if (role === "Staff") return `/staff/${pageName}`;
    if (role === "User") return `/user/${pageName}`;
    return `/${pageName}`;
  };

  const showSidebar =
    role === "Admin" || role === "Staff" || permissions.length > 0;

  return (
    <div className={`admin-wrapper ${!showSidebar ? "no-sidebar" : ""}`}>
      {showSidebar && (
        <aside className="sidebar">
          <div className="sidebar-brand">
            <h2>{role} Panel</h2>
          </div>

          <nav className="sidebar-nav">
            <p className="nav-label">Main Menu</p>

            {role === "Staff" && (
              <NavLink
                to="/staff"
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <LayoutDashboard size={18} /> <span>Staff Portal</span>
              </NavLink>
            )}

            {(role === "Admin" || permissions.includes("role-access")) && (
              <NavLink
                to={getPath("role-access")}
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <ShieldCheck size={18} /> <span>Role Access Control</span>
              </NavLink>
            )}

            {permissions.includes("logs") && (
              <NavLink
                to={getPath("logs")}
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <List size={18} /> <span>Booking Logs</span>
              </NavLink>
            )}

            {permissions.includes("hotels") && (
              <div className={`nav-group ${isHotelsOpen ? "open" : ""}`}>
                <div
                  className="nav-item group-header"
                  onClick={() => setIsHotelsOpen(!isHotelsOpen)}
                >
                  <Hotel size={18} />
                  <span>Hotels</span>
                  {isHotelsOpen ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </div>

                {isHotelsOpen && (
                  <div className="sub-menu">
                    <NavLink
                      to={getPath("hotels")}
                      end
                      className={({ isActive }) =>
                        isActive ? "sub-item active" : "sub-item"
                      }
                    >
                      <Database size={14} /> <span>Hotels List</span>
                    </NavLink>

                    <NavLink
                      to={getPath("hotels/locations")}
                      className={({ isActive }) =>
                        isActive ? "sub-item active" : "sub-item"
                      }
                    >
                      <MapPin size={14} /> <span>Location Manager</span>
                    </NavLink>

                    <NavLink
                      to={getPath("hotels/dishes")}
                      className={({ isActive }) =>
                        isActive ? "sub-item active" : "sub-item"
                      }
                    >
                      <Utensils size={14} /> <span>Dish Manager</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}

            {permissions.includes("staff") && (
              <NavLink
                to={getPath("staff")}
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <Users size={18} /> <span>Staff Management</span>
              </NavLink>
            )}

            {role === "Admin" && (
              <NavLink
                to="/admin/homepage-editor"
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <Home size={18} /> <span>Edit Homepage</span>
              </NavLink>
            )}
          </nav>
        </aside>
      )}

      <div className="main-container">
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
