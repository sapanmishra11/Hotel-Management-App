import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, XCircle, CheckCircle } from "lucide-react";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API from "../../../api/axios";

const LocationManager = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const urlPage = parseInt(queryParams.get("page")) || 1;

  const pathParts = location.pathname.split("/");
  const basePath = `/${pathParts[1]}`;

  const [pagination, setPagination] = useState({
    currentPage: urlPage,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  useEffect(() => {
    if (urlPage !== pagination.currentPage) {
      setPagination((prev) => ({ ...prev, currentPage: urlPage }));
    }
  }, [urlPage]);

  useEffect(() => {
    fetchLocations(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchLocations = async (page) => {
    setLoading(true);
    try {
      const res = await API.get("api/hotels/locations/paginated", {
        params: { page, limit: 10 },
      });

      if (res.data.success) {
        setLocations(res.data.locations);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching locations:", err);
      toast.error("Failed to load location directory");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    const dataToExport = locations.map((loc) => ({
      Country: loc.country_name,
      State: loc.state_name,
      City_Area: loc.city_name,
      Status: loc.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Locations");
    XLSX.writeFile(workbook, `Locations_Page_${pagination.currentPage}.xlsx`);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Location Directory - Page ${pagination.currentPage}`, 14, 15);
    const tableColumn = ["Country", "State", "City / Area", "Status"];
    const tableRows = locations.map((loc) => [
      loc.country_name,
      loc.state_name,
      loc.city_name,
      loc.status,
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`Locations_Page_${pagination.currentPage}.pdf`);
  };

  const handlePageClick = (pageNum) => {
    navigate(`${location.pathname}?page=${pageNum}`);
  };

  const toggleLocationStatus = async (cityId, cityName, currentStatus) => {
    if (!cityId) return toast.error("Cannot toggle: City ID missing");
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    setIsProcessing(true);
    try {
      await API.patch(`api/hotels/locations/cities/status/${cityId}`, {
        status: nextStatus,
      });
      toast.success(`${cityName} is now ${nextStatus}`);
      fetchLocations(pagination.currentPage);
    } catch (err) {
      toast.error("Failed to update location status");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="table-wrapper boxed-layout">
        <div className="table-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div className="title-section">
            <h2>Location Directory</h2>
            <p>Manage operational areas</p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={downloadExcel}
              className="add-btn"
              style={{
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FaFileExcel size={16} /> Excel
            </button>
            <button
              onClick={downloadPDF}
              className="add-btn"
              style={{
                backgroundColor: "#ef4444",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FaFilePdf size={16} /> PDF
            </button>
            <button
              onClick={() => navigate(`${basePath}/hotels/locations/add`)}
              className="add-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Add New Location
            </button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Country</th>
              <th>State</th>
              <th>City</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="status-cell">
                  Loading location directory...
                </td>
              </tr>
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan="5" className="status-cell">
                  No locations found.
                </td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc.city_id}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{loc.country_name}</span>
                  </td>
                  <td>
                    <span className="location-text muted">
                      {loc.state_name}
                    </span>
                  </td>
                  <td>
                    <span className="location-text">{loc.city_name}</span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${loc.status === "active" ? "online" : "offline"}`}
                    >
                      {loc.status}
                    </span>
                  </td>
                  <td className="action-cell">
                    <div className="action-group">
                      <button
                        className={`toggle-btn ${loc.status === "active" ? "off" : "on"}`}
                        disabled={isProcessing || !loc.city_id}
                        onClick={() =>
                          toggleLocationStatus(
                            loc.city_id,
                            loc.city_name,
                            loc.status,
                          )
                        }
                      >
                        {loc.status === "active" ? (
                          <XCircle size={16} color="#ef4444" />
                        ) : (
                          <CheckCircle size={16} color="#22c55e" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && pagination.totalItems > 0 && (
          <div className="pagination-footer">
            <div className="entries-info">
              Showing{" "}
              <span>
                {pagination.totalItems > 0
                  ? (pagination.currentPage - 1) * (pagination.limit || 10) + 1
                  : 0}
              </span>{" "}
              to{" "}
              <span>
                {Math.min(
                  pagination.currentPage * (pagination.limit || 10),
                  pagination.totalItems,
                ) || 0}
              </span>{" "}
              of <span>{pagination.totalItems || 0}</span> locations
            </div>

            <div className="pagination-controls">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageClick(pagination.currentPage - 1)}
              >
                Previous
              </button>
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((num) => (
                <button
                  key={num}
                  className={pagination.currentPage === num ? "active" : ""}
                  onClick={() => handlePageClick(num)}
                >
                  {num}
                </button>
              ))}
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageClick(pagination.currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationManager;
