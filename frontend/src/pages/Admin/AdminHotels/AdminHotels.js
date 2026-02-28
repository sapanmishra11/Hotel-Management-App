import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Edit, XCircle, CheckCircle } from "lucide-react";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import API from "../../../api/axios";
import "./AdminHotels.scss";

const HotelAdminList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const urlPage = parseInt(queryParams.get("page")) || 1;

  const [hotels, setHotels] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: urlPage,
    totalPages: 1,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const pathParts = location.pathname.split("/");
  const basePath = `/${pathParts[1]}`;

  const fetchHotels = async (page) => {
    setLoading(true);
    try {
      const response = await API.get(`/api/hotels?page=${page}&limit=10`);
      if (response.data.success) {
        setHotels(response.data.hotels);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
      toast.error("Failed to load hotels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlPage !== pagination.currentPage) {
      setPagination((prev) => ({ ...prev, currentPage: urlPage }));
    }
  }, [urlPage]);

  useEffect(() => {
    fetchHotels(pagination.currentPage);
  }, [pagination.currentPage]);

  const downloadExcel = () => {
    const dataToExport = hotels.map((hotel) => ({
      ID: hotel.id,
      Hotel_Name: hotel.hotel_name,
      City: hotel.city,
      State: hotel.state,
      Base_Price: `Rs. ${hotel.base_price}`,
      Status: hotel.availability_status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hotels");
    XLSX.writeFile(
      workbook,
      `Hotel_Inventory_Report_Page_${pagination.currentPage}.xlsx`,
    );
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Hotel List Report - Page ${pagination.currentPage}`, 14, 15);
    const tableColumn = ["ID", "Hotel Name", "Location", "Price", "Status"];
    const tableRows = hotels.map((h) => [
      h.id,
      h.hotel_name,
      `${h.city}, ${h.state}`,
      `Rs. ${h.base_price}`,
      h.availability_status,
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`Hotel_Inventory_Report_Page_${pagination.currentPage}.pdf`);
  };

  const handlePageClick = (pageNum) => {
    navigate(`${location.pathname}?page=${pageNum}`);
  };

  const toggleHotelStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "online" ? "offline" : "online";
    setIsProcessing(true);
    try {
      await API.patch(`api/hotels/status/${id}`, { status: nextStatus });
      toast.success(`Hotel is now ${nextStatus}`);
      fetchHotels(pagination.currentPage);
    } catch (err) {
      toast.error("Status update failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="table-wrapper boxed-layout">
        <div className="table-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div className="title-section">
            <h2>Hotel List</h2>
            <p>Manage your properties and pricing</p>
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
              onClick={() => navigate(`${basePath}/hotels/add`)}
              className="add-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Add New Hotel
            </button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Property Details</th>
              <th>Location</th>
              <th>Base Price</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="status-cell">
                  Loading your properties...
                </td>
              </tr>
            ) : hotels.length === 0 ? (
              <tr>
                <td colSpan="5" className="status-cell">
                  No hotels found.
                </td>
              </tr>
            ) : (
              hotels.map((hotel) => (
                <tr key={hotel.id}>
                  <td>
                    <div className="hotel-cell">
                      <span className="hotel-name">{hotel.hotel_name}</span>
                      <span className="hotel-id">ID: #{hotel.id}</span>
                    </div>
                  </td>
                  <td>
                    {hotel.city}, {hotel.state}
                  </td>
                  <td className="font-mono">₹{hotel.base_price}</td>
                  <td>
                    <span
                      className={`status-badge ${hotel.availability_status?.toLowerCase()}`}
                    >
                      {hotel.availability_status}
                    </span>
                  </td>
                  <td className="action-cell">
                    <div className="action-group">
                      <button
                        onClick={() =>
                          navigate(`${basePath}/hotels/edit/${hotel.id}`)
                        }
                        className="edit-btn"
                        disabled={isProcessing}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className={`toggle-btn ${hotel.availability_status === "online" ? "off" : "on"}`}
                        disabled={isProcessing}
                        onClick={() =>
                          toggleHotelStatus(hotel.id, hotel.availability_status)
                        }
                      >
                        {hotel.availability_status === "online" ? (
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

        <div className="pagination-footer">
          <div className="entries-info">
            Showing{" "}
            <span>
              {hotels.length > 0 ? (pagination.currentPage - 1) * 10 + 1 : 0}
            </span>{" "}
            to{" "}
            <span>
              {Math.min(pagination.currentPage * 10, pagination.totalItems)}
            </span>{" "}
            of <span>{pagination.totalItems}</span> entries
          </div>
          <div className="pagination-controls">
            <button
              disabled={pagination.currentPage === 1 || loading}
              onClick={() => handlePageClick(pagination.currentPage - 1)}
            >
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (num) => (
                <button
                  key={num}
                  className={pagination.currentPage === num ? "active" : ""}
                  onClick={() => handlePageClick(num)}
                >
                  {num}
                </button>
              ),
            )}
            <button
              disabled={
                pagination.currentPage === pagination.totalPages || loading
              }
              onClick={() => handlePageClick(pagination.currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelAdminList;
