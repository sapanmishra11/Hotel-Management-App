import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar/Navbar";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import AdminLayout from "./pages/Admin/AdminLayout/AdminLayout";
import AdminLogs from "./pages/Admin/AdminLogs/AdminLogs";
import AdminHotels from "./pages/Admin/AdminHotels/AdminHotels";
import AdminStaff from "./pages/Admin/AdminStaff/AdminStaff";
import AddStaff from "./pages/Admin/AdminStaff/AddStaff/AddStaff";
import EditStaff from "./pages/Admin/AdminStaff/EditStaff/EditStaff";
import AddHotel from "./pages/Admin/AdminHotels/AddHotel/AddHotel";
import EditHotel from "./pages/Admin/AdminHotels/EditHotel/EditHotel";
import StaffDashboard from "./pages/StaffDashboard/StaffDashboard";
import UserHome from "./pages/UserHome/UserHome";
import HotelList from "./pages/UserHome/HotelList/HotelList";
import LocationManager from "./pages/Admin/LocationManager/LocationManager";
import AddLocation from "./pages/Admin/LocationManager/AddLocation/AddLocation";
import DishManager from "./pages/Admin/DishManagement/DishManagement";
import AddDish from "./pages/Admin/DishManagement/AddDish/AddDish";
import RoleAccess from "./pages/Admin/RoleAccessControl/RoleAccessControl";
import RoomSelection from "./pages/UserHome/RoomSelection/RoomSelection";
import Checkout from "./pages/UserHome/Checkout/Checkout";
import SetPassword from "./pages/SetPassword/SetPassword";
import UserDashboard from "./pages/UserHome/UserDashboard/UserDashboard";
import AccountSettings from "./pages/AccountSettings/AccountSettings";
import HotelGlobalInfo from "./pages/Admin/Homepage/HomepageEdit";
import Homepage from "./pages/UserHome/Homepage/Homepage";

import ProtectedRoute from "./utils/ProtectedRoute";

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />
      <Navbar />
      <div className="App">
        <Routes>
          <Route path="/" element={<UserHome />}>
            <Route index element={<Homepage />} />
            <Route path="search" element={<HotelList />} />
            <Route path="home" element={<HotelList />} />
            <Route path="hotel/:id" element={<RoomSelection />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route
            path="/:role/:userId/settings"
            element={
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="Admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="homepage-editor" element={<HotelGlobalInfo />} />

            <Route
              path="staff"
              element={
                <ProtectedRoute permission="staff">
                  <AdminStaff />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff/add"
              element={
                <ProtectedRoute permission="staff">
                  <AddStaff />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff/edit/:id"
              element={
                <ProtectedRoute permission="staff">
                  <EditStaff />
                </ProtectedRoute>
              }
            />
            <Route
              path="role-access"
              element={
                <ProtectedRoute allowedRole="Admin">
                  <RoleAccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/edit/:id"
              element={
                <ProtectedRoute permission="hotels">
                  <EditHotel />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/locations"
              element={
                <ProtectedRoute permission="hotels">
                  <LocationManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/locations/add"
              element={
                <ProtectedRoute permission="hotels">
                  <AddLocation />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/dishes"
              element={
                <ProtectedRoute permission="hotels">
                  <DishManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/dishes/add"
              element={
                <ProtectedRoute permission="hotels">
                  <AddDish />
                </ProtectedRoute>
              }
            />
            <Route index element={<Navigate to="logs" replace />} />
            <Route
              path="logs"
              element={
                <ProtectedRoute permission="logs">
                  <AdminLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels"
              element={
                <ProtectedRoute permission="hotels">
                  <AdminHotels />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/add"
              element={
                <ProtectedRoute permission="hotels">
                  <AddHotel />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/edit/:id"
              element={
                <ProtectedRoute permission="hotels">
                  <EditHotel />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff"
              element={
                <ProtectedRoute permission="staff">
                  <AdminStaff />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRole="Staff">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="staff"
              element={
                <ProtectedRoute permission="staff">
                  <AdminStaff />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff/add"
              element={
                <ProtectedRoute permission="staff">
                  <AddStaff />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff/edit/:id"
              element={
                <ProtectedRoute permission="staff">
                  <EditStaff />
                </ProtectedRoute>
              }
            />
            <Route index element={<StaffDashboard />} />
            <Route
              path="role-access"
              element={
                <ProtectedRoute allowedRole="Admin">
                  <RoleAccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/edit/:id"
              element={
                <ProtectedRoute permission="hotels">
                  <EditHotel />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/locations"
              element={
                <ProtectedRoute permission="hotels">
                  <LocationManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/locations/add"
              element={
                <ProtectedRoute permission="hotels">
                  <AddLocation />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/dishes"
              element={
                <ProtectedRoute permission="hotels">
                  <DishManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/dishes/add"
              element={
                <ProtectedRoute permission="hotels">
                  <AddDish />
                </ProtectedRoute>
              }
            />
            <Route index element={<Navigate to="logs" replace />} />
            <Route
              path="logs"
              element={
                <ProtectedRoute permission="logs">
                  <AdminLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels"
              element={
                <ProtectedRoute permission="hotels">
                  <AdminHotels />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/add"
              element={
                <ProtectedRoute permission="hotels">
                  <AddHotel />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/edit/:id"
              element={
                <ProtectedRoute permission="hotels">
                  <EditHotel />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff"
              element={
                <ProtectedRoute permission="staff">
                  <AdminStaff />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRole="User">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="staff"
              element={
                <ProtectedRoute permission="staff">
                  <AdminStaff />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff/add"
              element={
                <ProtectedRoute permission="staff">
                  <AddStaff />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff/edit/:id"
              element={
                <ProtectedRoute permission="staff">
                  <EditStaff />
                </ProtectedRoute>
              }
            />
            <Route path=":userId/dashboard" element={<UserDashboard />} />
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route
              path="role-access"
              element={
                <ProtectedRoute allowedRole="Admin">
                  <RoleAccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/edit/:id"
              element={
                <ProtectedRoute permission="hotels">
                  <EditHotel />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/locations"
              element={
                <ProtectedRoute permission="hotels">
                  <LocationManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/locations/add"
              element={
                <ProtectedRoute permission="hotels">
                  <AddLocation />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/dishes"
              element={
                <ProtectedRoute permission="hotels">
                  <DishManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/dishes/add"
              element={
                <ProtectedRoute permission="hotels">
                  <AddDish />
                </ProtectedRoute>
              }
            />
            <Route index element={<Navigate to="logs" replace />} />
            <Route
              path="logs"
              element={
                <ProtectedRoute permission="logs">
                  <AdminLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels"
              element={
                <ProtectedRoute permission="hotels">
                  <AdminHotels />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/add"
              element={
                <ProtectedRoute permission="hotels">
                  <AddHotel />
                </ProtectedRoute>
              }
            />
            <Route
              path="hotels/edit/:id"
              element={
                <ProtectedRoute permission="hotels">
                  <EditHotel />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff"
              element={
                <ProtectedRoute permission="staff">
                  <AdminStaff />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRole="User">
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
